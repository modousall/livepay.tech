/**
 * SuperAdmin Demo/Test Mode
 * Permet au superadmin de tester toutes les fonctionnalités sans créer de profils
 */

import { Timestamp, collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { VendorConfig, VendorSegment } from "@shared/types";

// Données de démo par secteur
const DEMO_DATA_BY_SECTOR = {
  banking_microfinance: {
    products: [
      { name: "Compte Épargne", price: 0, keyword: "COMPTE", description: "Ouvrir un compte épargne" },
      { name: "Crédit Personnel", price: 0, keyword: "CREDIT", description: "Demande de crédit" },
      { name: "Transfert d'argent", price: 500, keyword: "VIREMENT", description: "Frais de virement" },
    ],
    config: {
      welcomeMessage: "Bienvenue dans votre banque. Envoyez COMPTE, CREDIT ou VIREMENT.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 50,
      segment: "services" as VendorSegment,
    },
  },
  insurance: {
    products: [
      { name: "Assurance Auto", price: 50000, keyword: "AUTO", description: "Assurance véhicule" },
      { name: "Assurance Habitation", price: 30000, keyword: "HABITATION", description: "Assurance logement" },
      { name: "Assurance Santé", price: 25000, keyword: "SANTE", description: "Couverture médicale" },
    ],
    config: {
      welcomeMessage: "Bienvenue chez votre assureur. Envoyez POLICE, SINISTRE ou COTISATION.",
      reservationDurationMinutes: 45,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 60,
      segment: "services" as VendorSegment,
    },
  },
  telecom: {
    products: [
      { name: "Forfait 1GB", price: 1000, keyword: "1GB", description: "1GB Internet 30 jours" },
      { name: "Forfait 5GB", price: 4000, keyword: "5GB", description: "5GB Internet 30 jours" },
      { name: "Forfait 10GB", price: 7000, keyword: "10GB", description: "10GB Internet 30 jours" },
    ],
    config: {
      welcomeMessage: "Bienvenue chez votre opérateur. Envoyez FORFAIT, CONSO ou RECHARGE.",
      reservationDurationMinutes: 15,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 30,
      segment: "services" as VendorSegment,
    },
  },
  education: {
    products: [
      { name: "Inscription Formation", price: 50000, keyword: "INSCRIPTION", description: "Formation professionnelle" },
      { name: "Certification", price: 15000, keyword: "CERTIF", description: "Obtenir certification" },
      { name: "Remise à niveau", price: 20000, keyword: "REMISE", description: "Cours de remise à niveau" },
    ],
    config: {
      welcomeMessage: "Bienvenue. Envoyez INSCRIPTION, CERTIF ou EMPLOI DU TEMPS.",
      reservationDurationMinutes: 45,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 40,
      segment: "services" as VendorSegment,
    },
  },
  healthcare_private: {
    products: [
      { name: "Consultation Générale", price: 10000, keyword: "CONSULT", description: "Médecin généraliste" },
      { name: "Consultation Spécialiste", price: 20000, keyword: "SPECIALISTE", description: "Médecin spécialiste" },
      { name: "Bilan de Santé", price: 35000, keyword: "BILAN", description: "Bilan complet" },
    ],
    config: {
      welcomeMessage: "Bienvenue au cabinet. Envoyez RDV, CONSULT ou URGENCE.",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 70,
      segment: "services" as VendorSegment,
    },
  },
  agriculture: {
    products: [
      { name: "Conseil Cultural", price: 5000, keyword: "CONSEIL", description: "Conseil agricole" },
      { name: "Semences Améliorées", price: 15000, keyword: "SEMENCES", description: "Semences certifiées" },
      { name: "Traitement Phytosanitaire", price: 25000, keyword: "TRAITEMENT", description: "Produits phytosanitaires" },
    ],
    config: {
      welcomeMessage: "Bienvenue. Envoyez CONSEIL, SEMENCES ou METEO.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 40,
      segment: "services" as VendorSegment,
    },
  },
  public_services: {
    products: [
      { name: "Carte d'Identité", price: 5000, keyword: "CARTE", description: "Demande de CNI" },
      { name: "Passeport", price: 25000, keyword: "PASSEPORT", description: "Demande de passeport" },
      { name: "Acte de Naissance", price: 2000, keyword: "ACTE", description: "Demande d'acte" },
    ],
    config: {
      welcomeMessage: "Bienvenue. Envoyez CARTE, PASSEPORT ou ACTE.",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 50,
      segment: "services" as VendorSegment,
    },
  },
  real_estate: {
    products: [
      { name: "Location T2", price: 150000, keyword: "T2", description: "Appartement 2 pièces" },
      { name: "Location T3", price: 250000, keyword: "T3", description: "Appartement 3 pièces" },
      { name: "Vente Terrain", price: 5000000, keyword: "TERRAIN", description: "Terrain 500m²" },
    ],
    config: {
      welcomeMessage: "Bienvenue. Envoyez LOUER, ACHETER ou ESTIMATION.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: true,
      minTrustScoreRequired: 60,
      segment: "services" as VendorSegment,
    },
  },
  legal_notary: {
    products: [
      { name: "Consultation Juridique", price: 15000, keyword: "CONSULT", description: "Conseil juridique" },
      { name: "Rédaction Contrat", price: 50000, keyword: "CONTRAT", description: "Rédaction acte" },
      { name: "Succession", price: 100000, keyword: "SUCCESSION", description: "Gestion succession" },
    ],
    config: {
      welcomeMessage: "Bienveau. Envoyez CONSULT, CONTRAT ou SUCCESSION.",
      reservationDurationMinutes: 60,
      requireDeliveryAddress: false,
      minTrustScoreRequired: 80,
      segment: "services" as VendorSegment,
    },
  },
  shop: {
    products: [
      { name: "Produit Démo 1", price: 5000, keyword: "PROD1", description: "Produit de démonstration" },
      { name: "Produit Démo 2", price: 10000, keyword: "PROD2", description: "Autre produit démo" },
      { name: "Produit Démo 3", price: 15000, keyword: "PROD3", description: "3ème produit démo" },
    ],
    config: {
      welcomeMessage: "Bienvenue dans notre boutique !",
      reservationDurationMinutes: 30,
      requireDeliveryAddress: true,
      minTrustScoreRequired: 0,
      segment: "shop" as VendorSegment,
    },
  },
};

/**
 * Créer une entité de démo pour un secteur donné
 */
export async function createDemoEntity(
  sector: string,
  superAdminId: string
): Promise<{ vendorId: string; configId: string }> {
  const now = Timestamp.now();
  const demoPrefix = `demo_${sector}`;
  
  // Créer le vendor config
  const sectorData = DEMO_DATA_BY_SECTOR[sector as keyof typeof DEMO_DATA_BY_SECTOR] || DEMO_DATA_BY_SECTOR.shop;
  
  const configData: Omit<VendorConfig, "id" | "createdAt" | "updatedAt"> = {
    vendorId: "", // Sera défini après création
    businessName: `Démo ${sector.replace(/_/g, ' ').toUpperCase()}`,
    preferredPaymentMethod: "wave",
    mobileMoneyNumber: "+221000000000",
    status: "active",
    liveMode: false,
    reservationDurationMinutes: sectorData.config.reservationDurationMinutes,
    autoReplyEnabled: true,
    welcomeMessage: sectorData.config.welcomeMessage,
    segment: sector as any,
    allowQuantitySelection: true,
    requireDeliveryAddress: sectorData.config.requireDeliveryAddress,
    autoReminderEnabled: true,
    upsellEnabled: false,
    minTrustScoreRequired: sectorData.config.minTrustScoreRequired,
    messageTemplates: undefined,
  };

  // Créer d'abord le vendor config sans vendorId
  const configRef = await addDoc(collection(db, "vendor_configs"), {
    ...configData,
    createdAt: now,
    updatedAt: now,
  });

  // Utiliser le configId comme vendorId pour simplifier
  const vendorId = configRef.id;
  
  // Mettre à jour avec le vendorId
  await updateDoc(configRef, { vendorId });

  // Créer les produits de démo
  const productsPromises = sectorData.products.map(async (product) => {
    const shareCode = `${demoPrefix}_${product.keyword}`.toUpperCase();
    await addDoc(collection(db, "products"), {
      vendorId,
      keyword: product.keyword,
      shareCode,
      name: product.name,
      price: product.price,
      description: product.description,
      stock: 100,
      reservedStock: 0,
      active: true,
      featured: false,
      createdAt: now,
    });
  });

  await Promise.all(productsPromises);

  return { vendorId, configId: configRef.id };
}

/**
 * Obtenir toutes les entités de démo d'un superadmin
 */
export async function getDemoEntities(superAdminId: string) {
  const q = query(
    collection(db, "vendor_configs"),
    where("businessName", ">=", "Démo"),
    where("businessName", "<=", "Démo\uf8ff")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Supprimer une entité de démo
 */
export async function deleteDemoEntity(vendorId: string) {
  // Supprimer les produits
  const productsQuery = query(
    collection(db, "products"),
    where("vendorId", "==", vendorId)
  );
  
  const productsSnapshot = await getDocs(productsQuery);
  const deletePromises = productsSnapshot.docs.map(doc => 
    updateDoc(doc.ref, { active: false })
  );
  
  await Promise.all(deletePromises);
  
  // Désactiver le config
  const configQuery = query(
    collection(db, "vendor_configs"),
    where("vendorId", "==", vendorId)
  );
  
  const configSnapshot = await getDocs(configQuery);
  const configDeletePromises = configSnapshot.docs.map(doc =>
    updateDoc(doc.ref, { status: "inactive" })
  );
  
  await Promise.all(configDeletePromises);
}

/**
 * Initialiser toutes les entités de démo pour un superadmin
 */
export async function initializeAllDemoEntities(superAdminId: string) {
  const sectors = Object.keys(DEMO_DATA_BY_SECTOR);
  const results = [];
  
  for (const sector of sectors) {
    try {
      const result = await createDemoEntity(sector, superAdminId);
      results.push({ sector, success: true, ...result });
    } catch (error) {
      results.push({ sector, success: false, error: (error as any).message });
    }
  }
  
  return results;
}
