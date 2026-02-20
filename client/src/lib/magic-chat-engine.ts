/**
 * Magic Chat Assistant - Workflow Innovant
 * Assistant intelligent avec détection automatique d'intentions
 * et réponses contextuelles magiques ✨
 */

export type MagicIntent =
  // Commandes magiques
  | "SUMMON_HELP"      // /help ou /aide
  | "SUMMON_SALES"     // /vendre ou /produit
  | "SUMMON_SUPPORT"   // /support ou /problème
  | "SUMMON_PAYMENT"   // /payer ou /facture
  | "SUMMON_DELIVERY"  // /livrer ou /commande
  | "SUMMON_APPOINTMENT" // /rdv ou /rendezvous
  | "SUMMON_STATUS"    // /statut ou /où
  | "SUMMON_HUMAN"     // /humain ou /conseiller
  
  // Détections automatiques
  | "GREETING"         // Bonjour, Salut, etc.
  | "THANKS"           // Merci, Super, etc.
  | "COMPLAINT"        // Problème, Pas content, etc.
  | "INTEREST"         // Intéressé, Je veux, etc.
  | "URGENCY"          // Urgent, Vite, etc.
  | "CONFUSION"        // ?, Je comprends pas
  | "GOODBYE";         // Au revoir, Bye

export interface MagicMessage {
  text: string;
  intent?: MagicIntent;
  confidence?: number;
  context?: Record<string, any>;
  requiresHuman?: boolean;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface MagicResponse {
  message: string;
  actions?: MagicAction[];
  buttons?: MagicButton[];
  followUp?: string;
  delay?: number; // ms avant envoi
}

export interface MagicAction {
  type: "create_order" | "create_ticket" | "send_payment" | "schedule_appointment" | "notify_human";
  data: Record<string, any>;
}

export interface MagicButton {
  id: string;
  label: string;
  action: string;
}

/**
 * 🪄 MAGIC CHAT ENGINE
 * Détection automatique et réponses intelligentes
 */
export class MagicChatEngine {
  private sector: string;
  private context: Record<string, any> = {};

  constructor(sector: string = "shop") {
    this.sector = sector;
  }

  /**
   * ✨ Analyser un message et détecter l'intention
   */
  analyzeMessage(text: string): MagicMessage {
    const lowerText = text.toLowerCase().trim();
    
    // Commandes magiques (commencent par /)
    if (lowerText.startsWith("/")) {
      return this.parseMagicCommand(lowerText);
    }

    // Détection automatique
    return this.autoDetectIntent(lowerText);
  }

  /**
   * 🪄 Parser une commande magique
   */
  private parseMagicCommand(text: string): MagicMessage {
    const command = text.split(" ")[0].substring(1);
    const args = text.split(" ").slice(1).join(" ");

    const commandMap: Record<string, MagicIntent> = {
      help: "SUMMON_HELP",
      aide: "SUMMON_HELP",
      vendre: "SUMMON_SALES",
      produit: "SUMMON_SALES",
      support: "SUMMON_SUPPORT",
      problème: "SUMMON_SUPPORT",
      probleme: "SUMMON_SUPPORT",
      payer: "SUMMON_PAYMENT",
      facture: "SUMMON_PAYMENT",
      livrer: "SUMMON_DELIVERY",
      commande: "SUMMON_DELIVERY",
      rdv: "SUMMON_APPOINTMENT",
      rendezvous: "SUMMON_APPOINTMENT",
      statut: "SUMMON_STATUS",
      où: "SUMMON_STATUS",
      humain: "SUMMON_HUMAN",
      conseiller: "SUMMON_HUMAN",
    };

    const intent = commandMap[command] || "SUMMON_HELP";

    return {
      text,
      intent,
      confidence: 1.0,
      context: { command, args },
      requiresHuman: intent === "SUMMON_HUMAN",
    };
  }

