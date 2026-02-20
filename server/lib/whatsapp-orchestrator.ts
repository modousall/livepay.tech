/**
 * WhatsApp Chatbot Orchestration Service
 * Gère le routage des messages entre Meta WhatsApp Cloud API et Wasender
 * 
 * Architecture:
 * - Routeur principal: choisit entre Meta et Wasender
 * - Fallback automatique: si Meta échoue → Wasender
 * - Gestion de contexte: maintient l'état des conversations
 * - Handlers métier: traite les messages par secteur
 */

import { Timestamp, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Types de messages
export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "received" | "processing" | "sent" | "delivered" | "read" | "failed";
export type MessageProvider = "meta" | "wasender" | "system";

// Types de messages WhatsApp
export interface WhatsAppMessage {
  from: string; // Numéro de téléphone
  to: string; // Numéro de destination
  message: {
    type: "text" | "image" | "document" | "location" | "contact" | "button" | "list";
    text?: {
      body: string;
    };
    image?: {
      id: string;
      caption?: string;
    };
    document?: {
      id: string;
      filename?: string;
    };
  };
  timestamp: string;
  context?: {
    from: string;
    id: string;
  };
}

// Message sortant
export interface OutboundMessage {
  to: string;
  message: {
    type: "text" | "image" | "document" | "button" | "list";
    text?: string;
    image?: {
      url: string;
      caption?: string;
    };
    document?: {
      url: string;
      filename: string;
    };
    buttons?: Array<{
      type: "reply";
      reply: {
        id: string;
        title: string;
      };
    }>;
  };
  provider?: MessageProvider;
}

// Contexte de conversation
export interface ConversationContext {
  sessionId: string;
  vendorId: string;
  clientPhone: string;
  clientName?: string;
  lastMessageAt: Date;
  messageCount: number;
  currentIntent?: string;
  currentStep?: string;
  metadata?: Record<string, any>;
  provider: "meta" | "wasender";
  status: "active" | "paused" | "closed";
}

// Intentions détectées
export type MessageIntent =
  | "greeting"           // Bonjour, salut, etc.
  | "product_info"       // Infos produit
  | "order_status"       // Suivi commande
  | "payment"            // Paiement
  | "complaint"          // Réclamation
  | "appointment"        // Rendez-vous
  | "human"              // Parler à un humain
  | "menu"               // Afficher le menu
  | "help"               // Aide
  | "unknown";           // Non reconnu

// Réponse du chatbot
export interface BotResponse {
  message: string;
  type?: "text" | "buttons" | "list";
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  listItems?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  requiresHuman?: boolean;
  intent?: MessageIntent;
  nextStep?: string;
}

// Configuration du routeur
export interface RouterConfig {
  primaryProvider: "meta" | "wasender";
  fallbackEnabled: boolean;
  wasenderEnabled: boolean;
  metaEnabled: boolean;
  businessHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;   // HH:mm
    timezone: string;
  };
  autoReplyEnabled: boolean;
  humanHandoffEnabled: boolean;
}

/**
 * Service d'orchestration WhatsApp
 */
export class WhatsAppOrchestrator {
  private config: RouterConfig;

  constructor(config: RouterConfig) {
    this.config = config;
  }

  /**
   * Traiter un message entrant
   */
  async handleIncomingMessage(
    message: WhatsAppMessage,
    vendorId: string
  ): Promise<void> {
    try {
      // 1. Sauvegarder le message entrant
      await this.saveMessage({
        ...message,
        timestamp: new Date().toISOString(),
      }, vendorId, "inbound", "received");

      // 2. Mettre à jour le contexte de conversation
      const context = await this.updateConversationContext(
        message.from,
        vendorId,
        message
      );

      // 3. Détecter l'intention
      const intent = await this.detectIntent(message, context);

      // 4. Générer la réponse
      const response = await this.generateResponse(message, intent, context, vendorId);

      // 5. Envoyer la réponse
      if (response.message) {
        await this.sendOutboundMessage(
          {
            to: message.from,
            message: {
              type: response.type || "text",
              text: response.message,
              buttons: response.buttons?.map(b => ({
                type: "reply" as const,
                reply: { id: b.id, title: b.title },
              })),
            },
          },
          vendorId
        );
      }

      // 6. Escalader si nécessaire
      if (response.requiresHuman) {
        await this.escalateToHuman(message, context, vendorId);
      }

      // 7. Logger pour analytics
      await this.logMessageAnalytics(message, response, vendorId);
    } catch (error) {
      console.error("[WhatsApp] Error handling incoming message:", error);
      throw error;
    }
  }

