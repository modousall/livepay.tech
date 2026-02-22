/**
 * Service Chatbot Orienté SERVICES (vs E-commerce)
 *
 * Ce service gère les conversations pour les entités de SERVICE :
 * - Banque / Microfinance
 * - Assurance
 * - Télécom
 * - Santé
 * - Utilities
 * - Transport
 * - Éducation
 *
 * PRINCIPES:
 * - 80-95% des demandes sont des INFOS, pas des achats
 * - Chaque secteur a ses codes spécifiques (INFO, SOLDE, POLICE, etc.)
 * - Les démarches > Les produits (demander, suivre, annuler)
 * - Gestion des urgences prioritaire
 */

import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../firebase";

// Types d'intentions (réorientés service)
export type ServiceIntent =
  // Informations (40-50% des demandes)
  | "INFO"         // Demande d'information générale
  | "SOLDE"        // Solde/position (banque, conso, etc.)
  | "HISTORIQUE"   // Historique opérations
  | "DOCUMENT"     // Télécharger document
  | "ÉTAT"         // État actuel (dossier, commande, etc.)
  | "POSITION"     // Position actuelle (file d'attente, etc.)
  
  // Démarches (30-40% des demandes)
  | "DEMANDE"      // Faire une demande
  | "RÉCLAMATION"  // Ouvrir réclamation
  | "SUIVI"        // Suivre dossier/demande
  | "ANNULATION"   // Annuler demande/RDV
  | "MODIFICATION" // Modifier informations
  | "RENOUVELLEMENT" // Renouveler (ordonnance, etc.)
  
  // Support (15-20% des demandes)
  | "AIDE"         // Demander de l'aide
  | "CONSEILLER"   // Parler à humain
  | "URGENCE"      // Cas urgent
  | "SIGNALER"     // Signaler problème
  
  // Spécifique secteur (5-10%)
  | "RDV"          // Rendez-vous (santé, services)
  | "RECHARGE"     // Recharger (télécom)
  | "SINISTRE"     // Déclarer sinistre (assurance)
  | "VIREMENT"     // Faire virement (banque)
  | "PAIEMENT"     // Payer facture
  | "ATTESTATION"  // Obtenir attestation
  | "POLICE"       // Voir police (assurance)
  | "CONSO"        // Voir consommation (télécom)
  | "FORFAIT"      // Voir/modifier forfait
  | "RIB"          // Obtenir RIB (banque)
  | "FACTURE"      // Télécharger facture
  | "RÉSULTAT"     // Résultats (santé, analyses)
  | "ORDONNANCE"   // Ordonnance (santé)
  | "INSCRIPTION"  // Inscription (éducation)
  | "HORAIRES"     // Horaires (transport)
  | "RÉSERVATION"  // Réservation (transport, events);

// Secteurs supportés
export type ServiceSector =
  | "banking_microfinance"
  | "insurance"
  | "telecom"
  | "utilities"
  | "healthcare_private"
  | "transport"
  | "education"
  | "field_services"
  | "events"
  | "shop" // Only for actual e-commerce
  // NOUVEAUX: Secteurs pour l'Afrique
  | "public_services"    // Services publics / Administration
  | "agriculture"        // Agriculture, élevage, pêche
  | "real_estate"        // Immobilier, location, vente
  | "legal_notary";      // Justice, notariat, juridique

// Réponse du bot
export interface BotServiceResponse {
  message: string;
  type?: "text" | "buttons" | "list" | "form";
  buttons?: Array<{
    id: string;
    title: string;
    action?: string;
  }>;
  listItems?: Array<{
    id: string;
    title: string;
    description?: string;
    value?: string;
  }>;
  formFields?: Array<{
    name: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    required: boolean;
    options?: string[];
  }>;
  requiresHuman?: boolean;
  priority?: "normal" | "high" | "urgent";
  intent?: ServiceIntent;
  nextStep?: string;
  data?: any;
}

// Contexte de conversation
export interface ServiceConversationContext {
  sessionId: string;
  vendorId: string;
  sector: ServiceSector;
  clientPhone: string;
  clientName?: string;
  clientId?: string;
  currentIntent?: ServiceIntent;
  currentStep: string;
  formData?: Record<string, any>;
  lastInteraction: Date;
  messageCount: number;
}

/**
 * Messages d'accueil par secteur
 */
