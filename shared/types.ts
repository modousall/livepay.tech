/**
 * LivePay Type Definitions
 * Pure TypeScript types for Firebase Firestore
 */

// ========== USER TYPES ==========
// Advanced Role System
export type UserRole =
  | "super_admin"      // Gestion plateforme globale
  | "admin"            // Gestion entité
  | "manager"          // Manager (ventes & stock)
  | "operator"         // Opérateur (commandes, messages)
  | "cashier"          // Caissier (validations paiements)
  | "support"          // Support client (CRM)
  | "logistics"        // Logistique (livraisons, stock)
  | "analyst"          // Analyste (rapports)
  | "vendor";          // Vendeur (rôle legacy)

// Permissions granulaires
export interface Permission {
  resource: string;
  actions: Array<"create" | "read" | "update" | "delete" | "execute">;
  conditions?: Record<string, any>;
  fields?: string[]; // Champs spécifiques autorisés
}

// Définition de rôle
export interface RoleDefinition {
  role: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
  inheritedFrom?: UserRole[];
  canAssign?: UserRole[]; // Rôles que ce rôle peut attribuer
}

// Matrice des permissions par défaut
export const ROLE_PERMISSIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    role: "super_admin",
    label: "Super Administrateur",
    description: "Gestion complète de la plateforme",
    permissions: [
      { resource: "*", actions: ["create", "read", "update", "delete", "execute"] },
    ],
    canAssign: ["admin", "manager", "operator", "cashier", "support", "logistics", "analyst", "vendor"],
  },
  admin: {
    role: "admin",
    label: "Administrateur",
    description: "Gestion d'une entité",
    permissions: [
      { resource: "users", actions: ["create", "read", "update", "delete"] },
      { resource: "vendors", actions: ["create", "read", "update", "delete"] },
      { resource: "products", actions: ["create", "read", "update", "delete"] },
      { resource: "orders", actions: ["create", "read", "update", "delete"] },
      { resource: "payments", actions: ["create", "read", "update", "delete"] },
      { resource: "crm_tickets", actions: ["create", "read", "update", "delete"] },
      { resource: "reports", actions: ["read", "execute"] },
      { resource: "settings", actions: ["read", "update"] },
    ],
    inheritedFrom: ["manager"],
    canAssign: ["manager", "operator", "cashier", "support", "logistics", "analyst"],
  },
  manager: {
    role: "manager",
    label: "Manager",
    description: "Gestion des ventes et du stock",
    permissions: [
      { resource: "products", actions: ["create", "read", "update", "delete"] },
      { resource: "orders", actions: ["create", "read", "update"] },
      { resource: "appointments", actions: ["create", "read", "update", "delete"] },
      { resource: "clients", actions: ["read", "update"] },
      { resource: "reports", actions: ["read"] },
    ],
    inheritedFrom: ["operator"],
    canAssign: ["operator", "cashier"],
  },
  operator: {
    role: "operator",
    label: "Opérateur",
    description: "Prise de commandes et envoi de messages",
    permissions: [
      { resource: "orders", actions: ["create", "read", "update"] },
      { resource: "products", actions: ["read"] },
      { resource: "clients", actions: ["create", "read", "update"] },
      { resource: "appointments", actions: ["create", "read", "update"] },
      { resource: "queue_tickets", actions: ["create", "read", "update"] },
    ],
    canAssign: [],
  },
  cashier: {
    role: "cashier",
    label: "Caissier",
    description: "Validation des paiements",
    permissions: [
      { resource: "orders", actions: ["read", "update"] },
      { resource: "payments", actions: ["create", "read", "update"] },
      { resource: "invoices", actions: ["create", "read", "update"] },
    ],
    canAssign: [],
  },
  support: {
    role: "support",
    label: "Support Client",
    description: "Gestion des réclamations et CRM",
    permissions: [
      { resource: "crm_tickets", actions: ["create", "read", "update", "delete"] },
      { resource: "clients", actions: ["read", "update"] },
      { resource: "orders", actions: ["read"] },
      { resource: "whatsapp_messages", actions: ["create", "read"] },
    ],
    canAssign: [],
  },
  logistics: {
    role: "logistics",
    label: "Logistique",
    description: "Gestion des livraisons et interventions",
    permissions: [
      { resource: "orders", actions: ["read", "update"] },
      { resource: "products", actions: ["read", "update"] },
      { resource: "service_interventions", actions: ["create", "read", "update", "delete"] },
      { resource: "shipping", actions: ["create", "read", "update", "delete"] },
    ],
    canAssign: [],
  },
  analyst: {
    role: "analyst",
    label: "Analyste",
    description: "Rapports et analytics",
    permissions: [
      { resource: "reports", actions: ["read", "execute"] },
      { resource: "orders", actions: ["read"] },
      { resource: "products", actions: ["read"] },
      { resource: "clients", actions: ["read"] },
      { resource: "analytics", actions: ["read", "execute"] },
    ],
    canAssign: [],
  },
  vendor: {
    role: "vendor",
    label: "Vendeur",
    description: "Vendeur (rôle legacy)",
    permissions: [
      { resource: "products", actions: ["create", "read", "update", "delete"] },
      { resource: "orders", actions: ["create", "read", "update"] },
      { resource: "clients", actions: ["create", "read", "update"] },
    ],
    canAssign: [],
  },
};

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  role: UserRole;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = User; // No password in Firebase client SDK

