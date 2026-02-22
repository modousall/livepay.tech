/**
 * Multi-Vendor WhatsApp Webhooks
 * 
 * Gère les webhooks Wasender pour chaque vendor individuellement
 * Route: POST /api/webhooks/wasender/:vendorId
 */

import { Request, Response } from "express";
import { logger, logWebhookEvent } from "../logger";
import {
  getVendorWasenderRegistry,
  VendorWasenderService,
} from "./vendor-wasender-service";
import { getWABAManager } from "./waba-manager";

/**
 * Webhook handler pour les messages entrants d'un vendor
 * 
 * Flow:
 * 1. Vérifier la signature
 * 2. Parser le message
 * 3. Identifier le vendor
 * 4. Traiter via AlloPermet
 * 5. Sauvegarder en Firestore
 */
export async function handleVendorWasenderWebhook(
  req: Request<{ vendorId: string }>,
  res: Response,
): Promise<void> {
  const vendorId = String(req.params.vendorId);
  const signature = req.headers["x-wasender-signature"] as string;
  const body = req.body;

  logger.info("[VENDOR WASENDER WEBHOOK] Received", {
    vendorId,
    event: body.event,
  });

  // Répondre 200 immédiatement à Wasender
  // Le traitement se fera en arrière-plan
  res.status(200).json({ success: true });

  try {
    // 1. Obtenir le service du vendor
    const registry = getVendorWasenderRegistry();
    // Dans une vraie implémentation, il faudrait charger la config du vendor
    // depuis Firestore d'abord
    const vendorService = registry.getExistingService(vendorId);

    if (!vendorService) {
      logger.warn("[VENDOR WASENDER WEBHOOK] Unknown vendor", {
        vendorId,
      });
      return;
    }

    // 2. Vérifier la signature
    if (!vendorService.verifyWebhookSignature(signature, body)) {
      logger.error("[VENDOR WASENDER WEBHOOK] Invalid signature", {
        vendorId,
      });
      return;
    }

    // 3. Parser le message entrant
    const incomingMessage = vendorService.parseIncomingMessage(body);

    if (!incomingMessage) {
      logger.warn("[VENDOR WASENDER WEBHOOK] Could not parse message", {
        vendorId,
      });
      return;
    }

    // 4. Router vers le traitement par AlloPermet
    await processVendorWhatsAppMessage({
      vendorId,
      from: incomingMessage.from,
      message: incomingMessage.message,
      messageId: incomingMessage.messageId,
      timestamp: incomingMessage.timestamp,
      type: incomingMessage.type,
    });

    logWebhookEvent("wasender_vendor", "message_received", vendorId, true);
  } catch (error) {
    logger.error("[VENDOR WASENDER WEBHOOK] Processing error", {
      vendorId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
    logWebhookEvent(
      "wasender_vendor",
      "webhook_error",
      vendorId,
      false,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Webhook handler pour les notifications de statut
 * (livraison, lecture, etc.)
 */
export async function handleVendorWasenderStatus(
  req: Request<{ vendorId: string }>,
  res: Response,
): Promise<void> {
  const vendorId = String(req.params.vendorId);
  const body = req.body;

  logger.info("[VENDOR WASENDER STATUS] Received", {
    vendorId,
    status: body.status,
    messageId: body.messageId,
  });

  // Répondre immédiatement
  res.status(200).json({ success: true });

  try {
    const { messageId, status, timestamp } = body;

    // TODO: Sauvegarder le statut du message en Firestore
    // db.collection("messages").doc(messageId).update({
    //   status: status,
    //   statusUpdatedAt: new Date(timestamp * 1000)
    // })

    logger.info("[VENDOR WASENDER STATUS] Processed", {
      vendorId,
      messageId,
      status,
    });
  } catch (error) {
    logger.error("[VENDOR WASENDER STATUS] Processing error", {
      vendorId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Webhook handler pour les événements de connexion
 */
export async function handleVendorWasenderConnection(
  req: Request<{ vendorId: string }>,
  res: Response,
): Promise<void> {
  const vendorId = String(req.params.vendorId);
  const body = req.body;

  logger.info("[VENDOR WASENDER CONNECTION] Received", {
    vendorId,
    event: body.event,
    status: body.status,
  });

  res.status(200).json({ success: true });

  try {
    const { event, status, phoneNumber } = body;

    // TODO: Mettre à jour le statut WABA en Firestore
    // db.collection("waba_instances").doc(vendorId).update({
    //   status: status,
    //   phoneNumber: phoneNumber,
    //   lastSync: new Date()
    // })

    logger.info("[VENDOR WASENDER CONNECTION] Processed", {
      vendorId,
      status,
      phoneNumber,
    });

    if (status === "connected") {
      logger.info("[VENDOR WASENDER] Instance connected", {
        vendorId,
        phoneNumber,
      });
    }
  } catch (error) {
    logger.error("[VENDOR WASENDER CONNECTION] Processing error", {
      vendorId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Traiter un message WhatsApp entrant pour un vendor
 * 
 * Integration avec AlloPermet magic-chat-engine
 */
interface VendorIncomingMessage {
  vendorId: string;
  from: string;
  message: string;
  messageId: string;
  timestamp: string;
  type: "text" | "image" | "document" | string;
}

async function processVendorWhatsAppMessage(
  data: VendorIncomingMessage
): Promise<void> {
  const { vendorId, from, message, messageId, timestamp, type } = data;

  logger.info("[VENDOR MESSAGE PROCESS] Starting", {
    vendorId,
    from,
    messageId,
    type,
  });

  try {
    // 1. Obtenir la config du vendor
    // const vendorConfig = await getVendorConfig(vendorId);

    // 2. Sauvegarder le message entrant en Firestore
    // await db.collection("vendor_messages").add({
    //   vendorId,
    //   from,
    //   message,
    //   messageId,
    //   type,
    //   timestamp: new Date(timestamp),
    //   status: "received",
    //   createdAt: new Date()
    // });

    // 3. Router vers AlloPermet
    // await orchestrator.handleIncomingMessage(message, vendorId, from);

    // 4. Optionnel: Envoyer une réponse automatique
    // if (vendorConfig.autoReplyEnabled && vendorConfig.welcomeMessage) {
    //   const registry = getVendorWasenderRegistry();
    //   const service = registry.getExistingService(vendorId);
    //   if (service) {
    //     await service.sendMessage(from, vendorConfig.welcomeMessage);
    //   }
    // }

    logger.info("[VENDOR MESSAGE PROCESS] Completed", {
      vendorId,
      messageId,
    });
  } catch (error) {
    logger.error("[VENDOR MESSAGE PROCESS] Error", {
      vendorId,
      messageId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Endpoint d'admin pour configurer le webhook Wasender pour un vendor
 * POST /api/admin/vendors/:vendorId/setup-wasender-webhook
 */
export async function setupVendorWasenderWebhook(
  req: Request<{ vendorId: string }>,
  res: Response,
): Promise<void> {
  const vendorId = req.params.vendorId as string;

  try {
    const registry = getVendorWasenderRegistry();
    const service = registry.getExistingService(vendorId);

    if (!service) {
      res.status(404).json({ error: "Vendor service not found" });
      return;
    }

    const baseUrl = process.env.APP_BASE_URL || "http://localhost:9002";
    const webhookUrl = `${baseUrl}/api/webhooks/wasender/${vendorId}`;

    const result = await service.setupWebhook(webhookUrl);

    if (result.success) {
      res.json({
        success: true,
        message: "Webhook configured successfully",
        webhookUrl,
      });
    } else {
      res.status(500).json({
        error: result.error || "Failed to setup webhook",
      });
    }
  } catch (error) {
    logger.error("[SETUP WASENDER WEBHOOK] Error", {
      vendorId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
}

/**
 * Endpoint pour obtenir le statut d'une instance Wasender d'un vendor
 * GET /api/admin/vendors/:vendorId/wasender-status
 */
export async function getVendorWasenderStatus(
  req: Request<{ vendorId: string }>,
  res: Response,
): Promise<void> {
  const vendorId = req.params.vendorId as string;

  try {
    const registry = getVendorWasenderRegistry();
    const service = registry.getExistingService(vendorId);

    if (!service) {
      res.status(404).json({ error: "Vendor service not found" });
      return;
    }

    const status = await service.getInstanceStatus();
    res.json(status);
  } catch (error) {
    logger.error("[GET WASENDER STATUS] Error", {
      vendorId,
      error:
        error instanceof Error ? error.message : "Unknown error",
    });
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Internal server error",
    });
  }
}
