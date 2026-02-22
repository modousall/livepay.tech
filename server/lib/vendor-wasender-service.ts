/**
 * Vendor WhatsApp Service - Multi-WABA Wasender
 * 
 * Gère les instances Wasender individuelles par vendor
 * Chaque vendor obtient sa propre instance Wasender avec son numéro
 */

import { logger } from "../logger";
import { WABAInstance } from "../../shared/types";

export interface VendorWasenderConfig {
  vendorId: string;
  apiKey: string;
  apiUrl: string;
  instanceId?: string;
  phoneNumber?: string;
  webhookSecret?: string;
}

/**
 * Service Wasender dédié à un vendor
 */
export class VendorWasenderService {
  private vendorId: string;
  private apiKey: string;
  private apiUrl: string;
  private instanceId?: string;
  private webhookSecret?: string;

  constructor(config: VendorWasenderConfig) {
    this.vendorId = config.vendorId;
    this.apiKey = config.apiKey;
    this.apiUrl = config.apiUrl;
    this.instanceId = config.instanceId;
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Vérifier la signature d'un webhook Wasender
   */
  verifyWebhookSignature(
    signature: string | undefined,
    body: any
  ): boolean {
    if (!signature || !this.webhookSecret) {
      logger.warn("[Vendor Wasender] No signature provided or webhook secret not set", {
        vendorId: this.vendorId,
      });
      return false;
    }

    const crypto = require("crypto");
    const payloadString = JSON.stringify(body);

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
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

  /**
   * Envoyer un message texte
   */
  async sendMessage(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.instanceId) {
      return {
        success: false,
        error: "No Wasender instance configured for this vendor",
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/account/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          instanceId: this.instanceId,
          to: this.formatPhoneNumber(to),
          message,
          type: "text",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error("[Vendor Wasender] Send message failed", {
          vendorId: this.vendorId,
          to,
          error: data.error || data.message,
        });
        return {
          success: false,
          error: data.error || "Failed to send message",
        };
      }

      logger.info("[Vendor Wasender] Message sent", {
        vendorId: this.vendorId,
        to,
        messageId: data.messageId || data.id,
      });

      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      logger.error("[Vendor Wasender] Send message exception", {
        vendorId: this.vendorId,
        to,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Envoyer un message avec image
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.instanceId) {
      return {
        success: false,
        error: "No Wasender instance configured for this vendor",
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/account/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          instanceId: this.instanceId,
          to: this.formatPhoneNumber(to),
          message: caption || "",
          mediaUrl: imageUrl,
          type: "image",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Failed to send image",
        };
      }

      return {
        success: true,
        messageId: data.messageId || data.id,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Obtenir le statut de l'instance
   */
  async getInstanceStatus(): Promise<{
    status: "connected" | "disconnected" | "error";
    phoneNumber?: string;
  }> {
    if (!this.instanceId) {
      return { status: "error" };
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/instances/${this.instanceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { status: "error" };
      }

      return {
        status: data.status === "connected" ? "connected" : "disconnected",
        phoneNumber: data.phone || data.phoneNumber,
      };
    } catch (error) {
      logger.error("[Vendor Wasender] Error getting instance status", {
        vendorId: this.vendorId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return { status: "error" };
    }
  }

  /**
   * Configurer le webhook pour cette instance
   * POST vers Wasender pour enregistrer l'URL de callback
   */
  async setupWebhook(webhookUrl: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    if (!this.instanceId) {
      return {
        success: false,
        error: "No Wasender instance configured",
      };
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/instances/${this.instanceId}/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            url: webhookUrl,
            events: ["message", "status", "connection"],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        logger.error("[Vendor Wasender] Webhook setup failed", {
          vendorId: this.vendorId,
          error: data.error,
        });
        return {
          success: false,
          error: data.error || "Failed to setup webhook",
        };
      }

      logger.info("[Vendor Wasender] Webhook configured", {
        vendorId: this.vendorId,
        webhookUrl,
      });

      return { success: true };
    } catch (error) {
      logger.error("[Vendor Wasender] Webhook setup exception", {
        vendorId: this.vendorId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Formater le numéro de téléphone pour Wasender
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");

    // If starts with 221 (Senegal), keep as is
    if (cleaned.startsWith("221")) {
      return cleaned;
    }

    // If 9 digits, prepend 221
    if (cleaned.length === 9) {
      return `221${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Parser webhook Wasender entrant
   */
  parseIncomingMessage(body: any): {
    from: string;
    message: string;
    type: string;
    timestamp: string;
    messageId: string;
  } | null {
    try {
      // Structure typique du webhook Wasender
      // {
      //   "event": "message",
      //   "instanceId": "...",
      //   "data": {
      //     "message": "...",
      //     "from": "22170...",
      //     "time": 1234567890,
      //     "type": "text",
      //     "id": "..."
      //   }
      // }

      const { event, data } = body;

      if (event !== "message" || !data) {
        return null;
      }

      return {
        from: data.from || data.sender,
        message: data.message || data.text || "",
        type: data.type || "text",
        timestamp: new Date(data.time * 1000).toISOString(),
        messageId: data.id || data.messageId,
      };
    } catch (error) {
      logger.error("[Vendor Wasender] Error parsing incoming message", {
        vendorId: this.vendorId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Getter pour obtenir les infos du vendor
   */
  getVendorId(): string {
    return this.vendorId;
  }

  getInstanceId(): string | undefined {
    return this.instanceId;
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret;
  }
}

/**
 * Registry para gérer les instances de service par vendor
 */
export class VendorWasenderRegistry {
  private services: Map<string, VendorWasenderService> = new Map();
  private baseApiUrl: string;
  private baseApiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.baseApiUrl = apiUrl;
    this.baseApiKey = apiKey;
  }

  /**
   * Obtenir ou créer un service pour un vendor
   */
  getService(config: VendorWasenderConfig): VendorWasenderService {
    const existing = this.services.get(config.vendorId);
    if (existing) {
      return existing;
    }

    const service = new VendorWasenderService({
      ...config,
      apiUrl: config.apiUrl || this.baseApiUrl,
      apiKey: config.apiKey || this.baseApiKey,
    });

    this.services.set(config.vendorId, service);
    return service;
  }

  /**
   * Enregistrer un service pour un vendor
   */
  registerService(vendorId: string, service: VendorWasenderService): void {
    this.services.set(vendorId, service);
  }

  /**
   * Obtenir un service existant
   */
  getExistingService(vendorId: string): VendorWasenderService | null {
    return this.services.get(vendorId) || null;
  }

  /**
   * Supprimer un service
   */
  removeService(vendorId: string): void {
    this.services.delete(vendorId);
  }

  /**
   * Obtenir tous les services
   */
  getAllServices(): VendorWasenderService[] {
    return Array.from(this.services.values());
  }
}

// Export singleton registry
let registry: VendorWasenderRegistry;

export function initVendorWasenderRegistry(): VendorWasenderRegistry {
  const apiUrl = process.env.WASENDER_API_URL || "https://api.wasenderapi.com/api/v1";
  const apiKey = process.env.WASENDER_API_KEY || "";

  if (!registry) {
    registry = new VendorWasenderRegistry(apiUrl, apiKey);
  }
  return registry;
}

export function getVendorWasenderRegistry(): VendorWasenderRegistry {
  if (!registry) {
    return initVendorWasenderRegistry();
  }
  return registry;
}
