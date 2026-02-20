/**
 * Telecom Module
 * Services métier pour le secteur des télécommunications
 * 
 * Fonctionnalités:
 * - Gestion des abonnements
 * - Suivi de consommation (data, appels, SMS)
 * - Recharges (top-ups)
 * - Forfaits et options
 * - Support technique (incidents réseau)
 */

import { Timestamp, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, orderBy, increment, limit } from "firebase/firestore";
import { db } from "../firebase";

// Types d'abonnement
export type SubscriptionType = "prepaid" | "postpaid" | "hybrid";
export type SubscriptionStatus = "active" | "suspended" | "expired" | "cancelled" | "pending";
export type ServiceType = "voice" | "data" | "sms" | "mms" | "roaming";

// Abonnement télécom
export interface TelecomSubscription {
  id: string;
  vendorId: string;
  clientId: string;
  clientPhone: string; // Numéro de téléphone
  clientName: string;
  subscriptionNumber: string;
  subscriptionType: SubscriptionType;
  status: SubscriptionStatus;
  plan: {
    name: string;
    dataAllowance: number; // en MB
    voiceAllowance: number; // en minutes
    smsAllowance: number; // nombre de SMS
    validity: number; // jours
    price: number;
  };
  usage: {
    dataUsed: number; // en MB
    voiceUsed: number; // en minutes
    smsUsed: number; // nombre de SMS
  };
  balance: number; // Solde principal (FCFA)
  bonusBalance: number; // Solde bonus
  activationDate: Date;
  expiryDate: Date;
  autoRenewal: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Consommation détaillée
export interface UsageRecord {
  id: string;
  vendorId: string;
  subscriptionId: string;
  subscriptionNumber: string;
  clientId: string;
  clientPhone: string;
  serviceType: ServiceType;
  direction?: "inbound" | "outbound";
  destination?: string; // Numéro appelé
  duration?: number; // secondes (pour voice)
  dataUsed?: number; // en KB (pour data)
  smsCount?: number; // nombre de SMS
  cost: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Recharge (Top-up)
export interface TopUp {
  id: string;
  vendorId: string;
  subscriptionId: string;
  subscriptionNumber: string;
  clientId: string;
  clientPhone: string;
  amount: number;
  type: "main" | "bonus" | "data" | "voice" | "sms";
  paymentMethod?: string;
  scratchCardCode?: string;
  status: "pending" | "completed" | "failed" | "expired";
  processedAt?: Date;
  expiryDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Forfait/Option
export interface TelecomPlan {
  id: string;
  vendorId: string;
  name: string;
  type: SubscriptionType;
  description: string;
  price: number;
  validity: number; // jours
  benefits: {
    data: number; // MB
    voice: number; // minutes
    sms: number; // nombre
    roaming?: boolean;
    socialApps?: boolean; // WhatsApp, Facebook illimités
  };
  eligibility?: {
    minBalance?: number;
    subscriptionType?: SubscriptionType[];
  };
  active: boolean;
  featured?: boolean;
  createdAt: Date;
}

// Incident réseau
export interface NetworkIncident {
  id: string;
  vendorId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  subscriptionNumber?: string;
  type: "no_signal" | "slow_data" | "call_failure" | "sms_failure" | "billing" | "other";
  description: string;
  location?: string;
  status: "reported" | "investigating" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string;
  resolution?: string;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service Telecom
 */
export class TelecomService {
  /**
   * Générer un numéro d'abonnement
   */
  private generateSubscriptionNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    return `SUB-${year}-${random}`;
  }