  /**
   * 🔮 Détection automatique d'intention
   */
  private autoDetectIntent(text: string): MagicMessage {
    // Greetings
    if (/^(bonjour|salut|coucou|hello|hi|hey)/.test(text)) {
      return { text, intent: "GREETING", confidence: 0.95 };
    }

    // Thanks
    if (/(merci|super|génial|genial|parfait|top)/.test(text)) {
      return { text, intent: "THANKS", confidence: 0.9 };
    }

    // Complaints
    if (/(problème|probleme|pas content|mécontent|mecontent|erreur|bug|panne)/.test(text)) {
      return { 
        text, 
        intent: "COMPLAINT", 
        confidence: 0.85,
        priority: "high",
        requiresHuman: true
      };
    }

    // Interest
    if (/(intéressé|interesse|je veux|j aimerais|j aimerais|comment acheter)/.test(text)) {
      return { text, intent: "INTEREST", confidence: 0.8 };
    }

    // Urgency
    if (/(urgent|vite|rapidement|urgence|asap)/.test(text)) {
      return { 
        text, 
        intent: "URGENCY", 
        confidence: 0.9,
        priority: "critical",
        requiresHuman: true
      };
    }

    // Confusion
    if (/(\?|je comprends pas|comprends pas|quoi|comment)/.test(text)) {
      return { text, intent: "CONFUSION", confidence: 0.7 };
    }

    // Goodbye
    if (/(au revoir|bye|a plus|à plus|ciao)/.test(text)) {
      return { text, intent: "GOODBYE", confidence: 0.9 };
    }

    // Payment keywords
    if (/(payer|paiement|combien|prix|tarif|argent)/.test(text)) {
      return { text, intent: "SUMMON_PAYMENT", confidence: 0.75 };
    }

    // Delivery keywords
    if (/(livrer|livraison|commande|où est|ou est|suivre)/.test(text)) {
      return { text, intent: "SUMMON_DELIVERY", confidence: 0.75 };
    }

    // Default
    return { text, intent: "SUMMON_HELP", confidence: 0.5 };
  }

  /**
   * ✨ Générer une réponse magique
   */
  generateResponse(message: MagicMessage): MagicResponse {
    switch (message.intent) {
      case "GREETING":
        return this.respondToGreeting();
      
      case "THANKS":
        return this.respondToThanks();
      
      case "COMPLAINT":
        return this.respondToComplaint(message);
      
      case "INTEREST":
        return this.respondToInterest();
      
      case "URGENCY":
        return this.respondToUrgency(message);
      
      case "CONFUSION":
        return this.respondToConfusion();
      
      case "GOODBYE":
        return this.respondToGoodbye();
      
      case "SUMMON_HELP":
        return this.respondToHelp();
      
      case "SUMMON_SALES":
        return this.respondToSales();
      
      case "SUMMON_SUPPORT":
        return this.respondToSupport(message);
      
      case "SUMMON_PAYMENT":
        return this.respondToPayment();
      
      case "SUMMON_DELIVERY":
        return this.respondToDelivery();
      
      case "SUMMON_APPOINTMENT":
        return this.respondToAppointment();
      
      case "SUMMON_STATUS":
        return this.respondToStatus();
      
      case "SUMMON_HUMAN":
        return this.respondToHuman();
      
      default:
        return this.respondToHelp();
    }
  }

  /**
   * 🌟 Réponses magiques par intention
   */
  private respondToGreeting(): MagicResponse {
    const greetings = [
      "✨ Bonjour ! Je suis votre assistant magique. Comment puis-je vous aider aujourd'hui ?",
      "🌟 Salut ! Prêt à vivre une expérience magique ? Dites-moi tout !",
      "🪄 Bonjour ! Votre wish is my command. Que souhaitez-vous faire ?",
    ];

    return {
      message: greetings[Math.floor(Math.random() * greetings.length)],
      buttons: [
        { id: "see_products", label: "🛍️ Voir les produits", action: "SHOW_PRODUCTS" },
        { id: "track_order", label: "📦 Suivre commande", action: "TRACK_ORDER" },
        { id: "need_help", label: "❓ Besoin d'aide", action: "SHOW_HELP" },
      ],
      followUp: "Que souhaitez-vous faire ?",
    };
  }

