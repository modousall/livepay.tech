/**
 * Insurance Module
 * Services métier pour le secteur des assurances
 * 
 * Fonctionnalités:
 * - Gestion des polices (contrats)
 * - Déclarations de sinistres
 * - Gestion des primes
 * - Bénéficiaires
 * - Types d'assurance (auto, habitation, santé, vie)
 */

import { Timestamp, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, orderBy, increment } from "firebase/firestore";
import { db } from "../firebase";

// Types d'assurance
export type InsuranceType = 
  | "auto"
  | "home"
  | "health"
  | "life"
  | "travel"
  | "business"
  | "agriculture"
  | "microinsurance";

export type PolicyStatus = "active" | "suspended" | "expired" | "cancelled" | "pending";
export type ClaimStatus = "reported" | "under_review" | "approved" | "rejected" | "paid" | "closed";
export type PaymentFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "single";

// Police d'assurance (Contrat)
export interface InsurancePolicy {
  id: string;
  vendorId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  policyNumber: string;
  insuranceType: InsuranceType;
  coverage: {
    description: string;
    maxAmount: number;
    deductible?: number;
    exclusions?: string[];
  };
  insuredValue: number;
  premiumAmount: number;
  paymentFrequency: PaymentFrequency;
  startDate: Date;
  endDate: Date;
  status: PolicyStatus;
  beneficiaries?: Array<{
    name: string;
    relationship: string;
    percentage: number;
    phone?: string;
  }>;
  documents?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Déclaration de sinistre
export interface InsuranceClaim {
  id: string;
  vendorId: string;
  policyId: string;
  policyNumber: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  claimNumber: string;
  insuranceType: InsuranceType;
  incidentDate: Date;
  reportedDate: Date;
  description: string;
  location?: string;
  amount: number;
  status: ClaimStatus;
  assignedTo?: string; // Claims adjuster
  adjusterNotes?: string;
  documents?: string[];
  photos?: string[];
  witnesses?: Array<{
    name: string;
    phone: string;
    statement?: string;
  }>;
  paymentAmount?: number;
  paidAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Prime d'assurance
export interface InsurancePremium {
  id: string;
  vendorId: string;
  policyId: string;
  policyNumber: string;
  clientId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  period: {
    start: Date;
    end: Date;
  };
  reminderSent?: boolean;
  lateFees?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Produit d'assurance
export interface InsuranceProduct {
  id: string;
  vendorId: string;
  name: string;
  type: InsuranceType;
  description: string;
  coverage: {
    description: string;
    minAmount: number;
    maxAmount: number;
    deductible?: number;
  };
  premiumRate: number; // Pourcentage de la valeur assurée
  paymentFrequencies: PaymentFrequency[];
  eligibility?: {
    minAge?: number;
    maxAge?: number;
    requirements?: string[];
  };
  documentsRequired?: string[];
  exclusions?: string[];
  active: boolean;
  featured?: boolean;
  createdAt: Date;
}

/**
 * Service Insurance
 */
export class InsuranceService {
  /**
   * Générer un numéro de police
   */
  private generatePolicyNumber(type: InsuranceType): string {
    const year = new Date().getFullYear();
    const typeCode = type.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    return `POL-${typeCode}-${year}-${random}`;
  }

  /**
   * Générer un numéro de sinistre
   */
  private generateClaimNumber(type: InsuranceType): string {
    const year = new Date().getFullYear();
    const typeCode = type.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
    return `CLM-${typeCode}-${year}-${random}`;
  }