  /**
   * Créer un nouvel abonnement
   */
  async createSubscription(data: Omit<TelecomSubscription, "id" | "subscriptionNumber" | "createdAt" | "updatedAt">): Promise<TelecomSubscription> {
    const now = Timestamp.now();
    const subscriptionNumber = this.generateSubscriptionNumber();

    const subscriptionData = {
      ...data,
      subscriptionNumber,
      status: data.status || "active",
    };

    const docRef = await addDoc(collection(db, "telecom_subscriptions"), {
      ...subscriptionData,
      activationDate: Timestamp.fromDate(subscriptionData.activationDate),
      expiryDate: Timestamp.fromDate(subscriptionData.expiryDate),
      createdAt: now,
      updatedAt: now,
    });

    return {
      ...data,
      subscriptionNumber,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Obtenir un abonnement par numéro
   */
  async getSubscriptionByNumber(subscriptionNumber: string): Promise<TelecomSubscription | null> {
    const q = query(
      collection(db, "telecom_subscriptions"),
      where("subscriptionNumber", "==", subscriptionNumber)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      activationDate: data.activationDate?.toDate() || new Date(),
      expiryDate: data.expiryDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as TelecomSubscription;
  }

  /**
   * Obtenir les abonnements d'un client
   */
  async getClientSubscriptions(clientId: string, vendorId: string): Promise<TelecomSubscription[]> {
    const q = query(
      collection(db, "telecom_subscriptions"),
      where("clientId", "==", clientId),
      where("vendorId", "==", vendorId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        activationDate: data.activationDate?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TelecomSubscription;
    });
  }

  /**
   * Enregistrer une consommation
   */
  async recordUsage(data: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord> {
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, "telecom_usage"), {
      ...data,
      timestamp: Timestamp.fromDate(data.timestamp),
      createdAt: now,
    });

    // Mettre à jour l'abonnement
    const subscriptionRef = doc(db, "telecom_subscriptions", data.subscriptionId);
    const updateData: any = {
      updatedAt: now,
    };

    if (data.serviceType === "data" && data.dataUsed) {
      updateData["usage.dataUsed"] = increment(data.dataUsed);
    } else if (data.serviceType === "voice" && data.duration) {
      updateData["usage.voiceUsed"] = increment(data.duration / 60); // Convert to minutes
    } else if (data.serviceType === "sms" && data.smsCount) {
      updateData["usage.smsUsed"] = increment(data.smsCount);
    }

    // Déduire le coût du solde
    if (data.cost > 0) {
      updateData.balance = increment(-data.cost);
    }

    await updateDoc(subscriptionRef, updateData);

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
    };
  }

  /**
   * Effectuer une recharge (Top-up)
   */
  async performTopUp(data: Omit<TopUp, "id" | "createdAt">): Promise<TopUp> {
    const now = Timestamp.now();

    const topUpData = {
      ...data,
      status: "pending" as const,
    };

    const docRef = await addDoc(collection(db, "telecom_topups"), {
      ...topUpData,
      expiryDate: data.expiryDate ? Timestamp.fromDate(data.expiryDate) : null,
      processedAt: null,
      createdAt: now,
    });

    // Traiter immédiatement pour les recharges instantanées
    if (data.type === "main") {
      await this.processTopUp(docRef.id, data.vendorId);
    }

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
    };
  }

  /**
   * Traiter une recharge
   */
  async processTopUp(topUpId: string, vendorId: string): Promise<void> {
    const topUpRef = doc(db, "telecom_topups", topUpId);
    const topUpSnap = await getDoc(topUpRef);

    if (!topUpSnap.exists()) {
      throw new Error("Recharge introuvable");
    }

    const topUpData = topUpSnap.data();
    if (topUpData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    const subscriptionRef = doc(db, "telecom_subscriptions", topUpData.subscriptionId);
    
    // Créditer le solde
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (topUpData.type === "main") {
      updateData.balance = increment(topUpData.amount);
    } else if (topUpData.type === "bonus") {
      updateData.bonusBalance = increment(topUpData.amount);
    }

    await updateDoc(subscriptionRef, updateData);
    await updateDoc(topUpRef, {
      status: "completed",
      processedAt: Timestamp.now(),
    });
  }

  /**
   * Souscrire à un forfait
   */
  async subscribeToPlan(
    subscriptionId: string,
    planId: string,
    vendorId: string
  ): Promise<void> {
    const subscriptionRef = doc(db, "telecom_subscriptions", subscriptionId);
    const subscriptionSnap = await getDoc(subscriptionRef);

    if (!subscriptionSnap.exists()) {
      throw new Error("Abonnement introuvable");
    }

    const subscriptionData = subscriptionSnap.data();
    if (subscriptionData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    const planRef = doc(db, "telecom_plans", planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      throw new Error("Forfait introuvable");
    }

    const planData = planSnap.data();

    // Vérifier le solde
    if (subscriptionData.balance < planData.price) {
      throw new Error("Solde insuffisant");
    }

    // Mettre à jour l'abonnement
    const now = Timestamp.now();
    const newExpiryDate = new Date(now.toDate().getTime() + planData.validity * 24 * 60 * 60 * 1000);

    await updateDoc(subscriptionRef, {
      plan: {
        name: planData.name,
        dataAllowance: planData.benefits.data,
        voiceAllowance: planData.benefits.voice,
        smsAllowance: planData.benefits.sms,
        validity: planData.validity,
        price: planData.price,
      },
      usage: {
        dataUsed: 0,
        voiceUsed: 0,
        smsUsed: 0,
      },
      balance: increment(-planData.price),
      expiryDate: Timestamp.fromDate(newExpiryDate),
      updatedAt: now,
    });
  }

  /**
   * Obtenir l'historique de consommation
   */
  async getUsageHistory(
    subscriptionId: string,
    limit: number = 50
  ): Promise<UsageRecord[]> {
    const q = query(
      collection(db, "telecom_usage"),
      where("subscriptionId", "==", subscriptionId),
      orderBy("timestamp", "desc"),
      limit as any
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as UsageRecord;
    });
  }

  /**
   * Obtenir les recharges d'un client
   */
  async getClientTopUps(clientId: string, vendorId: string): Promise<TopUp[]> {
    const q = query(
      collection(db, "telecom_topups"),
      where("clientId", "==", clientId),
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        expiryDate: data.expiryDate?.toDate(),
        processedAt: data.processedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as TopUp;
    });
  }