  private respondToThanks(): MagicResponse {
    return {
      message: "🌟 Avec plaisir ! C'est magique, n'est-ce pas ? N'hésitez pas si vous avez d'autres questions.",
      delay: 500,
    };
  }

  private respondToComplaint(message: MagicMessage): MagicResponse {
    return {
      message: "😔 Je comprends votre mécontentement. Laissez-moi arranger ça magiquement !\n\nUn conseiller humain va vous contacter dans les 2 minutes.",
      actions: [{
        type: "create_ticket",
        data: {
          priority: "high",
          reason: "complaint",
          text: message.text,
        },
      }],
      requiresHuman: true,
      priority: "high",
    };
  }

  private respondToInterest(): MagicResponse {
    return {
      message: "🌟 Excellent choix ! Laissez-moi vous montrer nos merveilles...\n\nVoici ce qui pourrait vous intéresser :",
      buttons: [
        { id: "show_bestsellers", label: "⭐ Meilleures ventes", action: "SHOW_BESTSELLERS" },
        { id: "show_promos", label: "🔥 Promotions", action: "SHOW_PROMOS" },
        { id: "talk_to_human", label: "💬 Parler à un expert", action: "SUMMON_HUMAN" },
      ],
    };
  }

  private respondToUrgency(message: MagicMessage): MagicResponse {
    return {
      message: "🚨 URGENCE DÉTECTÉE !\n\nJe transfère immédiatement à un conseiller humain. Temps d'attente estimé: < 1 minute.",
      actions: [{
        type: "notify_human",
        data: {
          priority: "critical",
          reason: "urgency",
          text: message.text,
        },
      }],
      requiresHuman: true,
      priority: "critical",
      delay: 200,
    };
  }

  private respondToConfusion(): MagicResponse {
    return {
      message: "🤔 Je comprends que ce n'est pas clair. Laissez-moi vous guider :\n\n1️⃣ Dites /help pour voir toutes les commandes\n2️⃣ Dites /produit pour voir nos articles\n3️⃣ Dites /humain pour parler à quelqu'un\n\nQue préférez-vous ?",
      buttons: [
        { id: "show_help", label: "📖 Aide complète", action: "SHOW_HELP" },
        { id: "see_products", label: "🛍️ Voir produits", action: "SHOW_PRODUCTS" },
        { id: "talk_to_human", label: "💬 Parler à humain", action: "SUMMON_HUMAN" },
      ],
    };
  }

  private respondToGoodbye(): MagicResponse {
    return {
      message: "👋 Au revoir ! Merci d'avoir vécu cette expérience magique avec nous. Revenez quand vous voulez ! ✨",
      delay: 1000,
    };
  }

  private respondToHelp(): MagicResponse {
    return {
      message: "🪄 *COMMANDES MAGIQUES DISPONIBLES*\n\n" +
        "/help - Afficher cette aide\n" +
        "/produit - Voir les produits\n" +
        "/commande - Suivre une commande\n" +
        "/payer - Effectuer un paiement\n" +
        "/livrer - Suivre une livraison\n" +
        "/rdv - Prendre rendez-vous\n" +
        "/support - Contacter le support\n" +
        "/humain - Parler à un conseiller\n\n" +
        "_Ou posez simplement votre question en langage naturel !_",
      buttons: [
        { id: "see_products", label: "🛍️ Voir produits", action: "SHOW_PRODUCTS" },
        { id: "track_order", label: "📦 Ma commande", action: "TRACK_ORDER" },
        { id: "contact_support", label: "📞 Support", action: "CONTACT_SUPPORT" },
      ],
    };
  }

  private respondToSales(): MagicResponse {
    return {
      message: "🛍️ *NOS PRODUITS MAGIQUES*\n\n" +
        "Voici nos meilleures ventes du moment !\n\n" +
        "✨ Astuce: Dites le nom d'un produit pour plus de détails.",
      buttons: [
        { id: "show_catalog", label: "📖 Catalogue complet", action: "SHOW_CATALOG" },
        { id: "show_promos", label: "🔥 Promotions", action: "SHOW_PROMOS" },
        { id: "search_product", label: "🔍 Rechercher", action: "SEARCH_PRODUCT" },
      ],
    };
  }

