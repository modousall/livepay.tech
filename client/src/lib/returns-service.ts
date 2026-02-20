/**
 * Returns & Refunds Service
 * Gère les retours produits et les remboursements
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { ReturnStatus, RefundStatus, OrderReturn } from "@shared/types";
import { logOrderAudit } from "./audit-service";

export interface ReturnRequest {
  orderId: string;
  reason: string;
  notes?: string;
}

/**
 * Demander un retour pour une commande
 */
export async function requestReturn(
  orderId: string,
  clientPhone: string,
  reason: string,
  notes?: string
): Promise<string> {
  try {
    // Vérifier que la commande existe et est payée
    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Commande introuvable");
    }

    const orderData = orderSnap.data();

    if (orderData.status !== "paid") {
      throw new Error("Seules les commandes payées peuvent être retournées");
    }

    // Créer la demande de retour
    const returnData: Omit<OrderReturn, "id" | "createdAt"> = {
      orderId,
      vendorId: orderData.vendorId,
      clientPhone,
      reason,
      status: "requested",
      requestedAt: new Date(),
      refundAmount: orderData.totalAmount,
      notes: notes || "",
    };

    const returnRef = await addDoc(collection(db, "order_returns"), {
      ...returnData,
      requestedAt: Timestamp.fromDate(returnData.requestedAt),
      createdAt: Timestamp.now(),
    });

    // Mettre à jour la commande
    await updateDoc(orderRef, {
      returnId: returnRef.id,
      returnStatus: "requested",
      updatedAt: Timestamp.now(),
    });

    // Logger l'audit
    await logOrderAudit({
      orderId,
      vendorId: orderData.vendorId,
      action: "status_changed",
      previousStatus: orderData.status,
      newStatus: orderData.status, // Status reste "paid"
      changedBy: "system",
      metadata: {
        returnRequested: true,
        reason,
      },
    });

    return returnRef.id;
  } catch (error) {
    console.error("[RETURNS] Failed to request return:", error);
    throw error;
  }
}

/**
 * Approuver un retour
 */
export async function approveReturn(
  returnId: string,
  vendorId: string
): Promise<void> {
  try {
    const returnRef = doc(db, "order_returns", returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      throw new Error("Demande de retour introuvable");
    }

    const returnData = returnSnap.data();

    if (returnData.status !== "requested") {
      throw new Error(`Statut de retour invalide: ${returnData.status}`);
    }

    // Approuver le retour
    await updateDoc(returnRef, {
      status: "approved",
      approvedAt: Timestamp.now(),
    });

    // Mettre à jour la commande
    const orderRef = doc(db, "orders", returnData.orderId);
    await updateDoc(orderRef, {
      returnStatus: "approved",
      updatedAt: Timestamp.now(),
    });

    // Logger l'audit
    await logOrderAudit({
      orderId: returnData.orderId,
      vendorId,
      action: "status_changed",
      previousStatus: "paid",
      newStatus: "paid",
      changedBy: "vendor",
      metadata: {
        returnApproved: true,
        returnId,
      },
    });
  } catch (error) {
    console.error("[RETURNS] Failed to approve return:", error);
    throw error;
  }
}

/**
 * Rejeter un retour
 */