const WELCOME_MESSAGES: Record<ServiceSector, string> = {
  banking_microfinance:
    "Bonjour ! 👋 Bienvenue dans votre espace bancaire.\n\n" +
    "💼 *VOS COMPTES*\n" +
    "  • INFO → Solde et opérations\n" +
    "  • RELEVÉ → Télécharger relevé\n" +
    "  • RIB → Obtenir mon RIB\n\n" +
    "💰 *OPÉRATIONS*\n" +
    "  • VIREMENT → Faire un virement\n" +
    "  • PAIEMENT → Paiement factures\n" +
    "  • CRÉDIT → Demande de crédit\n\n" +
    "📞 *SUPPORT*\n" +
    "  • RÉCLAMATION → Ouvrir réclamation\n" +
    "  • CONSEILLER → Parler à conseiller\n" +
    "  • URGENCE → Carte perdue/volée\n\n" +
    "_Que souhaitez-vous faire ?_",

  insurance:
    "Bonjour ! 👋 Bienvenue chez votre assureur.\n\n" +
    "📋 *VOS CONTRATS*\n" +
    "  • POLICE → Mes assurances\n" +
    "  • ATTESTATION → Attestation assurance\n" +
    "  • GARANTIES → Voir garanties\n\n" +
    "⚠️ *SINISTRES*\n" +
    "  • DÉCLARER → Déclarer sinistre\n" +
    "  • SUIVI → Suivre dossier\n" +
    "  • EXPERT → Demander expertise\n\n" +
    "💶 *COTISATIONS*\n" +
    "  • PAIEMENT → Payer cotisation\n" +
    "  • FACTURE → Télécharger facture\n" +
    "  • ÉCHÉANCE → Dates de paiement\n\n" +
    "_Comment pouvons-nous vous aider ?_",

  telecom:
    "Bonjour ! 👋 Bienvenue chez votre opérateur.\n\n" +
    "📊 *MA CONSOMMATION*\n" +
    "  • CONSO → Voir consommation\n" +
    "  • FORFAIT → Mon forfait actuel\n" +
    "  • RESTE → Reste à consommer\n\n" +
    "🔄 *RECHARGES*\n" +
    "  • RECHARGER → Faire recharge\n" +
    "  • BONUS → Offres bonus\n" +
    "  • HISTORIQUE → Historique recharges\n\n" +
    "🔧 *SUPPORT*\n" +
    "  • INCIDENT → Signaler incident\n" +
    "  • RÉSEAU → État du réseau\n" +
    "  • SAV → Support technique\n\n" +
    "_Que voulez-vous faire ?_",

  utilities:
    "Bonjour ! 👋 Bienvenue. Service client Énergie/Eau.\n\n" +
    "📊 *VOS COMPTES*\n" +
    "  • INFO → Informations compte\n" +
    "  • FACTURE → Mes factures\n" +
    "  • RELEVÉ → Relevé compteur\n\n" +
    "⚡ *INTERVENTIONS*\n" +
    "  • PANNE → Signaler panne\n" +
    "  • INTERVENTION → Demander intervention\n" +
    "  • SUIVI → Suivre intervention\n\n" +
    "📞 *SUPPORT*\n" +
    "  • RÉCLAMATION → Réclamation\n" +
    "  • CONSEILLER → Parler à conseiller\n" +
    "  • URGENCE → Urgence\n\n" +
    "_Comment pouvons-nous vous aider ?_",

  healthcare_private:
    "Bonjour ! 👋 Bienvenue au cabinet médical.\n\n" +
    "📅 *RENDEZ-VOUS*\n" +
    "  • RDV → Prendre rendez-vous\n" +
    "  • MES_RDV → Mes rendez-vous\n" +
    "  • ANNULER → Annuler rendez-vous\n\n" +
    "📋 *DOSSIER MÉDICAL*\n" +
    "  • ORDONNANCE → Renouvellement\n" +
    "  • RÉSULTAT → Résultats analyses\n" +
    "  • HISTORIQUE → Historique consultations\n\n" +
    "🚨 *URGENCES*\n" +
    "  • URGENCE → Urgence médicale\n" +
    "  • GARDE → Médecin de garde\n" +
    "  • CONSEIL → Conseil médical\n\n" +
    "_Comment pouvons-nous vous aider ?_",

  transport:
    "Bonjour ! 👋 Bienvenue. Service Transport.\n\n" +
    "🚌 *HORAIRES & RÉSERVATIONS*\n" +
    "  • HORAIRES → Voir horaires\n" +
    "  • RÉSERVER → Réserver place\n" +
    "  • MES_RÉSA → Mes réservations\n\n" +
    "🎫 *BILLETS*\n" +
    "  • ACHETER → Acheter billet\n" +
    "  • ANNULER → Annuler billet\n" +
    "  • ÉCHANGER → Échanger billet\n\n" +
    "📞 *INFOS*\n" +
    "  • RETARD → Retards en cours\n" +
    "  • BAGAGE → Suivi bagage\n" +
    "  • INFO → Informations\n\n" +
    "_Où allez-vous aujourd'hui ?_",

  education:
    "Bonjour ! 👋 Bienvenue. Service Éducation/Formation.\n\n" +
    "📚 *INSCRIPTIONS*\n" +
    "  • INSCRIRE → S'inscrire\n" +
    "  • MES_INSC → Mes inscriptions\n" +
    "  • FRAIS → Frais de scolarité\n\n" +
    "📅 *EMPLOI DU TEMPS*\n" +
    "  • EMPLOI → Voir emploi du temps\n" +
    "  • ABSENCE → Signaler absence\n" +
    "  • RATTRAPAGE → Demander rattrapage\n\n" +
    "📊 *RÉSULTATS*\n" +
    "  • NOTES → Voir notes\n" +
    "  • BULLETIN → Télécharger bulletin\n" +
    "  • CLASSEMENT → Classement\n\n" +
    "_Comment pouvons-nous vous aider ?_",

  field_services:
    "Bonjour ! 👋 Bienvenue. Services à Domicile.\n\n" +
    "🔧 *INTERVENTIONS*\n" +
    "  • DEMANDE → Demander intervention\n" +
    "  • SUIVI → Suivre intervention\n" +
    "  • TECHNICIEN → Mon technicien\n\n" +
    "💰 *DEVIS & FACTURES*\n" +
    "  • DEVIS → Demander devis\n" +
    "  • FACTURE → Mes factures\n" +
    "  • PAIEMENT → Payer facture\n\n" +
    "📞 *SUPPORT*\n" +
    "  • RÉCLAMATION → Réclamation\n" +
    "  • CONSEILLER → Parler à conseiller\n" +
    "  • URGENCE → Urgence\n\n" +
    "_De quoi avez-vous besoin ?_",

  events:
    "Bonjour ! 👋 Bienvenue. Service Événementiel.\n\n" +
    "🎫 *BILLETS*\n" +
    "  • ÉVÉNEMENTS → Événements à venir\n" +
    "  • ACHETER → Acheter billet\n" +
    "  • MES_BILLETS → Mes billets\n\n" +
    "ℹ️ *INFOS*\n" +
    "  • PROGRAMME → Programme détaillé\n" +
    "  • ACCÈS → Infos accès\n" +
    "  • CONTACT → Contact organisateur\n\n" +
    "📞 *SUPPORT*\n" +
    "  • REMBOURSEMENT → Demande remboursement\n" +
    "  • ÉCHANGE → Échanger billet\n" +
    "  • INFO → Informations\n\n" +
    "_Quel événement vous intéresse ?_",

  shop:
    "Bonjour ! 👋 Bienvenue dans notre boutique.\n\n" +
    "🛍️ *PRODUITS*\n" +
    "  • CATALOGUE → Voir catalogues\n" +
    "  • PROMO → Promotions\n" +
    "  • NOUVEAUTÉS → Nouveautés\n\n" +
    "📦 *COMMANDES*\n" +
    "  • COMMANDER → Passer commande\n" +
    "  • SUIVI → Suivre commande\n" +
    "  • LIVRAISON → Infos livraison\n\n" +
    "💳 *PAIEMENT*\n" +
    "  • MOYENS → Moyens de paiement\n" +
    "  • FACILITÉS → Facilités de paiement\n\n" +
    "_Que souhaitez-vous acheter aujourd'hui ?_",

  // NOUVEAUX: Secteurs pour l'Afrique
  public_services:
    "Bonjour ! 👋 Bienvenue. Services Publics / Administration.\n\n" +
    "🏛️ *DÉMARCHES ADMINISTRATIVES*\n" +
    "  • INFO → Informations générales\n" +
    "  • PIECE → Pièces à fournir\n" +
    "  • RENDEZ_VOUS → Prendre rendez-vous\n\n" +
    "📄 *DOCUMENTS*\n" +
    "  • CARTE → Carte d'identité / Passeport\n" +
    "  • ACTE → Actes d'état civil\n" +
    "  • CASIER → Casier judiciaire\n\n" +
    "💰 *PAIEMENTS*\n" +
    "  • IMPOT → Impôts et taxes\n" +
    "  • AMENDE → Amendes\n" +
    "  • TIMBRE → Timbres fiscaux\n\n" +
    "_Comment pouvons-nous vous aider ?_",

  agriculture:
    "Bonjour ! 👋 Bienvenue. Service Agricole.\n\n" +
    "🌾 *CONSEILS AGRICOLES*\n" +
    "  • CULTURE → Conseils de culture\n" +
    "  • SEMENCES → Semences améliorées\n" +
    "  • TRAITEMENT → Traitements phytosanitaires\n\n" +
    "🌤️ *INFORMATIONS*\n" +
    "  • METEO → Météo agricole\n" +
    "  • MARCHE → Prix du marché\n" +
    "  • STOCK → Gestion de stock\n\n" +
    "💰 *FINANCEMENT*\n" +
    "  • CREDIT → Crédit agricole\n" +
    "  • SUBVENTION → Subventions\n" +
    "  • ASSURANCE → Assurance récolte\n\n" +
    "_De quoi avez-vous besoin ?_",

  real_estate:
    "Bonjour ! 👋 Bienvenue. Service Immobilier.\n\n" +
    "🏢 *LOCATIONS*\n" +
    "  • LOUER → Chercher location\n" +
    "  • MES_LOC → Mes locations\n" +
    "  • QUITTANCE → Quittances\n\n" +
    "💰 *VENTES*\n" +
    "  • ACHETER → Acheter bien\n" +
    "  • VENDRE → Vendre bien\n" +
    "  • ESTIMATION → Estimation gratuite\n\n" +
    "🔧 *GESTION*\n" +
    "  • SYNDIC → Syndic de copropriété\n" +
    "  • TRAVAUX → Demande travaux\n" +
    "  • VISITE → Visiter bien\n\n" +
    "_Quel est votre projet immobilier ?_",

  legal_notary:
    "Bonjour ! 👋 Bienvenue. Cabinet Juridique / Notariat.\n\n" +
    "⚖️ *SERVICES JURIDIQUES*\n" +
    "  • CONSULTATION → Consultation juridique\n" +
    "  • CONTRAT → Rédaction contrat\n" +
    "  • LITIGE → Litige / Conflit\n\n" +
    "📜 *NOTARIAT*\n" +
    "  • ACTE → Acte notarié\n" +
    "  • SUCCESSION → Succession\n" +
    "  • DONATION → Donation\n\n" +
    "📅 *RENDEZ-VOUS*\n" +
    "  • RDV → Prendre rendez-vous\n" +
    "  • MES_RDV → Mes rendez-vous\n" +
    "  • URGENCE → Urgence juridique\n\n" +
    "_Comment pouvons-nous vous assister ?_",
};