  /**
   * Signaler un incident réseau
   */
  async reportNetworkIncident(data: Omit<NetworkIncident, "id" | "createdAt" | "updatedAt">): Promise<NetworkIncident> {
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, "network_incidents"), {
      ...data,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Créer un ticket CRM
    await addDoc(collection(db, "crmTickets"), {
      vendorId: data.vendorId,
      source: "telecom_network",
      sourceId: docRef.id,
      clientPhone: data.clientPhone,
      clientName: data.clientName,
      subject: `Incident réseau - ${data.type}`,
      description: data.description,
      status: "open",
      priority: data.priority,
      assignedTo: data.assignedTo || null,
      createdAt: now,
      updatedAt: now,
      metadata: {
        type: "network_incident",
        incidentId: docRef.id,
        location: data.location,
      },
    });

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Résoudre un incident
   */
  async resolveIncident(
    incidentId: string,
    vendorId: string,
    resolution: string
  ): Promise<void> {
    const incidentRef = doc(db, "network_incidents", incidentId);
    const incidentSnap = await getDoc(incidentRef);

    if (!incidentSnap.exists()) {
      throw new Error("Incident introuvable");
    }

    const incidentData = incidentSnap.data();
    if (incidentData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    await updateDoc(incidentRef, {
      status: "resolved",
      resolution,
      resolvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Obtenir les forfaits disponibles
   */
  async getTelecomPlans(vendorId: string, activeOnly: boolean = true): Promise<TelecomPlan[]> {
    const q = query(
      collection(db, "telecom_plans"),
      where("vendorId", "==", vendorId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as TelecomPlan;
    }).filter(p => !activeOnly || p.active !== false);
  }

  /**
   * Vérifier l'éligibilité à un forfait
   */
  async checkPlanEligibility(
    subscriptionId: string,
    planId: string,
    vendorId: string
  ): Promise<{ eligible: boolean; reason?: string }> {
    const subscriptionRef = doc(db, "telecom_subscriptions", subscriptionId);
    const subscriptionSnap = await getDoc(subscriptionRef);

    if (!subscriptionSnap.exists()) {
      return { eligible: false, reason: "Abonnement introuvable" };
    }

    const subscriptionData = subscriptionSnap.data();
    if (subscriptionData.vendorId !== vendorId) {
      return { eligible: false, reason: "Non autorisé" };
    }

    const planRef = doc(db, "telecom_plans", planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return { eligible: false, reason: "Forfait introuvable" };
    }

    const planData = planSnap.data();

    // Vérifier éligibilité
    if (planData.eligibility) {
      if (planData.eligibility.minBalance && subscriptionData.balance < planData.eligibility.minBalance) {
        return { eligible: false, reason: "Solde insuffisant" };
      }

      if (planData.eligibility.subscriptionType && 
          !planData.eligibility.subscriptionType.includes(subscriptionData.subscriptionType)) {
        return { eligible: false, reason: "Type d'abonnement non éligible" };
      }
    }

    return { eligible: true };
  }
}

/**
 * Factory pour créer une instance du service telecom
 */
export function createTelecomService(): TelecomService {
  return new TelecomService();
}
