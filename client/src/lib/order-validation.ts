/**
 * Order Validation Service
 * Validates orders before payment processing
 */

import { Order, OrderStatus } from "@shared/types";
import { getProduct, getOrders } from "@/lib/firebase";

export class OrderValidationError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "OrderValidationError";
  }
}

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate an order before payment processing
 */
export async function validateOrderForPayment(order: Order): Promise<OrderValidationResult> {
  const errors: string[] = [];

  // 1. Vérifier l'existence
  if (!order || !order.id) {
    errors.push("Commande inexistante");
  }

  // 2. Vérifier le statut
  if (order.status !== "pending" && order.status !== "reserved") {
    errors.push(`Commande ne peut pas être payée (statut: ${order.status})`);
  }

  // 3. Vérifier l'expiration
  if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
    errors.push("Lien de paiement expiré");
  }

  // 4. Vérifier les montants
  if (order.totalAmount <= 0) {
    errors.push("Montant invalide");
  }

  if (order.quantity <= 0) {
    errors.push("Quantité invalide");
  }

  // 5. Vérifier que le total correspond au calcul
  const expectedTotal = order.quantity * order.unitPrice;
  if (Math.abs(order.totalAmount - expectedTotal) > 0.01) {
    errors.push(`Incohérence du montant total (attendu: ${expectedTotal}, obtenu: ${order.totalAmount})`);
  }

  // 6. Vérifier le téléphone client
  const phoneRegex = /^\d{10,15}$/;
  const cleanedPhone = order.clientPhone.replace(/\D/g, "");
  if (!order.clientPhone || !phoneRegex.test(cleanedPhone)) {
    errors.push("Numéro client invalide");
  }

  // 7. Vérifier le stock (si le produit existe)
  try {
    const product = await getProduct(order.productId);
    if (product) {
      const availableStock = product.stock - (product.reservedStock || 0);
      if (order.quantity > availableStock) {
        errors.push("Stock insuffisant pour cette commande");
      }
    }
  } catch (error) {
    // Product check failed, but continue with other validations
    console.warn("Could not verify product stock:", error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for duplicate payments (same client, same product, within 30 seconds)
 */
export async function checkForDuplicatePayment(order: Order): Promise<boolean> {
  try {
    const orders = await getOrders(order.vendorId);
    const thirtySecondsAgo = new Date(Date.now() - 30000);

    const recentPayments = orders.filter((o) => {
      if (o.status !== "paid") return false;
      if (o.clientPhone !== order.clientPhone) return false;
      if (o.productId !== order.productId) return false;
      if (!o.createdAt) return false;

      return new Date(o.createdAt) >= thirtySecondsAgo;
    });

    return recentPayments.length > 0;
  } catch (error) {
    console.error("Error checking for duplicate payments:", error);
    return false;
  }
}

/**
 * Validate order creation (before creating a new order)
 */
export async function validateOrderCreation(orderData: {
  vendorId: string;
  productId: string;
  clientPhone: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}): Promise<OrderValidationResult> {
  const errors: string[] = [];

  // 1. Vérifier les champs requis
  if (!orderData.vendorId) {
    errors.push("vendorId manquant");
  }

  if (!orderData.productId) {
    errors.push("productId manquant");
  }

  if (!orderData.clientPhone) {
    errors.push("clientPhone manquant");
  }

  // 2. Vérifier le téléphone
  const phoneRegex = /^\d{10,15}$/;
  const cleanedPhone = orderData.clientPhone.replace(/\D/g, "");
  if (!phoneRegex.test(cleanedPhone)) {
    errors.push("Numéro de téléphone invalide");
  }

  // 3. Vérifier les quantités
  if (orderData.quantity <= 0) {
    errors.push("Quantité invalide");
  }

  // 4. Vérifier les prix
  if (orderData.unitPrice <= 0) {
    errors.push("Prix unitaire invalide");
  }

  if (orderData.totalAmount <= 0) {
    errors.push("Montant total invalide");
  }

  // 5. Vérifier la cohérence du montant
  const expectedTotal = orderData.quantity * orderData.unitPrice;
  if (Math.abs(orderData.totalAmount - expectedTotal) > 0.01) {
    errors.push(`Incohérence du montant total (attendu: ${expectedTotal}, obtenu: ${orderData.totalAmount})`);
  }

  // 6. Vérifier le stock
  try {
    const product = await getProduct(orderData.productId);
    if (product) {
      if (!product.active) {
        errors.push("Produit non disponible");
      }
      const availableStock = product.stock - (product.reservedStock || 0);
      if (orderData.quantity > availableStock) {
        errors.push("Stock insuffisant");
      }
    } else {
      errors.push("Produit introuvable");
    }
  } catch (error) {
    console.warn("Could not verify product:", error);
    errors.push("Erreur lors de la vérification du produit");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Helper function to check if order is expired
 */
export function isOrderExpired(order: Order): boolean {
  if (!order.expiresAt) return false;
  return new Date() > new Date(order.expiresAt);
}

/**
 * Helper function to check if order can be modified
 */
export function canModifyOrder(order: Order): boolean {
  return (
    (order.status === "pending" || order.status === "reserved") &&
    !isOrderExpired(order)
  );
}