/**
 * Codes et alias par intention
 */
const INTENT_ALIASES: Record<string, ServiceIntent> = {
  // Informations
  "INFO": "INFO",
  "INFOS": "INFO",
  "INFORMATION": "INFO",
  "SOLDE": "SOLDE",
  "SOLDES": "SOLDE",
  "COMPTE": "SOLDE",
  "HISTORIQUE": "HISTORIQUE",
  "HISTO": "HISTORIQUE",
  "OPERATIONS": "HISTORIQUE",
  "DOCUMENT": "DOCUMENT",
  "DOC": "DOCUMENT",
  "TELECHARGER": "DOCUMENT",
  "ÉTAT": "ÉTAT",
  "ETAT": "ÉTAT",
  "STATUS": "ÉTAT",
  "POSITION": "POSITION",
  "PLACE": "POSITION",
  "FILE": "POSITION",
  
  // Démarches
  "DEMANDE": "DEMANDE",
  "DEMANDER": "DEMANDE",
  "RÉCLAMATION": "RÉCLAMATION",
  "RECLAMATION": "RÉCLAMATION",
  "PLAINTE": "RÉCLAMATION",
  "PROBLÈME": "RÉCLAMATION",
  "PROBLEME": "RÉCLAMATION",
  "SUIVI": "SUIVI",
  "SUIVRE": "SUIVI",
  "ANNULATION": "ANNULATION",
  "ANNULER": "ANNULATION",
  "MODIFICATION": "MODIFICATION",
  "MODIFIER": "MODIFICATION",
  "CHANGER": "MODIFICATION",
  "RENOUVELLEMENT": "RENOUVELLEMENT",
  "RENOUVELER": "RENOUVELLEMENT",
  
  // Support
  "AIDE": "AIDE",
  "HELP": "AIDE",
  "CONSEILLER": "CONSEILLER",
  "AGENT": "CONSEILLER",
  "HUMAIN": "CONSEILLER",
  "URGENCE": "URGENCE",
  "URGENT": "URGENCE",
  "SIGNALER": "SIGNALER",
  "SIGNALEMENT": "SIGNALER",
  
  // Spécifique
  "RDV": "RDV",
  "RENDEZ-VOUS": "RDV",
  "RENDEZVOUS": "RDV",
  "RECHARGE": "RECHARGE",
  "RECHARGER": "RECHARGE",
  "SINISTRE": "SINISTRE",
  "VIREMENT": "VIREMENT",
  "PAIEMENT": "PAIEMENT",
  "PAYER": "PAIEMENT",
  "ATTESTATION": "ATTESTATION",
  "POLICE": "POLICE",
  "CONSO": "CONSO",
  "CONSOMMATION": "CONSO",
  "FORFAIT": "FORFAIT",
  "RIB": "RIB",
  "FACTURE": "FACTURE",
  "FACTURES": "FACTURE",
  "RÉSULTAT": "RÉSULTAT",
  "RESULTAT": "RÉSULTAT",
  "RÉSULTATS": "RÉSULTAT",
  "ORDONNANCE": "ORDONNANCE",
  "INSCRIPTION": "INSCRIPTION",
  "INSCRIRE": "INSCRIPTION",
  "HORAIRES": "HORAIRES",
  "HORAIRE": "HORAIRES",
  "RÉSERVATION": "RÉSERVATION",
  "RESERVATION": "RÉSERVATION",
  "RÉSERVER": "RÉSERVATION",
};