export async function rejectReturn(
  returnId: string,
  vendorId: string,
  reason: string
): Promise<void> {
  try {
    const returnRef = doc(db, "order_returns", returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      throw new Error("Demande de retour introuvable");
    }

    const returnData = returnSnap.data();

    // Rejeter le retour
    await updateDoc(returnRef, {
      status: "rejected",
      notes: (returnData.notes || "") + `\nRejeté: ${reason}`,
    });

    // Mettre à jour la commande
    const orderRef = doc(db, "orders", returnData.orderId);
    await updateDoc(orderRef, {
      returnStatus: "rejected",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("[RETURNS] Failed to reject return:", error);
    throw error;
  }
}

/**
 * Marquer le retour comme reçu
 */
export async function markReturnAsReceived(returnId: string): Promise<void> {
  try {
    const returnRef = doc(db, "order_returns", returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      throw new Error("Demande de retour introuvable");
    }

    const returnData = returnSnap.data();

    if (returnData.status !== "approved") {
      throw new Error("Le retour doit être approuvé avant d'être marqué comme reçu");
    }

    // Marquer comme reçu
    await updateDoc(returnRef, {
      status: "received",
      receivedAt: Timestamp.now(),
    });

    // Mettre à jour la commande
    const orderRef = doc(db, "orders", returnData.orderId);
    await updateDoc(orderRef, {
      returnStatus: "received",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("[RETURNS] Failed to mark return as received:", error);
    throw error;
  }
}

/**
 * Traiter le remboursement
 */
export async function processRefund(
  returnId: string,
  refundMethod: "original" | "manual" = "original"
): Promise<void> {
  try {
    const returnRef = doc(db, "order_returns", returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      throw new Error("Demande de retour introuvable");
    }

    const returnData = returnSnap.data();

    if (returnData.status !== "received") {
      throw new Error("Le produit doit être reçu avant le remboursement");
    }

    // TODO: Intégrer avec l'API de paiement pour le remboursement réel
    // Pour l'instant, on marque juste le statut

    await updateDoc(returnRef, {
      refundStatus: "success",
      status: "refunded",
    });

    // Mettre à jour la commande
    const orderRef = doc(db, "orders", returnData.orderId);
    await updateDoc(orderRef, {
      returnStatus: "refunded",
      refundStatus: "success",
      updatedAt: Timestamp.now(),
    });

    // Logger l'audit
    await logOrderAudit({
      orderId: returnData.orderId,
      vendorId: returnData.vendorId,
      action: "status_changed",
      previousStatus: "paid",
      newStatus: undefined,
      changedBy: "system",
      metadata: {
        refunded: true,
        refundAmount: returnData.refundAmount,
        refundMethod,
      },
    });
  } catch (error) {
    console.error("[RETURNS] Failed to process refund:", error);
    throw error;
  }
}

/**
 * Obtenir les retours pour un vendor
 */
export async function getVendorReturns(vendorId: string): Promise<OrderReturn[]> {
  try {
    const q = query(
      collection(db, "order_returns"),
      where("vendorId", "==", vendorId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        orderId: data.orderId,
        vendorId: data.vendorId,
        clientPhone: data.clientPhone,
        reason: data.reason,
        status: data.status,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        approvedAt: data.approvedAt?.toDate(),
        receivedAt: data.receivedAt?.toDate(),
        refundStatus: data.refundStatus,
        refundAmount: data.refundAmount,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as OrderReturn;
    });
  } catch (error) {
    console.error("[RETURNS] Failed to get vendor returns:", error);
    return [];
  }
}

/**
 * Obtenir un retour spécifique
 */
export async function getOrderReturn(returnId: string): Promise<OrderReturn | null> {
  try {
    const returnRef = doc(db, "order_returns", returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      return null;
    }

    const data = returnSnap.data();
    return {
      id: returnSnap.id,
      orderId: data.orderId,
      vendorId: data.vendorId,
      clientPhone: data.clientPhone,
      reason: data.reason,
      status: data.status,
      requestedAt: data.requestedAt?.toDate() || new Date(),
      approvedAt: data.approvedAt?.toDate(),
      receivedAt: data.receivedAt?.toDate(),
      refundStatus: data.refundStatus,
      refundAmount: data.refundAmount,
      notes: data.notes,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as OrderReturn;
  } catch (error) {
    console.error("[RETURNS] Failed to get return:", error);
    return null;
  }
}

/**
 * Obtenir les retours par statut
 */
export async function getReturnsByStatus(
  vendorId: string,
  status: ReturnStatus
): Promise<OrderReturn[]> {
  try {
    const q = query(
      collection(db, "order_returns"),
      where("vendorId", "==", vendorId),
      where("status", "==", status)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        orderId: data.orderId,
        vendorId: data.vendorId,
        clientPhone: data.clientPhone,
        reason: data.reason,
        status: data.status,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        approvedAt: data.approvedAt?.toDate(),
        receivedAt: data.receivedAt?.toDate(),
        refundStatus: data.refundStatus,
        refundAmount: data.refundAmount,
        notes: data.notes,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as OrderReturn;
    });
  } catch (error) {
    console.error("[RETURNS] Failed to get returns by status:", error);
    return [];
  }
}
