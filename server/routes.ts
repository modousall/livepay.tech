import { type Server } from "http";

import type { Express } from "express";

import { setupPaymentWebhooks } from "./lib/payment-webhooks";
import {
  handleVendorWasenderWebhook,
  handleVendorWasenderStatus,
  handleVendorWasenderConnection,
  setupVendorWasenderWebhook,
  getVendorWasenderStatus,
} from "./lib/vendor-wasender-webhooks";

/**
 * Minimal routes for development server
 * All data operations are handled directly by Firebase in the client
 * This server is only for:
 * - Local development (Vite proxy)
 * - Health check endpoint
 * - WhatsApp webhook (to be moved to Firebase Cloud Functions for production)
 * - Payment webhooks (Wave, Orange Money, etc.)
 * - Multi-WABA Wasender webhooks (vendor-specific)
 */

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup payment webhooks with idempotence
  setupPaymentWebhooks(app);

  // Multi-WABA Wasender webhooks - vendor-specific
  app.post(
    "/api/webhooks/wasender/:vendorId",
    (req, res, next) => {
      handleVendorWasenderWebhook(req, res).catch(next);
    }
  );

  // Webhook status notifications
  app.post(
    "/api/webhooks/wasender/:vendorId/status",
    (req, res, next) => {
      handleVendorWasenderStatus(req, res).catch(next);
    }
  );

  // Webhook connection events
  app.post(
    "/api/webhooks/wasender/:vendorId/connection",
    (req, res, next) => {
      handleVendorWasenderConnection(req, res).catch(next);
    }
  );

  // Admin endpoints for Wasender setup
  app.post(
    "/api/admin/vendors/:vendorId/setup-wasender-webhook",
    (req, res, next) => {
      setupVendorWasenderWebhook(req, res).catch(next);
    }
  );

  app.get(
    "/api/admin/vendors/:vendorId/wasender-status",
    (req, res, next) => {
      getVendorWasenderStatus(req, res).catch(next);
    }
  );

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      mode: "firebase",
      message: "LivePay API - Data stored in Firebase"
    });
  });

  // WhatsApp webhook verification (GET request from Meta)
  app.get("/api/webhooks/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // The verify token should be configured in Firebase environment
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "livepay-webhook-verify";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp Webhook] Verified successfully");
      res.status(200).send(challenge);
    } else {
      console.log("[WhatsApp Webhook] Verification failed");
      res.sendStatus(403);
    }
  });

  // WhatsApp webhook messages (POST from Meta)
  // In production, this will be handled by Firebase Cloud Functions
  app.post("/api/webhooks/whatsapp", (req, res) => {
    const body = req.body;
    
    console.log("[WhatsApp Webhook] Received:", JSON.stringify(body, null, 2));
    
    // Always respond 200 to Meta quickly
    res.sendStatus(200);
    
    // TODO: Process webhook in Firebase Cloud Functions
    // For now, just log the incoming messages
    if (body.object === "whatsapp_business_account") {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === "messages") {
            const value = change.value;
            const messages = value?.messages || [];
            
            for (const message of messages) {
              console.log("[WhatsApp] Message from:", message.from);
              console.log("[WhatsApp] Content:", message.text?.body || message.type);
            }
          }
        }
      }
    }
  });

  return httpServer;
}