/**
 * Service Chatbot Orienté Services
 */
export class ServiceChatbot {
  /**
   * Détecter l'intention d'un message
   */
  detectIntent(message: string): ServiceIntent | null {
    const upperMessage = message.toUpperCase().trim();
    
    // Recherche exacte
    if (INTENT_ALIASES[upperMessage]) {
      return INTENT_ALIASES[upperMessage];
    }
    
    // Recherche partielle
    for (const [alias, intent] of Object.entries(INTENT_ALIASES)) {
      if (upperMessage.includes(alias)) {
        return intent;
      }
    }
    
    return null;
  }

  /**
   * Obtenir le message d'accueil pour un secteur
   */
  getWelcomeMessage(sector: ServiceSector): string {
    return WELCOME_MESSAGES[sector] || WELCOME_MESSAGES.shop;
  }

  /**
   * Générer une réponse basée sur l'intention et le secteur
   */
  async generateResponse(
    intent: ServiceIntent,
    context: ServiceConversationContext
  ): Promise<BotServiceResponse> {
    const sector = context.sector;

    // Gestion des urgences en priorité
    if (intent === "URGENCE") {
      return this.handleEmergency(context);
    }

    // Router vers le handler spécifique
    switch (intent) {
      case "INFO":
      case "SOLDE":
      case "POSITION":
        return this.handleInformationRequest(context);
      
      case "HISTORIQUE":
      case "DOCUMENT":
      case "ÉTAT":
        return this.handleDocumentRequest(context, intent);
      
      case "DEMANDE":
      case "RÉCLAMATION":
      case "SUIVI":
      case "ANNULATION":
      case "MODIFICATION":
      case "RENOUVELLEMENT":
        return this.handleProcedureRequest(context, intent);
      
      case "AIDE":
        return this.handleHelp(context);
      
      case "CONSEILLER":
        return this.handleHumanHandoff(context);
      
      case "SIGNALER":
        return this.handleReport(context);
      
      // Intentions spécifiques
      case "RDV":
        return this.handleAppointment(context);
      case "RECHARGE":
        return this.handleTopup(context);
      case "SINISTRE":
        return this.handleClaim(context);
      case "VIREMENT":
        return this.handleTransfer(context);
      case "PAIEMENT":
      case "FACTURE":
        return this.handlePayment(context);
      case "ATTESTATION":
      case "POLICE":
      case "RIB":
      case "ORDONNANCE":
      case "RÉSULTAT":
        return this.handleDocumentRequest(context, intent);
      case "CONSO":
      case "FORFAIT":
        return this.handleConsumption(context);
      case "INSCRIPTION":
        return this.handleEnrollment(context);
      case "HORAIRES":
      case "RÉSERVATION":
        return this.handleScheduleOrBooking(context, intent);
      
      default:
        return this.handleUnknown(context);
    }
  }