// ========== WABA (WhatsApp Business Account) - Multi-WABA Support ==========
export interface WABAInstance {
  id: string; // Unique WABA identifier
  vendorId: string;
  provider: "wasender" | "meta" | "unipile"; // Fournisseur WhatsApp
  phoneNumber: string; // Numéro de téléphone du vendor (ex: +221701111111)
  wasenderInstanceId?: string; // ID de l'instance Wasender
  wasenderApiKey?: string; // API key Wasender pour cette instance
  wasenderWebhookSecret?: string; // Secret pour valider les webhooks
  metaPhoneNumberId?: string; // Meta Cloud API
  metaAccessToken?: string;
  unipileInstanceId?: string; // Unipile instance ID
  unipileApiKey?: string;
  status: "connected" | "disconnected" | "pending";
  lastSync?: Date;
  failoverProvider?: "wasender" | "meta" | "unipile"; // Fallback provider
  createdAt: Date;
  updatedAt: Date;
}

export type InsertWABAInstance = Omit<WABAInstance, "id" | "createdAt" | "updatedAt">;

// ========== VENDOR CONFIG ==========
export type VendorStatus = "active" | "inactive" | "suspended";
export type VendorSegment = "live_seller" | "shop" | "events" | "services" | "b2b";

export interface VendorConfig {
  id: string;
  vendorId: string;
  businessName: string;
  mobileMoneyNumber?: string; // Phone number for receiving payments
  preferredPaymentMethod: string;
  // Legacy Meta Cloud API fields
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappVerifyToken?: string;
  // Multi-WABA support
  wabaInstanceId?: string; // Reference to current WABA instance
  wabaProvider?: "wasender" | "meta" | "unipile"; // Current provider
  status: VendorStatus;
  liveMode: boolean;
  reservationDurationMinutes: number;
  autoReplyEnabled: boolean;
  welcomeMessage?: string;
  segment: VendorSegment;
  allowQuantitySelection: boolean;
  requireDeliveryAddress: boolean;
  autoReminderEnabled: boolean;
  upsellEnabled: boolean;
  minTrustScoreRequired: number;
  messageTemplates?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InsertVendorConfig = Omit<VendorConfig, "id" | "createdAt" | "updatedAt">;

// ========== PRODUCT ==========
export interface Product {
  id: string;
  vendorId: string;
  keyword: string;
  shareCode?: string;
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  imageUrl?: string;
  images?: string;
  category?: string;
  stock: number;
  reservedStock: number;
  active: boolean;
  featured?: boolean;
  createdAt: Date;
}

export type InsertProduct = Omit<Product, "id" | "createdAt" | "shareCode" | "reservedStock" | "vendorId">;

// ========== ORDER ==========
export type OrderStatus = "pending" | "reserved" | "paid" | "expired" | "cancelled";
export type PaymentMethod = "wave" | "orange_money" | "card" | "cash" | "mtn_momo" | "moov_money" | "free_money" | "paydunya";

// PayDunya transaction status
export type PayDunyaStatus = "pending" | "cancelled" | "completed" | "failed";

// Return and refund types for business logic
export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded";
export type RefundStatus = "pending" | "success" | "failed";

export interface Order {
  // Identifiants
  id: string;
  vendorId: string;
  productId: string;
  sessionId?: string;

