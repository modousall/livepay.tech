/**
 * Correctifs pour les erreurs de chargement et personnalisation
 *
 * Problèmes corrigés:
 * 1. Erreur "Impossible de charger les données" - getVendorConfig retourne null
 * 2. Personnalisation des interfaces par secteur métier
 * 3. Gestion des configurations manquantes
 */

import { Timestamp, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { VendorConfig, VendorSegment } from "@shared/types";
import { getVendorConfig } from "./firebase";

/**
 * Vérifie et crée une configuration vendor si elle n'existe pas
 * C'est la fonction principale à appeler pour initialiser un vendor
 */
export async function ensureVendorConfigExists(vendorId: string, userEmail?: string): Promise<VendorConfig> {
  try {
    // 1. Vérifier si la config existe
    const q = query(
      collection(db, "vendor_configs"),
      where("vendorId", "==", vendorId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Config existe déjà
      const docData = snapshot.docs[0];
      const data = docData.data();
      return {
        ...data,
        id: docData.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as VendorConfig;
    }

    // 2. Config n'existe pas - la créer
    console.log("[FIX] Creating vendor config for:", vendorId);
    
    const defaultConfig: Omit<VendorConfig, "id" | "createdAt" | "updatedAt"> = {
      vendorId,
      businessName: userEmail?.split('@')[0] || "Ma Boutique",
      preferredPaymentMethod: "wave",
      mobileMoneyNumber: "",
      status: "active",
      liveMode: false,
      reservationDurationMinutes: 30,
      autoReplyEnabled: true,
      welcomeMessage: "Bienvenue chez " + (userEmail?.split('@')[0] || "notre boutique"),
      segment: "shop" as VendorSegment, // Secteur par défaut
      allowQuantitySelection: true,
      requireDeliveryAddress: false,
      autoReminderEnabled: true,
      upsellEnabled: false,
      minTrustScoreRequired: 0,
      messageTemplates: undefined,
    };

    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, "vendor_configs"), {
      ...defaultConfig,
      createdAt: now,
      updatedAt: now,
    });

    const newConfig: VendorConfig = {
      ...defaultConfig,
      id: docRef.id,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };

    console.log("[FIX] Vendor config created:", newConfig);
    return newConfig;
  } catch (error) {
    console.error("[FIX] Error ensuring vendor config:", error);
    throw error;
  }
}

/**
 * Wrapper sécurisé pour getVendorConfig qui crée la config si elle n'existe pas
 * À utiliser à la place de getVendorConfig() dans le dashboard
 */
export async function getOrCreateVendorConfig(vendorId: string, userEmail?: string): Promise<VendorConfig> {
  try {
    const existingConfig = await getVendorConfig(vendorId);
    if (existingConfig) {
      // Ensure segment is properly typed as VendorSegment
      return {
        ...existingConfig,
        segment: existingConfig.segment as VendorSegment,
      };
    }

    // Config n'existe pas, la créer
    return await ensureVendorConfigExists(vendorId, userEmail);
  } catch (error) {
    console.error("[FIX] Error in getOrCreateVendorConfig:", error);
    throw error;
  }
}

/**
 * Personnaliser la configuration selon le secteur métier
 * Applique les paramètres recommandés pour chaque secteur
 */
export function getSectorDefaults(segment: string): Partial<VendorConfig> {
  const defaults: Record<string, Partial<VendorConfig>> = {
    // Banque / Microfinance
    banking_microfinance: {
      welcomeMessage: "Bienvenue dans votre espace bancaire. Envoyez COMPTE, CREDIT ou RECLAMATION.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      minTrustScoreRequired: 50,
      segment: "services" as VendorSegment,
    },

    // Assurance
    insurance: {
      welcomeMessage: "Bienvenue chez votre assureur. Envoyez POLICE, SINISTRE ou COTISATION.",
      reservationDurationMinutes: 45,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      minTrustScoreRequired: 60,
      segment: "services" as VendorSegment,
    },

    // Télécom
    telecom: {
      welcomeMessage: "Bienvenue chez votre opérateur. Envoyez FORFAIT, FACTURE ou ASSISTANCE.",
      reservationDurationMinutes: 15,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      minTrustScoreRequired: 30,
      segment: "services" as VendorSegment,
    },

    // Utilities (Énergie/Eau)
    utilities: {
      welcomeMessage: "Bienvenue. Envoyez FACTURE, PANNE ou RELEVÉ.",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: true,
      autoReplyEnabled: true,
      minTrustScoreRequired: 40,
      segment: "services" as VendorSegment,
    },

    // Santé
    healthcare_private: {
      welcomeMessage: "Bienvenue au cabinet. Envoyez RDV, CONSULTATION ou URGENCE.",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      minTrustScoreRequired: 70,
      segment: "services" as VendorSegment,
    },

    // Transport
    transport: {
      welcomeMessage: "Bienvenue. Envoyez RÉSERVATION, HORAIRE ou BAGAGE.",
      reservationDurationMinutes: 20,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      segment: "services" as VendorSegment,
    },

    // Location
    rental: {
      welcomeMessage: "Bienvenue. Envoyez LOCATION, DISPONIBILITÉ ou TARIF.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: true,
      autoReplyEnabled: true,
      segment: "services" as VendorSegment,
    },

    // Éducation
    education: {
      welcomeMessage: "Bienvenue. Envoyez INSCRIPTION, FORMATION ou EMPLOI DU TEMPS.",
      reservationDurationMinutes: 45,
      requireDeliveryAddress: false,
      autoReplyEnabled: true,
      segment: "services" as VendorSegment,
    },

    // Shop (défaut)
    shop: {
      welcomeMessage: "Bienvenue dans notre boutique !",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: true,
      autoReplyEnabled: true,
      minTrustScoreRequired: 0,
      segment: "shop" as VendorSegment,
    },
  };

  return defaults[segment] || defaults.shop;
}

/**
 * Mettre à jour la configuration avec les paramètres du secteur
 */
export async function applySectorDefaults(vendorId: string, segment: string): Promise<void> {
  try {
    const config = await getVendorConfig(vendorId);
    if (!config) {
      console.warn("[FIX] Cannot apply sector defaults - config not found");
      return;
    }

    const sectorDefaults = getSectorDefaults(segment);
    
    // Fusionner avec la config existante
    const updatedConfig = {
      ...config,
      ...sectorDefaults,
      segment: segment as any,
      updatedAt: new Date(),
    };

    const configRef = doc(db, "vendor_configs", config.id);
    await setDoc(configRef, {
      ...updatedConfig,
      createdAt: Timestamp.fromDate(updatedConfig.createdAt),
      updatedAt: Timestamp.fromDate(updatedConfig.updatedAt),
    }, { merge: true });

    console.log("[FIX] Applied sector defaults for:", segment);
  } catch (error) {
    console.error("[FIX] Error applying sector defaults:", error);
  }
}

/**
 * Helper pour obtenir les modules activés selon le secteur
 */
export function getEnabledModulesForSegment(segment: string): string[] {
  const modules: Record<string, string[]> = {
    banking_microfinance: ["appointments", "queue_management", "products"],
    insurance: ["interventions", "appointments", "products"],
    telecom: ["interventions", "queue_management", "products", "orders"],
    utilities: ["interventions", "queue_management", "products"],
    healthcare_private: ["appointments", "products"],
    transport: ["queue_management", "ticketing", "products"],
    rental: ["products", "orders", "appointments"],
    education: ["appointments", "products", "ticketing"],
    shop: ["products", "orders"],
    events: ["ticketing", "products"],
    appointments: ["appointments"],
    queue_management: ["queue_management"],
    field_services: ["interventions", "appointments"],
    // NOUVEAUX secteurs Afrique
    agriculture: ["products", "appointments"],
    public_services: ["appointments", "queue"],
    real_estate: ["products", "orders"],
    legal_notary: ["appointments"],
  };

  return modules[segment] || modules.shop;
}

// Ré-exporter les fonctions originales
export { getVendorConfig, updateVendorConfig, createVendorConfig } from "./firebase";