  /**
   * Gérer les urgences
   */
  private async handleEmergency(context: ServiceConversationContext): Promise<BotServiceResponse> {
    // Créer un ticket urgent
    const ticketId = await this.createEmergencyTicket(context);

    return {
      message:
        "⚠️ *URGENCE DÉTECTÉE*\n\n" +
        "Votre demande est **PRIORITAIRE**.\n" +
        "Un conseiller va vous contacter **IMMÉDIATEMENT**.\n\n" +
        `Référence: #${ticketId}\n\n` +
        "En attendant, pouvez-vous préciser :\n" +
        "• Carte perdue/volée\n" +
        "• Fraude constatée\n" +
        "• Problème critique\n\n" +
        "_Ne quittez pas, nous vous rappelons._",
      type: "buttons",
      buttons: [
        { id: "card_lost", title: "🔴 Carte perdue/volée" },
        { id: "fraud", title: "⚠️ Fraude" },
        { id: "other", title: "Autre" },
      ],
      requiresHuman: true,
      priority: "urgent",
      intent: "URGENCE",
    };
  }

  /**
   * Gérer les demandes d'information
   */
  private async handleInformationRequest(context: ServiceConversationContext): Promise<BotServiceResponse> {
    const sector = context.sector;

    // Récupérer les infos selon le secteur
    let infoMessage = "";
    let buttons: Array<{ id: string; title: string }> = [];

    switch (sector) {
      case "banking_microfinance":
        infoMessage =
          "📊 *VOS COMPTES*\n\n" +
          "Compte Courant: **150.000 FCFA**\n" +
          "Compte Épargne: **500.000 FCFA**\n\n" +
          "_Dernière opération: Aujourd'hui 10:30_";
        buttons = [
          { id: "details", title: "📋 Détail opérations" },
          { id: "relevé", title: "📄 Télécharger relevé" },
          { id: "menu", title: "⬅️ Menu principal" },
        ];
        break;

      case "telecom":
        infoMessage =
          "📊 *VOTRE CONSOMMATION*\n\n" +
          "📱 Data: **2.5 GB / 5 GB**\n" +
          "📞 Appels: **120 min / 600 min**\n" +
          "💬 SMS: **45 / 100**\n\n" +
          "_Reste: 5 jours avant renouvellement_";
        buttons = [
          { id: "recharger", title: "🔄 Recharger" },
          { id: "forfait", title: "📦 Voir forfait" },
          { id: "menu", title: "⬅️ Menu principal" },
        ];
        break;

      default:
        infoMessage = "Veuillez préciser votre demande.";
        buttons = [{ id: "menu", title: "⬅️ Menu principal" }];
    }

    return {
      message: infoMessage,
      type: "buttons",
      buttons,
      intent: "INFO",
    };
  }