  // Client
  clientPhone: string;
  clientName?: string;
  clientId?: string;
  clientTrustScore?: number;

  // Produit
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;

  // Commande
  status: OrderStatus;
  notes?: string;
  deliveryAddress?: string;

  // Paiement
  paymentMethod?: PaymentMethod;
  paymentToken: string;
  paymentUrl?: string;
  paymentReference?: string;
  paymentProof?: string;
  pspReference?: string;

  // Réservation
  reservedAt?: Date;
  expiresAt: Date;
  paidAt?: Date;

  // Return/Refund tracking
  returnId?: string;
  returnStatus?: ReturnStatus;
  refundStatus?: RefundStatus;

  // Métadonnées
  reminderSent: boolean;
  paymentTimeSeconds?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export type InsertOrder = Omit<Order, "id" | "createdAt" | "updatedAt">;

// ========== AUDIT LOG ==========
export interface OrderAuditLog {
  id: string;
  orderId: string;
  vendorId: string;
  action: "created" | "status_changed" | "payment_received" | "cancelled" | "expired";
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  changedBy: "system" | "webhook" | "vendor" | "admin";
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ========== RETURN/REFUND ==========
export interface OrderReturn {
  id: string;
  orderId: string;
  vendorId: string;
  clientPhone: string;
  reason: string;
  status: ReturnStatus;
  requestedAt: Date;
  approvedAt?: Date;
  receivedAt?: Date;
  refundStatus?: RefundStatus;
  refundAmount: number;
  notes?: string;
  createdAt: Date;
}

// ========== LIVE SESSION ==========
export interface LiveSession {
  id: string;
  vendorId: string;
  title: string;
  platform: string;
  active: boolean;
  createdAt: Date;
  endedAt?: Date;
}

export type InsertLiveSession = Omit<LiveSession, "id" | "createdAt" | "endedAt" | "active" | "vendorId">;

// ========== INVOICE ==========
export type InvoiceStatus = "pending" | "paid" | "expired" | "cancelled";

export interface Invoice {
  id: string;
  vendorId: string;
  sessionId?: string;
  productId?: string;
  clientName: string;
  clientPhone: string;
  productName: string;
  amount: number;
  status: InvoiceStatus;
  token: string;
  expiresAt: Date;
  paymentMethod?: PaymentMethod;
  paymentProviderRef?: string;
  paidAt?: Date;
  createdAt: Date;
}

export type InsertInvoice = Omit<Invoice, "id" | "createdAt">;

// ========== CLIENT (CRM) ==========
export type ClientTier = "bronze" | "silver" | "gold" | "diamond";

export interface Client {
  id: string;
  vendorId: string;
  phone: string;
  name?: string;
  trustScore: number;
  totalOrders: number;
  successfulPayments: number;
  expiredReservations: number;
  totalSpent: number;
  tier: ClientTier;
  preferredPayment?: PaymentMethod;
  avgPaymentTimeSeconds?: number;
  lastOrderAt?: Date;
  firstOrderAt?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type InsertClient = Omit<Client, "id" | "createdAt" | "updatedAt">;