  /**
   * Souscrire une nouvelle police
   */
  async subscribePolicy(data: Omit<InsurancePolicy, "id" | "policyNumber" | "createdAt" | "updatedAt">): Promise<InsurancePolicy> {
    const now = Timestamp.now();
    const policyNumber = this.generatePolicyNumber(data.insuranceType);

    const policyData = {
      ...data,
      policyNumber,
      status: data.status || "pending",
    };

    const docRef = await addDoc(collection(db, "insurance_policies"), {
      ...policyData,
      startDate: Timestamp.fromDate(policyData.startDate),
      endDate: Timestamp.fromDate(policyData.endDate),
      createdAt: now,
      updatedAt: now,
    });

    // Créer la première prime
    await this.createPremium({
      vendorId: data.vendorId,
      policyId: docRef.id,
      policyNumber,
      clientId: data.clientId,
      amount: data.premiumAmount,
      dueDate: policyData.startDate,
      status: "pending",
      period: {
        start: policyData.startDate,
        end: data.paymentFrequency === "monthly" 
          ? new Date(policyData.startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
          : policyData.endDate,
      },
      createdAt: new Date(),
    });

    // Créer un ticket CRM pour suivi
    await addDoc(collection(db, "crmTickets"), {
      vendorId: data.vendorId,
      source: "insurance",
      sourceId: docRef.id,
      clientPhone: data.clientPhone,
      clientName: data.clientName,
      subject: `Nouvelle police ${data.insuranceType}`,
      description: `Police ${policyNumber} - ${data.insuranceType}`,
      status: "open",
      priority: "normal",
      createdAt: now,
      updatedAt: now,
      metadata: {
        type: "policy_subscription",
        policyId: docRef.id,
        policyNumber,
      },
    });

    return {
      ...data,
      policyNumber,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Obtenir une police par numéro
   */
  async getPolicyByNumber(policyNumber: string): Promise<InsurancePolicy | null> {
    const q = query(
      collection(db, "insurance_policies"),
      where("policyNumber", "==", policyNumber)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as InsurancePolicy;
  }

  /**
   * Obtenir les polices d'un client
   */
  async getClientPolicies(clientId: string, vendorId: string): Promise<InsurancePolicy[]> {
    const q = query(
      collection(db, "insurance_policies"),
      where("clientId", "==", clientId),
      where("vendorId", "==", vendorId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as InsurancePolicy;
    });
  }

  /**
   * Déclarer un sinistre
   */
  async reportClaim(data: Omit<InsuranceClaim, "id" | "claimNumber" | "createdAt" | "updatedAt">): Promise<InsuranceClaim> {
    const now = Timestamp.now();
    const claimNumber = this.generateClaimNumber(data.insuranceType);

    const claimData = {
      ...data,
      claimNumber,
      status: "reported" as ClaimStatus,
    };

    const docRef = await addDoc(collection(db, "insurance_claims"), {
      ...claimData,
      incidentDate: Timestamp.fromDate(claimData.incidentDate),
      reportedDate: Timestamp.fromDate(claimData.reportedDate),
      paidAt: claimData.paidAt ? Timestamp.fromDate(claimData.paidAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour la police
    const policyRef = doc(db, "insurance_policies", data.policyId);
    await updateDoc(policyRef, {
      metadata: {
        claimCount: increment(1),
        lastClaimDate: now,
      },
      updatedAt: now,
    });

    // Créer un ticket CRM prioritaire
    await addDoc(collection(db, "crmTickets"), {
      vendorId: data.vendorId,
      source: "insurance_claims",
      sourceId: docRef.id,
      clientPhone: data.clientPhone,
      clientName: data.clientName,
      subject: `Sinistre déclaré - ${claimNumber}`,
      description: data.description,
      status: "open",
      priority: "high",
      assignedTo: data.assignedTo || null,
      createdAt: now,
      updatedAt: now,
      metadata: {
        type: "insurance_claim",
        claimId: docRef.id,
        claimNumber,
        amount: data.amount,
      },
    });

    // Notifier le client
    await this.sendNotification(data.clientPhone, {
      type: "claim_reported",
      message: `Votre sinistre ${claimNumber} a été enregistré. Un expert vous contactera sous 48h.`,
      claimNumber,
    });

    return {
      ...data,
      claimNumber,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Approuver un sinistre
   */
  async approveClaim(
    claimId: string,
    vendorId: string,
    approvalData: {
      approvedBy: string;
      paymentAmount: number;
      notes?: string;
    }
  ): Promise<void> {
    const claimRef = doc(db, "insurance_claims", claimId);
    const claimSnap = await getDoc(claimRef);

    if (!claimSnap.exists()) {
      throw new Error("Sinistre introuvable");
    }

    const claimData = claimSnap.data();
    if (claimData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    await updateDoc(claimRef, {
      status: "approved",
      paymentAmount: approvalData.paymentAmount,
      adjusterNotes: approvalData.notes,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Payer un sinistre
   */
  async payClaim(claimId: string, vendorId: string): Promise<void> {
    const claimRef = doc(db, "insurance_claims", claimId);
    const claimSnap = await getDoc(claimRef);

    if (!claimSnap.exists()) {
      throw new Error("Sinistre introuvable");
    }

    const claimData = claimSnap.data();
    if (claimData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    await updateDoc(claimRef, {
      status: "paid",
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Notifier le client
    await this.sendNotification(claimData.clientPhone, {
      type: "claim_paid",
      message: `Votre sinistre ${claimData.claimNumber} a été payé. Montant: ${claimData.paymentAmount} FCFA`,
      claimNumber: claimData.claimNumber,
    });
  }

  /**
   * Rejeter un sinistre
   */
  async rejectClaim(
    claimId: string,
    vendorId: string,
    reason: string
  ): Promise<void> {
    const claimRef = doc(db, "insurance_claims", claimId);
    const claimSnap = await getDoc(claimRef);

    if (!claimSnap.exists()) {
      throw new Error("Sinistre introuvable");
    }

    const claimData = claimSnap.data();
    if (claimData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    await updateDoc(claimRef, {
      status: "rejected",
      rejectionReason: reason,
      updatedAt: Timestamp.now(),
    });

    // Notifier le client
    await this.sendNotification(claimData.clientPhone, {
      type: "claim_rejected",
      message: `Votre sinistre ${claimData.claimNumber} a été refusé. Raison: ${reason}`,
      claimNumber: claimData.claimNumber,
    });
  }

  /**
   * Créer une prime
   */
  async createPremium(data: Omit<InsurancePremium, "id" | "createdAt">): Promise<InsurancePremium> {
    const now = Timestamp.now();

    const docRef = await addDoc(collection(db, "insurance_premiums"), {
      ...data,
      dueDate: Timestamp.fromDate(data.dueDate),
      paidDate: data.paidDate ? Timestamp.fromDate(data.paidDate) : null,
      period: {
        start: Timestamp.fromDate(data.period.start),
        end: Timestamp.fromDate(data.period.end),
      },
      createdAt: now,
    });

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
    };
  }

  /**
   * Payer une prime
   */
  async payPremium(premiumId: string, vendorId: string, paymentData: {
    paymentMethod: string;
    paidDate: Date;
  }): Promise<void> {
    const premiumRef = doc(db, "insurance_premiums", premiumId);
    const premiumSnap = await getDoc(premiumRef);

    if (!premiumSnap.exists()) {
      throw new Error("Prime introuvable");
    }

    const premiumData = premiumSnap.data();
    if (premiumData.vendorId !== vendorId) {
      throw new Error("Non autorisé");
    }

    await updateDoc(premiumRef, {
      status: "paid",
      paidDate: Timestamp.fromDate(paymentData.paidDate),
      paymentMethod: paymentData.paymentMethod,
      updatedAt: Timestamp.now(),
    });

    // Si c'est la première prime, activer la police
    if (premiumData.status === "pending") {
      const policyRef = doc(db, "insurance_policies", premiumData.policyId);
      await updateDoc(policyRef, {
        status: "active",
        updatedAt: Timestamp.now(),
      });
    }
  }

  /**
   * Obtenir les primes impayées
   */
  async getOverduePremiums(vendorId: string): Promise<InsurancePremium[]> {
    const now = new Date();
    const q = query(
      collection(db, "insurance_premiums"),
      where("vendorId", "==", vendorId),
      where("status", "==", "pending"),
      where("dueDate", "<", Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        paidDate: data.paidDate?.toDate(),
        period: {
          start: data.period.start?.toDate() || new Date(),
          end: data.period.end?.toDate() || new Date(),
        },
        createdAt: data.createdAt?.toDate() || new Date(),
      } as InsurancePremium;
    });
  }

  /**
   * Envoyer une notification
   */
  private async sendNotification(clientPhone: string, data: any): Promise<void> {
    await addDoc(collection(db, "notifications"), {
      type: "insurance",
      recipientPhone: clientPhone,
      ...data,
      read: false,
      createdAt: Timestamp.now(),
    });
  }

  /**
   * Obtenir les produits d'assurance
   */
  async getInsuranceProducts(vendorId: string, activeOnly: boolean = true): Promise<InsuranceProduct[]> {
    const q = query(
      collection(db, "insurance_products"),
      where("vendorId", "==", vendorId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as InsuranceProduct;
    }).filter(p => !activeOnly || p.active !== false);
  }

  /**
   * Obtenir un sinistre par numéro
   */
  async getClaimByNumber(claimNumber: string): Promise<InsuranceClaim | null> {
    const q = query(
      collection(db, "insurance_claims"),
      where("claimNumber", "==", claimNumber)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      ...data,
      incidentDate: data.incidentDate?.toDate() || new Date(),
      reportedDate: data.reportedDate?.toDate() || new Date(),
      paidAt: data.paidAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as InsuranceClaim;
  }

  /**
   * Obtenir les sinistres d'un client
   */
  async getClientClaims(clientId: string, vendorId: string): Promise<InsuranceClaim[]> {
    const q = query(
      collection(db, "insurance_claims"),
      where("clientId", "==", clientId),
      where("vendorId", "==", vendorId),
      orderBy("reportedDate", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        incidentDate: data.incidentDate?.toDate() || new Date(),
        reportedDate: data.reportedDate?.toDate() || new Date(),
        paidAt: data.paidAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as InsuranceClaim;
    });
  }
}

/**
 * Factory pour créer une instance du service insurance
 */
export function createInsuranceService(): InsuranceService {
  return new InsuranceService();
}
