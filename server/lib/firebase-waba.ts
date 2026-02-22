/**
 * Firebase WABA Integration
 *
 * Gère la persistance des WABA Instances en Firestore
 * Utilisé par WABAManager pour les requêtes Firestore
 */

import * as admin from 'firebase-admin';
import { Timestamp } from "firebase-admin/firestore";
import { WABAInstance } from "../../shared/types";
import { logger } from "../logger";

const WABA_INSTANCES_COLLECTION = "waba_instances";
const VENDOR_CONFIGS_COLLECTION = "vendor_configs";

/**
 * Créer une nouvelle instance WABA
 */
export async function createWABAInstance(
  wabaInstance: Omit<WABAInstance, "id" | "createdAt" | "updatedAt">
): Promise<WABAInstance> {
  try {
    const now = new Date();
    const db = admin.firestore();
    const docRef = db.collection(WABA_INSTANCES_COLLECTION).doc();

    const fullInstance: WABAInstance = {
      id: docRef.id,
      ...wabaInstance,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set({
      ...fullInstance,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    logger.info("[WABA Firebase] Instance created", {
      id: fullInstance.id,
      vendorId: wabaInstance.vendorId,
      phoneNumber: wabaInstance.phoneNumber,
    });

    return fullInstance;
  } catch (error) {
    logger.error("[WABA Firebase] Error creating instance", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Trouver une WABA instance par numéro de téléphone
 */
export async function findWABAByPhoneNumber(
  phoneNumber: string
): Promise<WABAInstance | null> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection(WABA_INSTANCES_COLLECTION)
      .where("phoneNumber", "==", phoneNumber)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    } as WABAInstance;
  } catch (error) {
    logger.error("[WABA Firebase] Error finding by phone", {
      phoneNumber,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Trouver une WABA instance par Wasender Instance ID
 */
export async function findWABAByWasenderInstanceId(
  wasenderInstanceId: string
): Promise<WABAInstance | null> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection(WABA_INSTANCES_COLLECTION)
      .where("wasenderInstanceId", "==", wasenderInstanceId)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    } as WABAInstance;
  } catch (error) {
    logger.error("[WABA Firebase] Error finding by Wasender ID", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Obtenir toutes les instances WABA d'un vendor
 */
export async function getVendorWABAInstances(
  vendorId: string
): Promise<WABAInstance[]> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection(WABA_INSTANCES_COLLECTION)
      .where("vendorId", "==", vendorId)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: new Date(doc.data().createdAt),
      updatedAt: new Date(doc.data().updatedAt),
    } as WABAInstance));
  } catch (error) {
    logger.error("[WABA Firebase] Error getting vendor instances", {
      vendorId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return [];
  }
}

/**
 * Mettre à jour une instance WABA
 */
export async function updateWABAInstance(
  id: string,
  updates: Partial<WABAInstance>
): Promise<void> {
  try {
    const db = admin.firestore();
    const docRef = db.collection(WABA_INSTANCES_COLLECTION).doc(id);

    await docRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    logger.info("[WABA Firebase] Instance updated", {
      id,
      fields: Object.keys(updates),
    });
  } catch (error) {
    logger.error("[WABA Firebase] Error updating instance", {
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Obtenir une instance WABA par ID
 */
export async function getWABAInstance(id: string): Promise<WABAInstance | null> {
  try {
    const db = admin.firestore();
    const docRef = db.collection(WABA_INSTANCES_COLLECTION).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return {
      id: snapshot.id,
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as WABAInstance;
  } catch (error) {
    logger.error("[WABA Firebase] Error getting instance", {
      id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Obtenir le vendor config pour une instance WABA
 */
export async function getVendorConfigByWABA(
  wabaInstanceId: string
): Promise<any | null> {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection(VENDOR_CONFIGS_COLLECTION)
      .where("wabaInstanceId", "==", wabaInstanceId)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };
  } catch (error) {
    logger.error("[WABA Firebase] Error getting vendor config", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}
