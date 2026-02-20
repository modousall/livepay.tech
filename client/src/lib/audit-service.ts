/**
 * Audit Logging Service
 * Tracks all order-related actions for compliance and debugging
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import { OrderStatus, OrderAuditLog } from "@shared/types";

export type AuditAction =
  | "created"
  | "status_changed"
  | "payment_received"
  | "cancelled"
  | "expired";

export type AuditActor = "system" | "webhook" | "vendor" | "admin";

export interface AuditLogInput {
  orderId: string;
  vendorId: string;
  action: AuditAction;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  changedBy: AuditActor;
  metadata?: Record<string, any>;
}

/**
 * Log an order audit event
 */
export async function logOrderAudit(input: AuditLogInput): Promise<string> {
  try {
    const auditData: Omit<OrderAuditLog, "id" | "createdAt"> = {
      orderId: input.orderId,
      vendorId: input.vendorId,
      action: input.action,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
      changedBy: input.changedBy,
      metadata: input.metadata || {},
    };

    const docRef = await addDoc(
      collection(db, "order_audit_logs"),
      {
        ...auditData,
        createdAt: Timestamp.now(),
      }
    );

    console.log("[AUDIT] Logged:", {
      action: input.action,
      orderId: input.orderId,
      previousStatus: input.previousStatus,
      newStatus: input.newStatus,
    });

    return docRef.id;
  } catch (error) {
    console.error("[AUDIT] Failed to log:", error);
    throw error;
  }
}

/**
 * Log order creation
 */
export async function logOrderCreation(
  orderId: string,
  vendorId: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logOrderAudit({
    orderId,
    vendorId,
    action: "created",
    changedBy: "system",
    metadata,
  });
}

/**
 * Log order status change
 */
export async function logOrderStatusChange(
  orderId: string,
  vendorId: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus,
  changedBy: AuditActor = "system",
  metadata?: Record<string, any>
): Promise<void> {
  await logOrderAudit({
    orderId,
    vendorId,
    action: "status_changed",
    previousStatus,
    newStatus,
    changedBy,
    metadata,
  });
}

/**
 * Log payment received
 */
export async function logPaymentReceived(
  orderId: string,
  vendorId: string,
  previousStatus: OrderStatus,
  metadata?: Record<string, any>
): Promise<void> {
  await logOrderAudit({
    orderId,
    vendorId,
    action: "payment_received",
    previousStatus,
    newStatus: "paid",
    changedBy: "webhook",
    metadata: {
      ...metadata,
      paymentConfirmedAt: new Date().toISOString(),
    },
  });
}

/**
 * Log order cancellation
 */
export async function logOrderCancellation(
  orderId: string,
  vendorId: string,
  previousStatus: OrderStatus,
  reason?: string,
  cancelledBy: AuditActor = "vendor"
): Promise<void> {
  await logOrderAudit({
    orderId,
    vendorId,
    action: "cancelled",
    previousStatus,
    newStatus: "cancelled",
    changedBy: cancelledBy,
    metadata: {
      reason,
      cancelledAt: new Date().toISOString(),
    },
  });
}

/**
 * Log order expiration
 */
export async function logOrderExpiration(
  orderId: string,
  vendorId: string,
  previousStatus: OrderStatus
): Promise<void> {
  await logOrderAudit({
    orderId,
    vendorId,
    action: "expired",
    previousStatus,
    newStatus: "expired",
    changedBy: "system",
    metadata: {
      expiredAt: new Date().toISOString(),
    },
  });
}

/**
 * Get audit logs for an order
 */
export async function getOrderAuditLogs(
  orderId: string,
  limit: number = 50
): Promise<OrderAuditLog[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("orderId", "==", orderId),
      orderBy("createdAt", "desc"),
    ];

    if (limit > 0) {
      constraints.push(limit as any);
    }

    const q = query(collection(db, "order_audit_logs"), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId,
        vendorId: data.vendorId,
        action: data.action as AuditAction,
        previousStatus: data.previousStatus as OrderStatus,
        newStatus: data.newStatus as OrderStatus,
        changedBy: data.changedBy as AuditActor,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as OrderAuditLog;
    });
  } catch (error) {
    console.error("[AUDIT] Failed to fetch logs:", error);
    return [];
  }
}

/**
 * Get audit logs for a vendor within a date range
 */
export async function getVendorAuditLogs(
  vendorId: string,
  startDate?: Date,
  endDate?: Date,
  actionFilter?: AuditAction
): Promise<OrderAuditLog[]> {
  try {
    const constraints: QueryConstraint[] = [
      where("vendorId", "==", vendorId),
      orderBy("createdAt", "desc"),
    ];

    const q = query(collection(db, "order_audit_logs"), ...constraints);
    const snapshot = await getDocs(q);

    let logs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId,
        vendorId: data.vendorId,
        action: data.action as AuditAction,
        previousStatus: data.previousStatus as OrderStatus,
        newStatus: data.newStatus as OrderStatus,
        changedBy: data.changedBy as AuditActor,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as OrderAuditLog;
    });

    // Filter by date range
    if (startDate) {
      logs = logs.filter((log) => log.createdAt >= startDate);
    }

    if (endDate) {
      logs = logs.filter((log) => log.createdAt <= endDate);
    }

    // Filter by action type
    if (actionFilter) {
      logs = logs.filter((log) => log.action === actionFilter);
    }

    return logs;
  } catch (error) {
    console.error("[AUDIT] Failed to fetch vendor logs:", error);
    return [];
  }
}

/**
 * Get recent payment events for monitoring
 */
export async function getRecentPaymentEvents(
  vendorId: string,
  minutes: number = 60
): Promise<OrderAuditLog[]> {
  const now = new Date();
  const startTime = new Date(now.getTime() - minutes * 60 * 1000);

  return getVendorAuditLogs(vendorId, startTime, now, "payment_received");
}

/**
 * Helper to track suspicious activity
 */
export interface SuspiciousActivity {
  type: "duplicate_payment" | "rapid_orders" | "amount_anomaly" | "status_manipulation";
  orderId: string;
  vendorId: string;
  details: string;
  severity: "low" | "medium" | "high";
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(activity: SuspiciousActivity): Promise<void> {
  try {
    await addDoc(collection(db, "suspicious_activity_logs"), {
      ...activity,
      detectedAt: Timestamp.now(),
    });

    console.warn("[SECURITY] Suspicious activity detected:", activity);
  } catch (error) {
    console.error("[SECURITY] Failed to log suspicious activity:", error);
  }
}