  /**
   * Envoyer un message sortant avec fallback
   */
  async sendOutboundMessage(
    message: OutboundMessage,
    vendorId: string
  ): Promise<boolean> {
    let success = false;

    // Essayer le provider primaire
    if (this.config.primaryProvider === "meta" && this.config.metaEnabled) {
      success = await this.sendViaMeta(message, vendorId);
    } else if (this.config.primaryProvider === "wasender" && this.config.wasenderEnabled) {
      success = await this.sendViaWasender(message, vendorId);
    }

    // Fallback si échec
    if (!success && this.config.fallbackEnabled) {
      if (this.config.primaryProvider === "meta") {
        // Fallback vers Wasender
        if (this.config.wasenderEnabled) {
          success = await this.sendViaWasender(message, vendorId);
        }
      } else {
        // Fallback vers Meta
        if (this.config.metaEnabled) {
          success = await this.sendViaMeta(message, vendorId);
        }
      }
    }

    // Sauvegarder le statut
    await this.saveMessage(
      message as any,
      vendorId,
      "outbound",
      success ? "sent" : "failed"
    );

    return success;
  }

  /**
   * Envoyer via Meta WhatsApp Cloud API
   */
  private async sendViaMeta(message: OutboundMessage, vendorId: string): Promise<boolean> {
    try {
      // Récupérer la config WhatsApp du vendor
      const vendorConfig = await this.getVendorConfig(vendorId);
      
      if (!vendorConfig?.whatsappAccessToken || !vendorConfig?.whatsappPhoneNumberId) {
        console.warn("[Meta] Configuration manquante");
        return false;
      }

      const url = `https://graph.facebook.com/v17.0/${vendorConfig.whatsappPhoneNumberId}/messages`;
      
      const payload: any = {
        messaging_product: "whatsapp",
        to: message.to,
        type: message.message.type,
      };

      if (message.message.type === "text") {
        payload.text = { body: message.message.text };
      } else if (message.message.type === "image") {
        payload.image = {
          link: message.message.image?.url,
          caption: message.message.image?.caption,
        };
      } else if (message.message.type === "button") {
        payload.type = "interactive";
        payload.interactive = {
          type: "button",
          body: { text: message.message.text },
          action: {
            buttons: message.message.buttons?.map(b => ({
              type: "reply",
              reply: b.reply,
            })),
          },
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${vendorConfig.whatsappAccessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.error) {
        console.error("[Meta] API error:", result.error);
        return false;
      }

      console.log("[Meta] Message sent:", result.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.error("[Meta] Send error:", error);
      return false;
    }
  }

  /**
   * Envoyer via Wasender API
   */
  private async sendViaWasender(message: OutboundMessage, vendorId: string): Promise<boolean> {
    try {
      // Récupérer la config Wasender
      const vendorConfig = await this.getVendorConfig(vendorId);
      
      if (!vendorConfig?.wasenderAccessToken || !vendorConfig?.wasenderApiUrl) {
        console.warn("[Wasender] Configuration manquante");
        return false;
      }

      const url = `${vendorConfig.wasenderApiUrl}/message/sendText`;
      
      const payload = {
        token: vendorConfig.wasenderAccessToken,
        to: message.to,
        message: message.message.type === "text" 
          ? message.message.text 
          : message.message.image?.url || "",
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.success !== true && result.status !== "success") {
        console.error("[Wasender] API error:", result);
        return false;
      }

      console.log("[Wasender] Message sent:", result.messageId);
      return true;
    } catch (error) {
      console.error("[Wasender] Send error:", error);
      return false;
    }
  }

  /**
   * Mettre à jour le contexte de conversation
   */
  private async updateConversationContext(
    fromPhone: string,
    vendorId: string,
    message: WhatsAppMessage
  ): Promise<ConversationContext> {
    const sessionId = `${vendorId}_${fromPhone}`;
    
    // Vérifier si la conversation existe
    const contextRef = doc(db, "whatsapp_conversations", sessionId);
    const contextSnap = await getDoc(contextRef);

    let context: ConversationContext;

    if (contextSnap.exists()) {
      // Mettre à jour conversation existante
      const existing = contextSnap.data() as ConversationContext;
      context = {
        ...existing,
        lastMessageAt: new Date(),
        messageCount: existing.messageCount + 1,
        status: "active" as const,
      };
    } else {
      // Nouvelle conversation
      context = {
        sessionId,
        vendorId,
        clientPhone: fromPhone,
        lastMessageAt: new Date(),
        messageCount: 1,
        provider: this.config.primaryProvider,
        status: "active",
      };
    }

    // Sauvegarder le contexte
    await updateDoc(contextRef, {
      ...context,
      lastMessageAt: Timestamp.fromDate(context.lastMessageAt),
    }).catch(() => {
      // Créer si n'existe pas
      addDoc(collection(db, "whatsapp_conversations"), {
        ...context,
        lastMessageAt: Timestamp.fromDate(context.lastMessageAt),
        createdAt: Timestamp.now(),
      });
    });

    return context;
  }

  /**
   * Détecter l'intention du message
   */
  private async detectIntent(
    message: WhatsAppMessage,
    context: ConversationContext
  ): Promise<MessageIntent> {
    const text = message.message.text?.body?.toLowerCase() || "";

    // Mots-clés par intention
    const patterns: Record<MessageIntent, RegExp[]> = {
      greeting: [/^bonjour/, /^salut/, /^hello/, /^hi$/, /^coucou/],
      product_info: [/prix/, /produit/, /info/, /détail/, /description/],
      order_status: [/commande/, /suivi/, /statut/, /livraison/, /où/],
      payment: [/paiement/, /payer/, /facture/, /argent/, /wave/, /orange/],
      complaint: [/réclamation/, /problème/, /plainte/, /erreur/, /pas marché/],
      appointment: [/rendez-vous/, /rdv/, /réserver/, /créneau/, /disponible/],
      human: [/humain/, /agent/, /conseiller/, /parler/, /support/],
      menu: [/menu/, /options/, /choix/, /liste/],
      help: [/aide/, /help/, /assistance/],
      unknown: [],
    };

    // Détecter l'intention
    for (const [intent, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        if (regex.test(text)) {
          return intent as MessageIntent;
        }
      }
    }

    // Vérifier si c'est une réponse à un bouton
    if (message.context?.id) {
      return context.currentIntent as MessageIntent || "unknown";
    }

    return "unknown";
  }

  /**
   * Générer une réponse basée sur l'intention
   */
  private async generateResponse(
    message: WhatsAppMessage,
    intent: MessageIntent,
    context: ConversationContext,
    vendorId: string
  ): Promise<BotResponse> {
    const vendorConfig = await this.getVendorConfig(vendorId);
    const businessName = vendorConfig?.businessName || "notre entreprise";

    switch (intent) {
      case "greeting":
        return {
          message: `Bonjour ! 👋 Bienvenue chez ${businessName}. Comment puis-je vous aider aujourd'hui ?`,
          type: "buttons",
          buttons: [
            { id: "products", title: "Voir produits" },
            { id: "orders", title: "Mes commandes" },
            { id: "help", title: "Aide" },
          ],
          intent: "greeting",
          nextStep: "menu",
        };

      case "product_info":
        return {
          message: `📦 Découvrez nos produits disponibles !\n\nPour consulter notre catalogue, veuillez visiter :`,
          type: "text",
          intent: "product_info",
        };

      case "order_status":
        return {
          message: "📍 Pour suivre votre commande, veuillez me fournir votre numéro de commande ou votre numéro de téléphone.",
          intent: "order_status",
          nextStep: "collect_order_id",
        };

      case "payment":
        return {
          message: "💳 Nous acceptons les paiements via Wave, Orange Money, Free Money, MTN MoMo et cartes bancaires via PayDunya.",
          type: "buttons",
          buttons: [
            { id: "pay_now", title: "Payer maintenant" },
            { id: "payment_methods", title: "Moyens de paiement" },
          ],
          intent: "payment",
        };

      case "complaint":
        return {
          message: "😔 Nous sommes désolés d'apprendre que vous rencontrez un problème. Un agent va vous contacter dans les plus brefs délais.",
          type: "buttons",
          buttons: [
            { id: "urgent", title: "Urgent" },
            { id: "later", title: "Rappel plus tard" },
          ],
          requiresHuman: true,
          intent: "complaint",
        };

      case "appointment":
        return {
          message: "📅 Pour prendre rendez-vous, veuillez choisir un créneau :",
          type: "buttons",
          buttons: [
            { id: "today", title: "Aujourd'hui" },
            { id: "tomorrow", title: "Demain" },
            { id: "next_week", title: "Semaine prochaine" },
          ],
          intent: "appointment",
        };

      case "human":
        return {
          message: "👤 Je transfère votre demande à un agent humain qui vous contactera dans les plus brefs délais.",
          requiresHuman: true,
          intent: "human",
        };

      case "menu":
        return {
          message: `📋 Menu principal :\n\n1️⃣ Voir les produits\n2️⃣ Suivre une commande\n3️⃣ Effectuer un paiement\n4️⃣ Prendre rendez-vous\n5️⃣ Contacter le support`,
          intent: "menu",
        };

      case "help":
        return {
          message: `ℹ️ Besoin d'aide ? Notre équipe est disponible du Lundi au Samedi de 8h à 20h.\n\n📞 Contact: ${vendorConfig?.mobileMoneyNumber || "Non disponible"}`,
          intent: "help",
        };

      default:
        return {
          message: `Je n'ai pas bien compris votre demande. Voici comment je peux vous aider :`,
          type: "buttons",
          buttons: [
            { id: "products", title: "Produits" },
            { id: "orders", title: "Commandes" },
            { id: "support", title: "Support" },
          ],
          intent: "unknown",
        };
    }
  }

  /**
   * Escalader vers un humain
   */
  private async escalateToHuman(
    message: WhatsAppMessage,
    context: ConversationContext,
    vendorId: string
  ): Promise<void> {
    try {
      // Créer un ticket CRM
      await addDoc(collection(db, "crmTickets"), {
        vendorId,
        source: "whatsapp",
        sourceId: message.from,
        clientPhone: message.from,
        clientName: context.clientName,
        subject: "Demande d'assistance - WhatsApp",
        description: message.message.text?.body,
        status: "open",
        priority: "normal",
        assignedTo: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        metadata: {
          conversationId: context.sessionId,
          messageId: message.timestamp,
        },
      });

      // Notifier les agents
      await addDoc(collection(db, "notifications"), {
        vendorId,
        type: "whatsapp_escalation",
        title: "Escalade WhatsApp",
        message: `Nouvelle demande d'assistance de ${message.from}`,
        read: false,
        createdAt: Timestamp.now(),
      });

      console.log("[WhatsApp] Escalated to human:", context.sessionId);
    } catch (error) {
      console.error("[WhatsApp] Escalation error:", error);
    }
  }

  /**
   * Sauvegarder un message dans Firestore
   */
  private async saveMessage(
    message: any,
    vendorId: string,
    direction: MessageDirection,
    status: MessageStatus
  ): Promise<void> {
    try {
      await addDoc(collection(db, "whatsapp_messages"), {
        vendorId,
        direction,
        status,
        from: message.from,
        to: message.to,
        message: message.message,
        timestamp: message.timestamp ? Timestamp.fromDate(new Date(message.timestamp)) : Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("[WhatsApp] Save message error:", error);
    }
  }

  /**
   * Logger les analytics de message
   */
  private async logMessageAnalytics(
    message: WhatsAppMessage,
    response: BotResponse,
    vendorId: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, "whatsapp_analytics"), {
        vendorId,
        date: Timestamp.now(),
        intent: response.intent,
        requiresHuman: response.requiresHuman,
        responseTime: Date.now(),
      });
    } catch (error) {
      console.error("[WhatsApp] Analytics error:", error);
    }
  }

  /**
   * Récupérer la configuration d'un vendor
   */
  private async getVendorConfig(vendorId: string): Promise<any> {
    try {
      const q = query(
        collection(db, "vendorConfigs"),
        where("vendorId", "==", vendorId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error("[WhatsApp] Get vendor config error:", error);
      return null;
    }
  }
}

/**
 * Factory pour créer une instance de l'orchestrateur
 */
export function createWhatsAppOrchestrator(config: RouterConfig): WhatsAppOrchestrator {
  return new WhatsAppOrchestrator(config);
}

/**
 * Configuration par défaut
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: RouterConfig = {
  primaryProvider: "meta",
  fallbackEnabled: true,
  wasenderEnabled: true,
  metaEnabled: true,
  autoReplyEnabled: true,
  humanHandoffEnabled: true,
};
