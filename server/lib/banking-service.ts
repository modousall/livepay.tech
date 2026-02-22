/**
 * Banking & Microfinance Module
 * Services métier pour le secteur bancaire et microfinance
 *
 * Fonctionnalités:
 * - Gestion des comptes
 * - Demandes de crédit
 * - Suivi des dossiers
 * - Réclamations
 * - Informations produits bancaires
 */

import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";

// Types
export type AccountType = "savings" | "checking" | "loan" | "investment";
export type LoanStatus = "pending" | "approved" | "rejected" | "disbursed" | "repaid";
export type TransactionType = "deposit" | "withdrawal" | "transfer" | "payment" | "fee";

export interface BankAccount {
  id: string;
  vendorId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  status: "active" | "inactive" | "blocked" | "closed";
  openedAt: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanApplication {
  id: string;
  vendorId: string;
  clientId: string;
  clientPhone: string;
  clientName: string;
  loanType: string;
  requestedAmount: number;
  duration: number; // months
  interestRate?: number;
  purpose: string;
  status: LoanStatus;
  submittedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  disbursedAt?: Date;
  repaidAt?: Date;
  monthlyPayment?: number;
  totalAmount?: number;
  guarantor?: {
    name: string;
    phone: string;
    id: string;
  };
  documents?: string[];
  notes?: string;
  assignedTo?: string; // Loan officer
  createdAt: Date;
  updatedAt: Date;
}

export interface BankTransaction {
  id: string;
  vendorId: string;
  accountId: string;
  clientId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  balanceAfter: number;
  description: string;
  reference: string;
  counterparty?: {
    name: string;
    accountNumber?: string;
    phone?: string;
  };
  status: "pending" | "completed" | "failed" | "reversed";
  processedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface BankProduct {
  id: string;
  vendorId: string;
  name: string;
  type: AccountType;
  description: string;
  minAmount: number;
  maxAmount?: number;
  interestRate?: number;
  duration?: number; // months
  fees?: {
    openingFee?: number;
    monthlyFee?: number;
    transactionFee?: number;
  };
  eligibility?: string[];
  documentsRequired?: string[];
  active: boolean;
  featured?: boolean;
  createdAt: Date;
}

/**
 * Service Banking & Microfinance
 */
export class BankingService {
  private db = admin.firestore();

