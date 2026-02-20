/**
 * Wasender API Service
 * Service complet pour l'intégration Wasender (WhatsApp Gateway)
 * 
 * API Documentation: https://wasenderapi.com/docs
 */

export interface WasenderConfig {
  apiKey: string;
  apiUrl: string;
  instanceId?: string;
  webhookSecret?: string;
}

export interface WasenderMessage {
  id?: string;
  to: string;
  message: string;
  type?: "text" | "image" | "document" | "audio" | "video" | "location" | "contact";
  mediaUrl?: string;
  caption?: string;
  filename?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
}

export interface WasenderResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  data?: any;
  error?: string;
  status?: string;
}

export interface WasenderInstance {
  id: string;
  name: string;
  phone: string;
  status: "connected" | "disconnected" | "connecting";
  webhookUrl?: string;
  createdAt: string;
}

export interface WasenderWebhook {
  event: "message" | "status" | "connection";
  instanceId: string;
  data: {
    from?: string;
    to?: string;
    message?: string;
    type?: string;
    timestamp?: string;
    status?: string;
  };
}

/**
 * Service Wasender pour l'envoi et la réception de messages WhatsApp
 */
export class WasenderService {
  private config: WasenderConfig;

  constructor(config: WasenderConfig) {
    this.config = config;
  }

  /**
   * Envoyer un message texte
   */
  async sendTextMessage(to: string, message: string): Promise<WasenderResponse> {
    return this.sendMessage({
      to,
      message,
      type: "text",
    });
  }

  /**
   * Envoyer un message avec image
   */
  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<WasenderResponse> {
    return this.sendMessage({
      to,
      message: "",
      type: "image",
      mediaUrl: imageUrl,
      caption,
    });
  }

  /**
   * Envoyer un document
   */
  async sendDocumentMessage(
    to: string,
    documentUrl: string,
    filename: string,
    caption?: string
  ): Promise<WasenderResponse> {
    return this.sendMessage({
      to,
      message: "",
      type: "document",
      mediaUrl: documentUrl,
      filename,
      caption,
    });
  }

  /**
   * Envoyer un message générique
   */
  async sendMessage(message: WasenderMessage): Promise<WasenderResponse> {
    try {
      const endpoint = this.getEndpoint("sendText");
      
      const payload: any = {
        token: this.config.apiKey,
        to: message.to,
        message: message.message,
      };

      // Ajouter les paramètres optionnels selon le type
      if (message.type === "image" && message.mediaUrl) {
        payload.image = message.mediaUrl;
        if (message.caption) payload.caption = message.caption;
      } else if (message.type === "document" && message.mediaUrl) {
        payload.document = message.mediaUrl;
        if (message.filename) payload.filename = message.filename;
        if (message.caption) payload.caption = message.caption;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "HTTP error");
      }

      return {
        success: result.success || result.status === "success",
        message: result.message,
        messageId: result.messageId || result.id,
        data: result.data,
        error: result.error,
        status: result.status,
      };
    } catch (error) {
      console.error("[Wasender] Send message error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      };
    }
  }

  /**
   * Récupérer le statut d'un message
   */
  async getMessageStatus(messageId: string): Promise<WasenderResponse> {
    try {
      const endpoint = this.getEndpoint("getMessageStatus", messageId);
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      return {
        success: result.success || result.status === "success",
        message: result.message,
        data: result.data,
        error: result.error,
        status: result.status,
      };
    } catch (error) {
      console.error("[Wasender] Get status error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Récupérer les instances
   */
  async getInstances(): Promise<WasenderInstance[]> {
    try {
      const endpoint = this.getEndpoint("instances");
      
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch instances");
      }

      return result.data || result.instances || [];
    } catch (error) {
      console.error("[Wasender] Get instances error:", error);
      return [];
    }
  }

  /**
   * Connecter une instance
   */
  async connectInstance(instanceId: string): Promise<WasenderResponse> {
    try {
      const endpoint = this.getEndpoint("connect", instanceId);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      const result = await response.json();

      return {
        success: result.success || result.status === "success",
        message: result.message,
        data: result.data,
        error: result.error,
        status: result.status,
      };
    } catch (error) {
      console.error("[Wasender] Connect instance error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Déconnecter une instance
   */
  async disconnectInstance(instanceId: string): Promise<WasenderResponse> {
    try {
      const endpoint = this.getEndpoint("disconnect", instanceId);
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
      });

      const result = await response.json();

      return {
        success: result.success || result.status === "success",
        message: result.message,
        data: result.data,
        error: result.error,
        status: result.status,
      };
    } catch (error) {
      console.error("[Wasender] Disconnect instance error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Disconnection failed",
      };
    }
  }

  /**
   * Vérifier la connexion
   */
  async checkConnection(): Promise<boolean> {
    try {
      const instances = await this.getInstances();
      return instances.length > 0 && instances.some(i => i.status === "connected");
    } catch {
      return false;
    }
  }

  /**
   * Vérifier la signature du webhook
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!this.config.webhookSecret) {
      console.warn("[Wasender] Webhook secret not configured");
      return true; // Skip verification if no secret
    }

    // Wasender utilise généralement HMAC-SHA256
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", this.config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return signature === expectedSignature;
  }

  /**
   * Parser un webhook entrant
   */
  parseWebhook(payload: any): WasenderWebhook | null {
    try {
      // Format typique de Wasender
      return {
        event: payload.event || "message",
        instanceId: payload.instanceId || payload.instance_id,
        data: {
          from: payload.from || payload.data?.from,
          to: payload.to || payload.data?.to,
          message: payload.message || payload.data?.message,
          type: payload.type || payload.data?.type,
          timestamp: payload.timestamp || payload.data?.timestamp,
          status: payload.status || payload.data?.status,
        },
      };
    } catch (error) {
      console.error("[Wasender] Parse webhook error:", error);
      return null;
    }
  }

  /**
   * Convertir un message WhatsApp en format Wasender
   */
  convertWhatsAppMessage(message: any): WasenderMessage | null {
    try {
      const baseMessage: WasenderMessage = {
        to: message.to,
        message: "",
        type: "text",
      };

      if (message.message?.text?.body) {
        baseMessage.message = message.message.text.body;
      } else if (message.message?.image) {
        baseMessage.type = "image";
        baseMessage.mediaUrl = message.message.image.url;
        baseMessage.caption = message.message.image.caption;
      }

      return baseMessage;
    } catch (error) {
      console.error("[Wasender] Convert message error:", error);
      return null;
    }
  }

  /**
   * Obtenir l'endpoint API
   */
  private getEndpoint(action: string, id?: string): string {
    const baseUrl = this.config.apiUrl || "https://api.wasenderapi.com/api/v1";
    
    const endpoints: Record<string, string> = {
      sendText: `${baseUrl}/message/sendText`,
      sendImage: `${baseUrl}/message/sendImage`,
      sendDocument: `${baseUrl}/message/sendDocument`,
      getMessageStatus: `${baseUrl}/message/status`,
      instances: `${baseUrl}/instances`,
      connect: `${baseUrl}/instance/${id}/connect`,
      disconnect: `${baseUrl}/instance/${id}/disconnect`,
    };

    return endpoints[action] || `${baseUrl}/${action}`;
  }
}

/**
 * Factory pour créer une instance du service Wasender
 */
export function createWasenderService(config: WasenderConfig): WasenderService {
  return new WasenderService(config);
}

/**
 * Vérifier si Wasender est configuré
 */
export function isWasenderConfigured(config: Partial<WasenderConfig>): boolean {
  return !!(config.apiKey && config.apiUrl);
}
