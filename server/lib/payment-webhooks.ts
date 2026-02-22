/**
 * Payment Webhook Handlers
 * Gère les webhooks des fournisseurs de paiement avec idempotence
 */

import { Request, Response } from "express";
import * as crypto from "crypto";
import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";
import { logger, logWebhookEvent, logPaymentEvent } from "../logger";

// Mock Firestore for local development without Firebase credentials
// In production, this will be initialized by Firebase Cloud Functions
const db = admin.firestore();

// Types
type WebhookStatus = "received" | "processing" | "completed" | "failed";

interface WebhookLog {
  id: string;
  provider: string;
  reference: string;
  orderId: string;
  status: WebhookStatus;
  receivedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  error?: string;
  attempts: number;
}

/**
 * Génère une clé d'idempotence unique
 */
function generateIdempotencyKey(provider: string, reference: string): string {
  return `webhook_${provider}_${reference}`;
}

/**
 * Vérifie si le webhook a déjà été traité
 */
async function checkWebhookAlreadyProcessed(
  provider: string,
  reference: string
): Promise<WebhookLog | null> {
  const idempotencyKey = generateIdempotencyKey(provider, reference);

  try {
    const docRef = db.doc(`webhook_logs/${idempotencyKey}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as WebhookLog | undefined;

    // Si déjà complété, retourner le log
    if (data?.status === "completed") {
      logger.info("[WEBHOOK] Already processed", {
        provider,
        reference,
        orderId: data.orderId,
      });
      return data;
    }

    // Si en cours de traitement (< 5 min), attendre
    if (data?.status === "processing" && data.receivedAt) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (data.receivedAt.toDate() > fiveMinutesAgo) {
        logger.warn("[WEBHOOK] Still processing", {
          provider,
          reference,
          lastAttempt: data.receivedAt.toDate(),
        });
        return data;
      }
    }

    return null; // Permettre le retry
  } catch (error) {
    logger.error("[WEBHOOK] Error checking idempotency", { error });
    return null;
  }
}

/**
 * Marque le webhook comme en cours de traitement
 */
async function markWebhookAsProcessing(
  provider: string,
  reference: string,
  orderId: string
): Promise<string> {
  const idempotencyKey = generateIdempotencyKey(provider, reference);

  await db.doc(`webhook_logs/${idempotencyKey}`).set({
    provider,
    reference,
    orderId,
    status: "processing",
    receivedAt: Timestamp.now(),
    attempts: 1,
  });

  return idempotencyKey;
}

/**
 * Marque le webhook comme complété
 */
async function markWebhookAsCompleted(idempotencyKey: string): Promise<void> {
  await db.doc(`webhook_logs/${idempotencyKey}`).update({
    status: "completed",
    completedAt: Timestamp.now(),
  });
}

/**
 * Marque le webhook comme échoué
 */
async function markWebhookAsFailed(
  idempotencyKey: string,
  error: string
): Promise<void> {
  await db.doc(`webhook_logs/${idempotencyKey}`).update({
    status: "failed",
    error,
    failedAt: Timestamp.now(),
  });
}

/**
 * Vérifie la signature du webhook Wave
 */
function verifyWaveSignature(
  signature: string,
  body: Buffer,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Handler pour le webhook Wave
 */
export async function handleWaveWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers["x-wave-signature"] as string;
  const body = req.rawBody as Buffer;
  const payload = req.body;

  logger.info("[WAVE WEBHOOK] Received", {
    signature: !!signature,
    orderId: payload.externalId,
    transferId: payload.transferId,
  });

  // 1. Vérifier la signature
  const waveSecret = process.env.WAVE_WEBHOOK_SECRET;
  if (!waveSecret || !verifyWaveSignature(signature, body, waveSecret)) {
    logger.error("[WAVE WEBHOOK] Invalid signature");
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const { externalId, status, transferId } = payload;

  // 2. Vérifier l'idempotence
  const existingLog = await checkWebhookAlreadyProcessed("wave", transferId);
  if (existingLog && existingLog.status === "completed") {
    logger.info("[WAVE WEBHOOK] Already processed", { externalId });
    res.json({ success: true, processed: false });
    return;
  }

  // 3. Marquer comme en cours de traitement
  const idempotencyKey = await markWebhookAsProcessing("wave", transferId, externalId);

  try {
    // 4. Traiter le paiement
    if (status === "COMPLETED" || status === "SUCCESS") {
      // Mettre à jour la commande
      const orderRef = db.doc(`orders/${externalId}`);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new Error(`Order not found: ${externalId}`);
      }

      const orderData = orderSnap.data();
      if (!orderData) {
        throw new Error(`Order data is empty: ${externalId}`);
      }
      
      const previousStatus = orderData.status;

      await orderRef.update({
        status: "paid",
        paymentMethod: "wave",
        pspReference: transferId,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Logger l'audit
      await db.collection("order_audit_logs").add({
        orderId: externalId,
        vendorId: orderData.vendorId,
        action: "payment_received",
        previousStatus,
        newStatus: "paid",
        changedBy: "webhook",
        createdAt: Timestamp.now(),
      });

      // Logger le succès
      logWebhookEvent("wave", "payment_notification", externalId, true);
      logPaymentEvent({
        orderId: externalId,
        status: "succeeded",
        amount: orderData.totalAmount,
        paymentMethod: "wave",
      });

      // TODO: Envoyer la confirmation WhatsApp au client

      // 5. Marquer comme complété
      await markWebhookAsCompleted(idempotencyKey);

      res.json({ success: true });
    } else {
      // Paiement échoué ou annulé
      await db.doc(`orders/${externalId}`).update({
        status: "pending",
        updatedAt: Timestamp.now(),
      });

      logWebhookEvent("wave", "payment_failed", externalId, false);
      logPaymentEvent({
        orderId: externalId,
        status: "failed",
        paymentMethod: "wave",
        errorCode: status,
      });

      await markWebhookAsCompleted(idempotencyKey);
      res.json({ success: true });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    logger.error("[WAVE WEBHOOK] Processing failed", {
      externalId,
      error: errorMessage,
    });

    await markWebhookAsFailed(idempotencyKey, errorMessage);

    logWebhookEvent("wave", "payment_error", externalId, false, errorMessage);
    logPaymentEvent({
      orderId: externalId,
      status: "failed",
      paymentMethod: "wave",
      errorCode: errorMessage,
    });

    res.status(500).json({ error: "Processing failed" });
  }
}

/**
 * Handler pour le webhook Orange Money
 */
export async function handleOrangeMoneyWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const payload = req.body;
  const { orderId, status, reference } = payload;

  logger.info("[ORANGE MONEY WEBHOOK] Received", { orderId, status, reference });

  // 1. Vérifier l'idempotence
  const existingLog = await checkWebhookAlreadyProcessed("orange_money", reference);
  if (existingLog && existingLog.status === "completed") {
    logger.info("[ORANGE MONEY WEBHOOK] Already processed", { orderId });
    res.json({ success: true, processed: false });
    return;
  }

  // 2. Marquer comme en cours de traitement
  const idempotencyKey = await markWebhookAsProcessing(
    "orange_money",
    reference,
    orderId
  );

  try {
    if (status === "SUCCESS" || status === "PAID") {
      // Mettre à jour la commande
      const orderRef = db.doc(`orders/${orderId}`);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new Error(`Order not found: ${orderId}`);
      }

      const orderData = orderSnap.data();
      if (!orderData) {
        throw new Error(`Order data is empty: ${orderId}`);
      }

      await orderRef.update({
        status: "paid",
        paymentMethod: "orange_money",
        pspReference: reference,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Logger l'audit
      await db.collection("order_audit_logs").add({
        orderId,
        vendorId: orderData.vendorId,
        action: "payment_received",
        previousStatus: orderData.status,
        newStatus: "paid",
        changedBy: "webhook",
        createdAt: Timestamp.now(),
      });

      logWebhookEvent("orange_money", "payment_notification", orderId, true);
      logPaymentEvent({
        orderId,
        status: "succeeded",
        amount: orderData.totalAmount,
        paymentMethod: "orange_money",
      });

      await markWebhookAsCompleted(idempotencyKey);
      res.json({ success: true });
    } else {
      await markWebhookAsCompleted(idempotencyKey);
      res.json({ success: true });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[ORANGE MONEY WEBHOOK] Processing failed", {
      orderId,
      error: errorMessage,
    });

    await markWebhookAsFailed(idempotencyKey, errorMessage);
    logWebhookEvent("orange_money", "payment_error", orderId, false, errorMessage);

    res.status(500).json({ error: "Processing failed" });
  }
}

/**
 * Routeur pour les webhooks de paiement
 * À intégrer dans server/routes.ts
 */
export function setupPaymentWebhooks(app: any): void {
  // Wave webhook
  app.post(
    "/api/webhooks/wave",
    (req: Request, res: Response, next: any) => {
      handleWaveWebhook(req, res).catch(next);
    }
  );

  // Orange Money webhook
  app.post(
    "/api/webhooks/orange-money",
    (req: Request, res: Response, next: any) => {
      handleOrangeMoneyWebhook(req, res).catch(next);
    }
  );

  // PayDunya webhook
  app.post(
    "/api/webhooks/paydunya",
    (req: Request, res: Response, next: any) => {
      handlePayDunyaWebhook(req, res).catch(next);
    }
  );

  logger.info("[WEBHOOKS] Payment webhook routes registered");
}

/**
 * Handler pour le webhook PayDunya
 * Gère les notifications de paiement avec idempotence
 */
export async function handlePayDunyaWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const payload = req.body;
  const { order_id, status, transaction_id, amount } = payload;

  logger.info("[PAYDUNYA WEBHOOK] Received", { 
    orderId: order_id, 
    status, 
    transactionId: transaction_id,
    amount 
  });

  // 1. Vérifier la signature (HMAC-SHA512)
  const paydunyaSecret = process.env.PAYDUNYA_WEBHOOK_SECRET;
  const signature = req.headers["x-paydunya-signature"] as string;
  
  if (!paydunyaSecret) {
    logger.error("[PAYDUNYA WEBHOOK] Webhook secret not configured");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  if (!signature || !verifyPayDunyaSignature(signature, payload, paydunyaSecret)) {
    logger.error("[PAYDUNYA WEBHOOK] Invalid signature", { signature: !!signature });
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // 2. Vérifier l'idempotence
  const existingLog = await checkWebhookAlreadyProcessed("paydunya", transaction_id);
  if (existingLog && existingLog.status === "completed") {
    logger.info("[PAYDUNYA WEBHOOK] Already processed", { orderId: order_id });
    res.json({ success: true, processed: false });
    return;
  }

  // 3. Marquer comme en cours de traitement
  const idempotencyKey = await markWebhookAsProcessing(
    "paydunya",
    transaction_id,
    order_id
  );

  try {
    if (status === "success" || status === "completed" || status === "paid") {
      // Mettre à jour la commande
      const orderRef = db.doc(`orders/${order_id}`);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        throw new Error(`Order not found: ${order_id}`);
      }

      const orderData = orderSnap.data();
      if (!orderData) {
        throw new Error(`Order data is empty: ${order_id}`);
      }

      await orderRef.update({
        status: "paid",
        paymentMethod: "paydunya",
        pspReference: transaction_id,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Logger l'audit
      await db.collection("order_audit_logs").add({
        orderId: order_id,
        vendorId: orderData.vendorId,
        action: "payment_received",
        previousStatus: orderData.status,
        newStatus: "paid",
        changedBy: "webhook",
        createdAt: Timestamp.now(),
      });

      logWebhookEvent("paydunya", "payment_notification", order_id, true);
      logPaymentEvent({
        orderId: order_id,
        status: "succeeded",
        amount: orderData.totalAmount,
        paymentMethod: "paydunya",
      });

      // TODO: Envoyer la confirmation WhatsApp au client

      await markWebhookAsCompleted(idempotencyKey);
      res.json({ success: true });
    } else {
      // Paiement échoué ou annulé
      await db.doc(`orders/${order_id}`).update({
        status: "pending",
        updatedAt: Timestamp.now(),
      });

      logWebhookEvent("paydunya", "payment_failed", order_id, false, status);
      logPaymentEvent({
        orderId: order_id,
        status: "failed",
        paymentMethod: "paydunya",
        errorCode: status,
      });

      await markWebhookAsCompleted(idempotencyKey);
      res.json({ success: true });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("[PAYDUNYA WEBHOOK] Processing failed", {
      orderId: order_id,
      error: errorMessage,
    });

    await markWebhookAsFailed(idempotencyKey, errorMessage);
    logWebhookEvent("paydunya", "payment_error", order_id, false, errorMessage);

    res.status(500).json({ error: "Processing failed" });
  }
}

/**
 * Vérifie la signature du webhook PayDunya
 * Algorithme: HMAC-SHA512
 */
function verifyPayDunyaSignature(
  signature: string,
  payload: any,
  secret: string
): boolean {
  const crypto = require("crypto");
  
  // Le payload doit être stringify sans espaces
  const payloadString = JSON.stringify(payload);
  
  const expectedSignature = crypto
    .createHmac("sha512", secret)
    .update(payloadString)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}