  /**
   * Créer un compte client
   */
  async createAccount(data: Omit<BankAccount, "id" | "createdAt" | "updatedAt">): Promise<BankAccount> {
    const now = Timestamp.now();
    const accountNumber = this.generateAccountNumber();

    const accountData: Omit<BankAccount, "id" | "createdAt" | "updatedAt"> = {
      ...data,
      accountNumber,
    };

    const docRef = await this.db.collection("bank_accounts").add({
      ...accountData,
      openedAt: Timestamp.fromDate(accountData.openedAt),
      closedAt: accountData.closedAt ? Timestamp.fromDate(accountData.closedAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      ...accountData,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Obtenir un compte par numéro
   */
  async getAccountByNumber(accountNumber: string): Promise<BankAccount | null> {
    const snapshot = await this.db.collection("bank_accounts")
      .where("accountNumber", "==", accountNumber)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      openedAt: data.openedAt?.toDate() || new Date(),
      closedAt: data.closedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as BankAccount;
  }

  /**
   * Obtenir les comptes d'un client
   */
  async getClientAccounts(clientId: string, vendorId: string): Promise<BankAccount[]> {
    const snapshot = await this.db.collection("bank_accounts")
      .where("clientId", "==", clientId)
      .where("vendorId", "==", vendorId)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        openedAt: data.openedAt?.toDate() || new Date(),
        closedAt: data.closedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as BankAccount;
    });
  }

  /**
   * Soumettre une demande de crédit
   */
  async submitLoanApplication(data: Omit<LoanApplication, "id" | "createdAt" | "updatedAt" | "status">): Promise<LoanApplication> {
    const now = Timestamp.now();

    const applicationData = {
      ...data,
      status: "pending" as LoanStatus,
    };

    const docRef = await this.db.collection("loan_applications").add({
      ...applicationData,
      submittedAt: Timestamp.fromDate(applicationData.submittedAt),
      approvedAt: applicationData.approvedAt ? Timestamp.fromDate(applicationData.approvedAt) : null,
      rejectedAt: applicationData.rejectedAt ? Timestamp.fromDate(applicationData.rejectedAt) : null,
      disbursedAt: applicationData.disbursedAt ? Timestamp.fromDate(applicationData.disbursedAt) : null,
      repaidAt: applicationData.repaidAt ? Timestamp.fromDate(applicationData.repaidAt) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Créer un ticket CRM pour suivi
    await this.db.collection("crmTickets").add({
      vendorId: data.vendorId,
      source: "banking",
      sourceId: docRef.id,
      clientPhone: data.clientPhone,
      clientName: data.clientName,
      subject: `Demande de crédit - ${data.loanType}`,
      description: `Demande de ${data.requestedAmount} FCFA pour ${data.purpose}`,
      status: "open",
      priority: "high",
      assignedTo: data.assignedTo || null,
      createdAt: now,
      updatedAt: now,
      metadata: {
        type: "loan_application",
        loanId: docRef.id,
        amount: data.requestedAmount,
      },
    });

    return {
      ...data,
      status: "pending",
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  /**
   * Approuver un crédit
   */
  async approveLoan(loanId: string, vendorId: string, approvalData: {
    approvedBy: string;
    interestRate: number;
    duration: number;
    monthlyPayment: number;
    totalAmount: number;
    notes?: string;
  }): Promise<void> {
    const loanRef = this.db.doc(`loan_applications/${loanId}`);
    const loanSnap = await loanRef.get();

    if (!loanSnap.exists) {
      throw new Error("Loan application not found");
    }

    const loanData = loanSnap.data();
    if (!loanData) {
      throw new Error("Loan data not found");
    }
    if (loanData.vendorId !== vendorId) {
      throw new Error("Unauthorized");
    }

    await loanRef.update({
      status: "approved",
      approvedAt: Timestamp.now(),
      interestRate: approvalData.interestRate,
      duration: approvalData.duration,
      monthlyPayment: approvalData.monthlyPayment,
      totalAmount: approvalData.totalAmount,
      notes: approvalData.notes,
      updatedAt: Timestamp.now(),
    });

    // Notifier le client
    await this.sendNotification(loanData.clientPhone, {
      type: "loan_approved",
      message: `Félicitations ! Votre demande de crédit de ${loanData.requestedAmount} FCFA a été approuvée.`,
      loanId,
    });
  }

  /**
   * Rejeter un crédit
   */
  async rejectLoan(loanId: string, vendorId: string, reason: string): Promise<void> {
    const loanRef = this.db.doc(`loan_applications/${loanId}`);
    const loanSnap = await loanRef.get();

    if (!loanSnap.exists) {
      throw new Error("Loan application not found");
    }

    const loanData = loanSnap.data();
    if (!loanData) {
      throw new Error("Loan data not found");
    }
    if (loanData.vendorId !== vendorId) {
      throw new Error("Unauthorized");
    }

    await loanRef.update({
      status: "rejected",
      rejectedAt: Timestamp.now(),
      notes: reason,
      updatedAt: Timestamp.now(),
    });

    // Notifier le client
    await this.sendNotification(loanData.clientPhone, {
      type: "loan_rejected",
      message: `Votre demande de crédit a été refusée. Raison: ${reason}`,
      loanId,
    });
  }

  /**
   * Effectuer une transaction
   */
  async createTransaction(data: Omit<BankTransaction, "id" | "createdAt">): Promise<BankTransaction> {
    const now = Timestamp.now();

    const transactionData = {
      ...data,
      createdAt: now,
    };

    const docRef = await this.db.collection("bank_transactions").add({
      ...transactionData,
      processedAt: transactionData.processedAt ? Timestamp.fromDate(transactionData.processedAt) : null,
      createdAt: now,
    });

    // Mettre à jour le solde du compte si transaction complétée
    if (data.status === "completed") {
      await this.updateAccountBalance(data.accountId, data.type, data.amount);
    }

    return {
      ...data,
      id: docRef.id,
      createdAt: now.toDate(),
    };
  }

  /**
   * Obtenir l'historique des transactions d'un compte
   */
  async getAccountTransactions(accountId: string, limit: number = 50): Promise<BankTransaction[]> {
    const snapshot = await this.db.collection("bank_transactions")
      .where("accountId", "==", accountId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        processedAt: data.processedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as BankTransaction;
    });
  }

  /**
   * Mettre à jour le solde d'un compte
   */
  private async updateAccountBalance(accountId: string, type: TransactionType, amount: number): Promise<void> {
    const accountRef = this.db.doc(`bank_accounts/${accountId}`);
    const accountSnap = await accountRef.get();

    if (!accountSnap.exists) return;

    const account = accountSnap.data();
    if (!account) return;
    
    let newBalance = account.balance || 0;

    switch (type) {
      case "deposit":
        newBalance += amount;
        break;
      case "withdrawal":
      case "payment":
      case "fee":
        newBalance -= amount;
        break;
      case "transfer":
        // Le transfert sera géré séparément
        break;
    }

    await accountRef.update({
      balance: newBalance,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Envoyer une notification au client
   */
  private async sendNotification(clientPhone: string, data: any): Promise<void> {
    await this.db.collection("notifications").add({
      type: "banking",
      recipientPhone: clientPhone,
      ...data,
      read: false,
      createdAt: Timestamp.now(),
    });
  }

  /**
   * Générer un numéro de compte
   */
  private generateAccountNumber(): string {
    const prefix = "SN01"; // Sénégal - Banque 01
    const randomPart = Math.floor(Math.random() * 10000000000).toString().padStart(10, "0");
    return `${prefix}-${randomPart}`;
  }

  /**
   * Obtenir les produits bancaires
   */
  async getBankProducts(vendorId: string, activeOnly: boolean = true): Promise<BankProduct[]> {
    const snapshot = await this.db.collection("bank_products")
      .where("vendorId", "==", vendorId)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as BankProduct;
    }).filter(p => !activeOnly || p.active !== false);
  }
}

/**
 * Factory pour créer une instance du service banking
 */
export function createBankingService(): BankingService {
  return new BankingService();
}