  /**
   * Gérer les demandes de documents
   */
  private async handleDocumentRequest(
    context: ServiceConversationContext,
    intent: ServiceIntent
  ): Promise<BotServiceResponse> {
    const docType = intent === "RIB" ? "RIB" :
                    intent === "ATTESTATION" ? "Attestation" :
                    intent === "POLICE" ? "Police d'assurance" :
                    intent === "ORDONNANCE" ? "Ordonnance" :
                    intent === "RÉSULTAT" ? "Résultats" : "Document";

    return {
      message:
        `📄 *${docType.toUpperCase()}*\n\n` +
        "Veuillez préciser :\n" +
        "• Le compte/contrat concerné\n" +
        "• La période souhaitée\n\n" +
        "Ou sélectionnez une option :",
      type: "buttons",
      buttons: [
        { id: "current_month", title: "📅 Ce mois" },
        { id: "last_month", title: "📅 Mois dernier" },
        { id: "custom", title: "📅 Période personnalisée" },
        { id: "menu", title: "⬅️ Menu principal" },
      ],
      intent: "DOCUMENT",
    };
  }

  /**
   * Gérer les démarches (réclamation, demande, etc.)
   */
  private async handleProcedureRequest(
    context: ServiceConversationContext,
    intent: ServiceIntent
  ): Promise<BotServiceResponse> {
    const procedureType = intent === "RÉCLAMATION" ? "réclamation" :
                         intent === "DEMANDE" ? "demande" :
                         intent === "SUIVI" ? "suivi" :
                         intent === "ANNULATION" ? "annulation" :
                         intent === "MODIFICATION" ? "modification" : "démarche";

    if (intent === "RÉCLAMATION") {
      return {
        message:
          "😔 *RÉCLAMATION*\n\n" +
          "Nous sommes désolés d'apprendre que vous rencontrez un problème.\n\n" +
          "Pouvez-vous décrire votre réclamation ?",
        type: "form",
        formFields: [
          { name: "description", label: "Description du problème", type: "text", required: true },
          { name: "date", label: "Date de l'incident", type: "date", required: false },
          { name: "amount", label: "Montant concerné (optionnel)", type: "number", required: false },
        ],
        intent: "RÉCLAMATION",
        requiresHuman: true,
        priority: "high",
      };
    }

    if (intent === "SUIVI") {
      return {
        message:
          "📍 *SUIVI DE DEMANDE*\n\n" +
          "Veuillez entrer votre numéro de dossier/référence :",
        type: "form",
        formFields: [
          { name: "reference", label: "Numéro de référence", type: "text", required: true },
        ],
        intent: "SUIVI",
      };
    }

    return {
      message:
        `📋 *${procedureType.toUpperCase()}*\n\n` +
        "Veuillez décrire votre demande :",
      type: "form",
      formFields: [
        { name: "description", label: "Description", type: "text", required: true },
      ],
      intent: intent,
    };
  }