  private respondToSupport(message: MagicMessage): MagicResponse {
    return {
      message: "🛟 *SUPPORT MAGIQUE*\n\n" +
        "Je suis là pour vous aider !\n\n" +
        "Pour accélérer le traitement, dites-moi:\n" +
        "• Votre numéro de commande\n" +
        "• La nature du problème\n" +
        "• Ce que vous attendez de nous",
      actions: [{
        type: "create_ticket",
        data: {
          priority: "normal",
          reason: "support",
          text: message.text,
        },
      }],
      buttons: [
        { id: "urgent_issue", label: "🚨 Urgent", action: "MARK_URGENT" },
        { id: "order_issue", label: "📦 Problème commande", action: "ORDER_ISSUE" },
        { id: "payment_issue", label: "💳 Problème paiement", action: "PAYMENT_ISSUE" },
      ],
    };
  }

  private respondToPayment(): MagicResponse {
    return {
      message: "💳 *PAIEMENT MAGIQUE*\n\n" +
        "Nous acceptons:\n" +
        "🌊 Wave\n" +
        "🟠 Orange Money\n" +
        "🟡 MTN MoMo\n" +
        "💳 Cartes bancaires\n\n" +
        "Dites /payer [montant] pour initier un paiement.",
      buttons: [
        { id: "pay_wave", label: "🌊 Wave", action: "PAY_WAVE" },
        { id: "pay_om", label: "🟠 Orange Money", action: "PAY_OM" },
        { id: "pay_card", label: "💳 Carte", action: "PAY_CARD" },
      ],
    };
  }

  private respondToDelivery(): MagicResponse {
    return {
      message: "🚚 *LIVRAISON MAGIQUE*\n\n" +
        "Suivez votre commande en temps réel !\n\n" +
        "Dites /statut [numéro_commande] pour connaître la position.",
      buttons: [
        { id: "track_my_order", label: "📦 Ma commande", action: "TRACK_MY_ORDER" },
        { id: "delivery_zones", label: "📍 Zones de livraison", action: "SHOW_ZONES" },
        { id: "delivery_times", label: "⏱️ Délais", action: "SHOW_TIMES" },
      ],
    };
  }

  private respondToAppointment(): MagicResponse {
    return {
      message: "📅 *RENDEZ-VOUS MAGIQUE*\n\n" +
        "Réservez votre créneau en un instant !\n\n" +
        "Dites /rdv [date] [heure] pour réserver.",
      buttons: [
        { id: "book_today", label: "📅 Aujourd'hui", action: "BOOK_TODAY" },
        { id: "book_tomorrow", label: "📅 Demain", action: "BOOK_TOMORROW" },
        { id: "book_week", label: "📅 Cette semaine", action: "BOOK_WEEK" },
      ],
    };
  }

  private respondToStatus(): MagicResponse {
    return {
      message: "📍 *STATUT MAGIQUE*\n\n" +
        "Où en est votre commande ?\n\n" +
        "Dites /où [numéro_commande] pour la localiser.",
      buttons: [
        { id: "my_orders", label: "📦 Mes commandes", action: "MY_ORDERS" },
        { id: "track_order", label: "🔍 Suivre", action: "TRACK_ORDER" },
      ],
    };
  }

  private respondToHuman(): MagicResponse {
    return {
      message: "👨‍💼 *CONSEILLER HUMAIN*\n\n" +
        "Transfert en cours vers un conseiller...\n\n" +
        "⏱️ Temps d'attente estimé: 1-2 minutes\n" +
        "📞 Un conseiller va vous contacter par WhatsApp.",
      actions: [{
        type: "notify_human",
        data: {
          priority: "high",
          reason: "human_request",
        },
      }],
      requiresHuman: true,
      priority: "high",
    };
  }
}

/**
 * 🪄 Factory pour créer un Magic Chat Engine
 */
export function createMagicChatEngine(sector: string = "shop"): MagicChatEngine {
  return new MagicChatEngine(sector);
}
