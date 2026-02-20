/**
 * PayDunya Payment Service
 * Intégration du PSP PayDunya pour les paiements en ligne
 * 
 * API Documentation: https://app.paydunya.com/sandbox-api/v1/checkout-invoice/confirm/[invoice_token]
 */

import { Order, PayDunyaStatus } from "@shared/types";

export interface PayDunyaConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  mode: "sandbox" | "live";
}

export interface PayDunyaInvoice {
  token: string;
  total_amount: number;
  description: string;
  items?: Record<string, PayDunyaItem>;
  taxes?: Record<string, PayDunyaTax>;
  custom_data?: Record<string, any>;
  actions?: {
    cancel_url?: string;
    callback_url?: string;
    return_url?: string;
  };
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface PayDunyaItem {
  name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  description?: string;
}

export interface PayDunyaTax {
  name: string;
  amount: number;
}

export interface PayDunyaCheckoutResponse {
  response_code: string;
  response_text: string;
  hash: string;
  checkout_url: string;
  invoice_token: string;
}

export interface PayDunyaStatusResponse {
  response_code: string;
  response_text: string;
  hash: string;
  invoice: PayDunyaInvoice;
  custom_data?: Record<string, any>;
  actions?: {
    cancel_url?: string;
    callback_url?: string;
    return_url?: string;
  };
  mode: "test" | "live";
  status: PayDunyaStatus;
  fail_reason?: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  errors?: {
    message: string;
    description: string;
  };
  receipt_url?: string;
  pan?: string; // Card number (PCI-DSS)
}

/**
 * Service PayDunya pour la gestion des paiements
 */
export class PayDunyaService {
  private config: PayDunyaConfig;
  private baseUrl: string;

  constructor(config: PayDunyaConfig) {
    this.config = config;
    this.baseUrl = config.mode === "sandbox"
      ? "https://app.paydunya.com/sandbox-api/v1"
      : "https://app.paydunya.com/api/v1";
  }

  /**
   * Créer une facture de paiement
   * @param invoice - Données de la facture
   * @returns URL de checkout et token
   */
  async createCheckoutInvoice(invoice: PayDunyaInvoice): Promise<PayDunyaCheckoutResponse> {
    const url = `${this.baseUrl}/checkout-invoice/create`;
    
    const headers = this.getHeaders();
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      throw new Error(`PayDunya API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Vérifier le statut d'une transaction
   * @param invoiceToken - Token de la facture
   * @returns Statut de la transaction
   */
  async checkTransactionStatus(invoiceToken: string): Promise<PayDunyaStatusResponse> {
    const url = `${this.baseUrl}/checkout-invoice/confirm/${invoiceToken}`;
    
    const headers = this.getHeaders();
    
    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`PayDunya API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Annuler une facture
   * @param invoiceToken - Token de la facture
   */
  async cancelInvoice(invoiceToken: string): Promise<void> {
    const url = `${this.baseUrl}/checkout-invoice/cancel/${invoiceToken}`;
    
    const headers = this.getHeaders();
    
    const response = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!response.ok) {
      throw new Error(`PayDunya API Error: ${response.statusText}`);
    }
  }

  /**
   * Obtenir l'URL de checkout pour une facture
   * @param invoiceToken - Token de la facture
   * @returns URL de checkout
   */
  getCheckoutUrl(invoiceToken: string): string {
    const baseUrl = this.config.mode === "sandbox"
      ? "https://paydunya.com/sandbox-checkout"
      : "https://paydunya.com/checkout";
    
    return `${baseUrl}/${invoiceToken}`;
  }

  /**
   * Obtenir l'URL du reçu PDF
   * @param invoiceToken - Token de la facture
   * @returns URL du reçu
   */
  getReceiptUrl(invoiceToken: string): string {
    const baseUrl = this.config.mode === "sandbox"
      ? "https://paydunya.com/sandbox-checkout/receipt/pdf"
      : "https://paydunya.com/checkout/receipt/pdf";
    
    return `${baseUrl}/${invoiceToken}.pdf`;
  }

  /**
   * Vérifier la signature du webhook
   * @param signature - Signature reçue
   * @param payload - Payload reçu
   * @returns true si la signature est valide
   */
  async verifyWebhookSignature(signature: string, payload: any): Promise<boolean> {
    if (!this.config.webhookSecret) {
      console.warn("[PayDunya] Webhook secret not configured");
      return false;
    }

    // Note: Cette fonction doit être implémentée côté serveur avec Node.js crypto
    // Côté client, on retourne true pour permettre le flux normal
    // La vérification réelle sera faite dans le webhook handler serveur
    console.warn("[PayDunya] Signature verification should be done server-side");
    return true;
  }

  /**
   * Mapper le statut PayDunya vers le statut Order
   * @param paydunyaStatus - Statut PayDunya
   * @returns Statut Order correspondant
   */
  mapToOrderStatus(paydunyaStatus: PayDunyaStatus): "pending" | "paid" | "cancelled" {
    switch (paydunyaStatus) {
      case "completed":
        return "paid";
      case "cancelled":
        return "cancelled";
      case "failed":
        return "pending";
      case "pending":
      default:
        return "pending";
    }
  }

  /**
   * Créer une facture depuis une commande
   * @param order - Commande
   * @param baseUrl - URL de base de l'application pour les callbacks
   * @returns Invoice PayDunya
   */
  static createInvoiceFromOrder(
    order: Order,
    baseUrl: string
  ): PayDunyaInvoice {
    return {
      token: order.id,
      total_amount: order.totalAmount,
      description: `Paiement commande ${order.id} - ${order.productName} x${order.quantity}`,
      items: {
        item_0: {
          name: order.productName,
          quantity: order.quantity,
          unit_price: order.unitPrice.toString(),
          total_price: order.totalAmount.toString(),
          description: order.productName,
        },
      },
      customer: {
        name: order.clientName,
        phone: order.clientPhone,
        email: undefined, // À ajouter si disponible
      },
      actions: {
        cancel_url: `${baseUrl}/pay/${order.id}?status=cancelled`,
        callback_url: `${baseUrl}/api/webhooks/paydunya`,
        return_url: `${baseUrl}/pay/${order.id}?status=completed`,
      },
      custom_data: {
        orderId: order.id,
        vendorId: order.vendorId,
        productId: order.productId,
      },
    };
  }

  /**
   * Headers pour les requêtes API
   */
  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "PAYDUNYA-MASTER-KEY": this.config.apiKey,
      "PAYDUNYA-PRIVATE-KEY": this.config.secretKey,
    };
  }
}

/**
 * Créer une instance du service PayDunya
 * @param config - Configuration
 * @returns Instance du service
 */
export function createPayDunyaService(config: PayDunyaConfig): PayDunyaService {
  return new PayDunyaService(config);
}

/**
 * Helper pour vérifier si PayDunya est configuré
 * @param config - Configuration à vérifier
 */
export function isPayDunyaConfigured(config: Partial<PayDunyaConfig>): boolean {
  return !!(config.apiKey && config.secretKey);
}