  /**
   * Gérer la demande d'aide
   */
  private async handleHelp(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "ℹ️ *AIDE*\n\n" +
        "Je suis là pour vous aider !\n\n" +
        "Voici ce que je peux faire pour vous :\n\n" +
        "• Consulter vos informations (comptes, contrats, etc.)\n" +
        "• Effectuer des démarches en ligne\n" +
        "• Télécharger vos documents\n" +
        "• Suivre vos demandes en cours\n" +
        "• Ouvrir une réclamation\n" +
        "• Vous mettre en relation avec un conseiller\n\n" +
        "_Tapez simplement ce que vous voulez faire ou utilisez les codes (INFO, SOLDE, etc.)_",
      type: "buttons",
      buttons: [
        { id: "codes", title: "📝 Voir les codes" },
        { id: "menu", title: "⬅️ Menu principal" },
        { id: "conseiller", title: "👤 Parler à un conseiller" },
      ],
      intent: "AIDE",
    };
  }

  /**
   * Gérer le transfert vers un humain
   */
  private async handleHumanHandoff(context: ServiceConversationContext): Promise<BotServiceResponse> {
    const ticketId = await this.createSupportTicket(context);

    return {
      message:
        "👤 *TRANSFERT VERS UN CONSEILLER*\n\n" +
        "Je transfère votre demande à un conseiller.\n\n" +
        `Référence: #${ticketId}\n\n` +
        "Temps d'attente estimé: **5-10 minutes**\n\n" +
        "_Un conseiller va vous contacter par téléphone ou message._",
      type: "buttons",
      buttons: [
        { id: "wait", title: "⏳ Attendre" },
        { id: "callback", title: "📞 Être rappelé" },
        { id: "cancel", title: "❌ Annuler" },
      ],
      requiresHuman: true,
      priority: "high",
      intent: "CONSEILLER",
    };
  }

  /**
   * Gérer un signalement
   */
  private async handleReport(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "🚨 *SIGNALEMENT*\n\n" +
        "Que souhaitez-vous signaler ?",
      type: "buttons",
      buttons: [
        { id: "fraud", title: "💳 Fraude" },
        { id: "incident", title: "⚠️ Incident technique" },
        { id: "network", title: "📡 Problème réseau" },
        { id: "other", title: "Autre" },
        { id: "menu", title: "⬅️ Menu principal" },
      ],
      intent: "SIGNALER",
      priority: "high",
    };
  }

  /**
   * Gérer les rendez-vous
   */
  private async handleAppointment(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "📅 *PRENDRE RENDEZ-VOUS*\n\n" +
        "Veuillez choisir :\n",
      type: "buttons",
      buttons: [
        { id: "today", title: "📅 Aujourd'hui" },
        { id: "tomorrow", title: "📅 Demain" },
        { id: "week", title: "📅 Cette semaine" },
        { id: "custom", title: "📅 Autre date" },
        { id: "menu", title: "⬅️ Menu principal" },
      ],
      intent: "RDV",
    };
  }

  /**
   * Gérer les recharges (télécom)
   */
  private async handleTopup(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "🔄 *RECHARGE*\n\n" +
        "Choisissez le montant :",
      type: "buttons",
      buttons: [
        { id: "500", title: "500 FCFA" },
        { id: "1000", title: "1.000 FCFA" },
        { id: "2000", title: "2.000 FCFA" },
        { id: "5000", title: "5.000 FCFA" },
        { id: "custom", title: "Autre montant" },
      ],
      intent: "RECHARGE",
    };
  }

  /**
   * Gérer les sinistres (assurance)
   */
  private async handleClaim(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "⚠️ *DÉCLARER SINISTRE*\n\n" +
        "Je vais vous guider pour déclarer votre sinistre.\n\n" +
        "Quel type de sinistre ?",
      type: "buttons",
      buttons: [
        { id: "auto", title: "🚗 Automobile" },
        { id: "home", title: "🏠 Habitation" },
        { id: "health", title: "❤️ Santé" },
        { id: "other", title: "Autre" },
      ],
      intent: "SINISTRE",
      priority: "high",
    };
  }

  /**
   * Gérer les virements (banque)
   */
  private async handleTransfer(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "💸 *VIREMENT*\n\n" +
        "Vers quel compte souhaitez-vous faire le virement ?",
      type: "buttons",
      buttons: [
        { id: "beneficiary", title: "👤 Bénéficiaire enregistré" },
        { id: "new", title: "➕ Nouveau bénéficiaire" },
        { id: "own", title: "🔄 Mes propres comptes" },
        { id: "menu", title: "⬅️ Menu principal" },
      ],
      intent: "VIREMENT",
    };
  }

  /**
   * Gérer les paiements et factures
   */
  private async handlePayment(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "💳 *PAIEMENT*\n\n" +
        "Que souhaitez-vous payer ?",
      type: "buttons",
      buttons: [
        { id: "bill", title: "📄 Facture" },
        { id: "subscription", title: "🔄 Abonnement" },
        { id: "loan", title: "💰 Échéance crédit" },
        { id: "other", title: "Autre" },
      ],
      intent: "PAIEMENT",
    };
  }

  /**
   * Gérer la consommation (télécom)
   */
  private async handleConsumption(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "📊 *CONSOMMATION*\n\n" +
        "Votre consommation détaillée :\n\n" +
        "📱 Data: 2.5 GB / 5 GB (50%)\n" +
        "📞 Appels: 120 min / 600 min (20%)\n" +
        "💬 SMS: 45 / 100 (45%)\n\n" +
        "_Conso par jour: ~500 MB_",
      type: "buttons",
      buttons: [
        { id: "detail", title: "📋 Détail par jour" },
        { id: "alert", title: "🔔 Activer alerte" },
        { id: "menu", title: "⬅️ Menu principal" },
      ],
      intent: "CONSO",
    };
  }

  /**
   * Gérer les inscriptions (éducation)
   */
  private async handleEnrollment(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "📚 *INSCRIPTION*\n\n" +
        "Pour quelle formation souhaitez-vous vous inscrire ?",
      type: "buttons",
      buttons: [
        { id: "formations", title: "📋 Voir formations" },
        { id: "new", title: "➕ Nouvelle inscription" },
        { id: "status", title: "📍 État inscription" },
      ],
      intent: "INSCRIPTION",
    };
  }

  /**
   * Gérer les horaires et réservations
   */
  private async handleScheduleOrBooking(
    context: ServiceConversationContext,
    intent: ServiceIntent
  ): Promise<BotServiceResponse> {
    if (intent === "HORAIRES") {
      return {
        message:
          "🚌 *HORAIRES*\n\n" +
          "Quelle ligne vous intéresse ?",
        type: "buttons",
        buttons: [
          { id: "line1", title: "🚌 Ligne 1" },
          { id: "line2", title: "🚌 Ligne 2" },
          { id: "all", title: "📋 Toutes les lignes" },
        ],
        intent: "HORAIRES",
      };
    }

    return {
      message:
        "🎫 *RÉSERVATION*\n\n" +
        "Pour quelle destination ?",
      type: "form",
      formFields: [
        { name: "destination", label: "Destination", type: "text", required: true },
        { name: "date", label: "Date", type: "date", required: true },
        { name: "passengers", label: "Nombre de passagers", type: "number", required: true },
      ],
      intent: "RÉSERVATION",
    };
  }

  /**
   * Gérer les demandes inconnues
   */
  private async handleUnknown(context: ServiceConversationContext): Promise<BotServiceResponse> {
    return {
      message:
        "🤔 *Je n'ai pas bien compris*\n\n" +
        "Pouvez-vous reformuler ou utiliser un des codes suivants :\n\n" +
        "• INFO → Informations\n" +
        "• SOLDE → Solde/Position\n" +
        "• SUIVI → Suivre demande\n" +
        "• RÉCLAMATION → Réclamation\n" +
        "• CONSEILLER → Parler à humain\n" +
        "• URGENCE → Urgence\n\n" +
        "_Ou décrivez simplement votre besoin._",
      type: "buttons",
      buttons: [
        { id: "codes", title: "📝 Voir tous les codes" },
        { id: "menu", title: "⬅️ Menu principal" },
        { id: "aide", title: "❓ Aide" },
      ],
      intent: "INFO",
    };
  }

  /**
   * Créer un ticket d'urgence
   */
  private async createEmergencyTicket(context: ServiceConversationContext): Promise<string> {
    const ticketId = `URG-${Date.now()}`;
    const db = admin.firestore();

    await db.collection("crmTickets").add({
      vendorId: context.vendorId,
      source: "whatsapp_chatbot",
      sourceId: context.sessionId,
      clientPhone: context.clientPhone,
      clientName: context.clientName,
      subject: "URGENCE - Chatbot",
      description: "Urgence détectée via chatbot",
      status: "open",
      priority: "critical",
      assignedTo: null,
      createdAt: Timestamp.now(),
      metadata: {
        type: "emergency",
        sector: context.sector,
        conversationId: context.sessionId,
      },
    });

    // Notification aux conseillers
    await db.collection("notifications").add({
      vendorId: context.vendorId,
      type: "emergency_alert",
      title: "🚨 URGENCE CLIENT",
      message: `Urgence signalée par ${context.clientPhone}`,
      priority: "critical",
      read: false,
      createdAt: Timestamp.now(),
    });

    return ticketId;
  }

  /**
   * Créer un ticket de support
   */
  private async createSupportTicket(context: ServiceConversationContext): Promise<string> {
    const ticketId = `SUP-${Date.now()}`;
    const db = admin.firestore();

    await db.collection("crmTickets").add({
      vendorId: context.vendorId,
      source: "whatsapp_chatbot",
      sourceId: context.sessionId,
      clientPhone: context.clientPhone,
      clientName: context.clientName,
      subject: "Demande conseiller - Chatbot",
      description: "Client demande à parler à un conseiller",
      status: "open",
      priority: "normal",
      assignedTo: null,
      createdAt: Timestamp.now(),
      metadata: {
        type: "human_handoff",
        sector: context.sector,
        conversationId: context.sessionId,
      },
    });

    return ticketId;
  }
}

/**
 * Factory pour créer une instance du chatbot service
 */
export function createServiceChatbot(): ServiceChatbot {
  return new ServiceChatbot();
}
