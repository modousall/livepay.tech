import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKl0W7XqgBCtBiWXp8bANDhwv_lnVR2GU",
  authDomain: "live-pay-97ac6.firebaseapp.com",
  projectId: "live-pay-97ac6",
  storageBucket: "live-pay-97ac6.firebasestorage.app",
  messagingSenderId: "393340248714",
  appId: "1:393340248714:web:e801d2d986b6ae87f84373",
  measurementId: "G-WMC0H3D2KD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);

// User types
export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  role: "vendor" | "admin" | "superadmin";
  entityId?: string;
  entityRole?: "owner" | "admin" | "agent";
  profileImageUrl?: string;
  isActive?: boolean;
  suspended?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Super admin emails (configure these)
const SUPER_ADMIN_EMAILS = [
  "contact@livepay.tech",
  "ms@coinhub.africa",
];

export function isSuperAdmin(email: string): boolean {
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

// Auth functions
export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  let profile = await getUserProfile(user.uid);
  
  // Determine role - check if super admin
  const determinedRole = isSuperAdmin(email) ? "superadmin" : "vendor";

  // If profile doesn't exist in Firestore, create it (migration from Auth only)
  if (!profile) {
    if (!isSuperAdmin(email)) {
      await signOut(auth);
      throw new Error("Compte non autorise. Contactez le super administrateur.");
    }
    console.log("Creating missing super admin profile in Firestore...");
    const displayName = user.displayName || email.split('@')[0];
    const nameParts = displayName.split(' ');

    // Super admin does NOT need an entity or phone
    profile = {
      id: user.uid,
      email: user.email || email.toLowerCase(),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      role: determinedRole,
      entityId: undefined, // Super admin has NO entity
      entityRole: undefined, // Super admin has NO entity role
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), {
      ...profile,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(profile.updatedAt),
    });
  } else if (isSuperAdmin(email)) {
    const needsRoleFix = profile.role !== "superadmin";
    const needsCleanup = !!(profile.entityId || profile.entityRole || profile.phone);
    if (needsRoleFix || needsCleanup) {
      // Ensure super admin has no entity, role, or phone attached
      profile.role = "superadmin";
      profile.entityId = undefined;
      profile.entityRole = undefined;
      profile.phone = undefined;
      await updateDoc(doc(db, "users", user.uid), {
        role: "superadmin",
        entityId: null,
        entityRole: null,
        phone: null,
      });
    }
  }

  return {
    ...profile,
    // Super admin does NOT have an entity
    entityId: isSuperAdmin(profile.email) ? undefined : (profile.entityId || profile.id),
  };
}

export async function registerWithEmail(
  email: string, 
  password: string, 
  data: {
    firstName?: string;
    lastName?: string;
    businessName?: string;
    phone?: string;
    businessType?: string;
    segment?: string;
    entityId?: string;
  }
): Promise<UserProfile> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update display name
  const displayName = data.firstName && data.lastName 
    ? `${data.firstName} ${data.lastName}` 
    : data.businessName || email.split('@')[0];
  await updateProfile(user, { displayName });
  
  // Create user profile in Firestore
  const entityId = data.entityId || user.uid;
  const entityRole: UserProfile["entityRole"] = data.entityId ? "agent" : "owner";
  const profile: UserProfile = {
    id: user.uid,
    email: email.toLowerCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    businessName: data.businessName,
    businessType: data.businessType,
    phone: data.phone,
    role: "vendor",
    entityId,
    entityRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setDoc(doc(db, "users", user.uid), {
    ...profile,
    createdAt: Timestamp.fromDate(profile.createdAt),
    updatedAt: Timestamp.fromDate(profile.updatedAt),
  });

  const now = Timestamp.now();
  if (!data.entityId) {
    await setDoc(doc(db, "entities", entityId), {
      name: data.businessName || displayName || "Entite LivePay",
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now,
    });

    // Create default vendor config so super-admin sees new entity as active immediately
    await addDoc(collection(db, "vendor_configs"), {
      vendorId: entityId,
      businessName: data.businessName || displayName || "Ma Boutique",
      preferredPaymentMethod: "wave",
      status: "active",
      liveMode: false,
      uiMode: "expert", // Expert mode par défaut
      expertModeEnabled: true, // Activé par défaut
      reservationDurationMinutes: 10,
      autoReplyEnabled: true,
      segment: data.segment || "shop",
      allowQuantitySelection: true,
      requireDeliveryAddress: false,
      autoReminderEnabled: true,
      upsellEnabled: false,
      minTrustScoreRequired: 0,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  return {
    ...profile,
    entityId,
  };
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, "users", uid));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
  const updateData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  delete (updateData as any).id;
  delete (updateData as any).createdAt;
  
  await updateDoc(doc(db, "users", uid), updateData);
  const profile = await getUserProfile(uid);
  if (!profile) throw new Error("Erreur mise à jour profil");
  return profile;
}

export function getActiveEntityId(profile: UserProfile | null): string | null {
  if (!profile) return null;
  return profile.entityId || profile.id;
}

export async function getEntityMembers(entityId: string): Promise<UserProfile[]> {
  const members: UserProfile[] = [];
  const seen = new Set<string>();

  const ownerProfile = await getUserProfile(entityId);
  if (ownerProfile) {
    members.push({ ...ownerProfile, entityId: ownerProfile.entityId || ownerProfile.id });
    seen.add(ownerProfile.id);
  }

  const q = query(collection(db, "users"), where("entityId", "==", entityId));
  const snapshot = await getDocs(q);
  snapshot.forEach((docSnap) => {
    if (seen.has(docSnap.id)) return;
    const data = docSnap.data();
    members.push({
      ...data,
      id: docSnap.id,
      entityId: data.entityId || docSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile);
    seen.add(docSnap.id);
  });

  return members.sort((a, b) => (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0));
}


// Subscribe to auth state
export function subscribeToAuth(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        let profile = await getUserProfile(firebaseUser.uid);

        // If profile doesn't exist in Firestore, create it
        if (!profile) {
          const email = firebaseUser.email || "";
          if (!isSuperAdmin(email)) {
            console.warn("Missing profile for non-super-admin user; session blocked.");
            await signOut(auth);
            callback(null);
            return;
          }

          console.log("Creating missing super admin profile in Firestore (auth state)...");
          profile = {
            id: firebaseUser.uid,
            email,
            firstName: firebaseUser.displayName?.split(' ')[0],
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
            role: "superadmin",
            entityId: undefined, // Super admin has NO entity
            entityRole: undefined, // Super admin has NO entity role
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await setDoc(doc(db, "users", firebaseUser.uid), {
            ...profile,
            createdAt: Timestamp.fromDate(profile.createdAt),
            updatedAt: Timestamp.fromDate(profile.updatedAt),
          });
        } else if (isSuperAdmin(firebaseUser.email || "")) {
          const needsCleanup = !!(profile.entityId || profile.entityRole || profile.phone);
          if (needsCleanup) {
            console.log("Fixing super admin profile - removing entity association and phone...");
            profile.entityId = undefined;
            profile.entityRole = undefined;
            profile.phone = undefined;
            await updateDoc(doc(db, "users", firebaseUser.uid), {
              entityId: null,
              entityRole: null,
              phone: null,
            });
          }
        }

        callback(profile);
      } catch (error) {
        console.error("Error getting user profile:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// ========== VENDOR CONFIG ==========
export interface VendorConfig {
  id: string;
  vendorId: string;
  businessName: string;
  mobileMoneyNumber?: string;
  preferredPaymentMethod: string;
  // Wave Payment
  waveMerchantId?: string;
  // Google Maps Position
  googleMapsPosition?: string;
  // Meta WhatsApp API
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  whatsappVerifyToken?: string;
  // Wasender API
  wasenderAccessToken?: string;
  wasenderWebhookSecret?: string;
  wasenderApiUrl?: string;
  // Common settings
  status: "active" | "inactive" | "suspended";
  liveMode: boolean;
  uiMode?: "simplified" | "expert";
  expertModeEnabled?: boolean;
  contextualOnboardingCompletedAt?: Date;
  reservationDurationMinutes: number;
  autoReplyEnabled: boolean;
  welcomeMessage?: string;
  segment: string;
  allowQuantitySelection: boolean;
  requireDeliveryAddress: boolean;
  autoReminderEnabled: boolean;
  upsellEnabled: boolean;
  minTrustScoreRequired: number;
  messageTemplates?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getVendorConfig(vendorId: string): Promise<VendorConfig | null> {
  const q = query(collection(db, "vendor_configs"), where("vendorId", "==", vendorId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docData = snap.docs[0];
  const data = docData.data();
  const patch: Record<string, any> = {};
  if (!data.segment) patch.segment = "shop";
  if (!data.uiMode) patch.uiMode = "expert"; // Expert mode par défaut
  if (data.expertModeEnabled === undefined) patch.expertModeEnabled = true; // Activé par défaut
  if (Object.keys(patch).length > 0) {
    await updateDoc(docData.ref, {
      ...patch,
      updatedAt: Timestamp.now(),
    });
  }
  return {
    ...data,
    ...patch,
    id: docData.id,
    contextualOnboardingCompletedAt: data.contextualOnboardingCompletedAt?.toDate?.(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as VendorConfig;
}

export async function createVendorConfig(config: Omit<VendorConfig, "id" | "createdAt" | "updatedAt">): Promise<VendorConfig> {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, "vendor_configs"), {
    ...config,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...config,
    id: docRef.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateVendorConfig(configId: string, data: Partial<VendorConfig>): Promise<void> {
  const updateData = { ...data, updatedAt: Timestamp.now() };
  delete (updateData as any).id;
  delete (updateData as any).createdAt;
  await updateDoc(doc(db, "vendor_configs", configId), updateData);
}

// ========== PRODUCTS ==========
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

function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getProducts(vendorId: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"), 
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    ...d.data(),
    id: d.id,
    createdAt: d.data().createdAt?.toDate() || new Date(),
  })) as Product[];
}

export async function getProduct(productId: string): Promise<Product | null> {
  const docRef = doc(db, "products", productId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return {
    ...snap.data(),
    id: snap.id,
    createdAt: snap.data().createdAt?.toDate() || new Date(),
  } as Product;
}

export async function getProductByShareCode(code: string): Promise<Product | null> {
  const normalizedCode = code.trim();
  const q = query(collection(db, "products"), where("shareCode", "==", normalizedCode), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return {
      ...d.data(),
      id: d.id,
      createdAt: d.data().createdAt?.toDate() || new Date(),
    } as Product;
  }

  // Fallback: allow opening by direct document ID (legacy links)
  const byId = await getDoc(doc(db, "products", normalizedCode));
  if (!byId.exists()) return null;
  return {
    ...byId.data(),
    id: byId.id,
    createdAt: byId.data().createdAt?.toDate() || new Date(),
  } as Product;
}

export async function getPublicProductsByVendor(vendorId: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({
      ...d.data(),
      id: d.id,
      createdAt: d.data().createdAt?.toDate() || new Date(),
    }) as Product)
    .filter((p) => p.active !== false);
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "shareCode" | "reservedStock">): Promise<Product> {
  const shareCode = generateShareCode();
  const docRef = await addDoc(collection(db, "products"), {
    ...data,
    shareCode,
    reservedStock: 0,
    createdAt: Timestamp.now(),
  });
  return {
    ...data,
    id: docRef.id,
    shareCode,
    reservedStock: 0,
    createdAt: new Date(),
  };
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  const updateData = { ...data };
  delete (updateData as any).id;
  delete (updateData as any).createdAt;
  await updateDoc(doc(db, "products", productId), updateData);
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, "products", productId));
}

// ========== ORDERS ==========
// Import unified types from shared/types.ts
import { Order, OrderStatus, PaymentMethod, InsertOrder } from "@shared/types";

export type { Order, OrderStatus, PaymentMethod, InsertOrder };

export async function getOrders(vendorId: string): Promise<Order[]> {
  const q = query(
    collection(db, "orders"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      reservedAt: data.reservedAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      paidAt: data.paidAt?.toDate(),
    } as Order;
  }) as Order[];
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
  // Vérifier s'il existe déjà une commande similaire (idempotence)
  const existingOrders = await getOrders(data.vendorId);
  const similarOrder = existingOrders.find(order => 
    order.productId === data.productId &&
    order.clientPhone === data.clientPhone &&
    order.status === "pending" &&
    // Même produit, même client, créé dans les 30 dernières secondes
    order.createdAt && 
    (new Date().getTime() - order.createdAt.getTime()) < 30000
  );

  if (similarOrder) {
    console.log("[ORDER] Similar order already exists:", similarOrder.id);
    return similarOrder;
  }

  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, "orders"), {
    ...data,
    reservedAt: data.reservedAt ? Timestamp.fromDate(data.reservedAt) : null,
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
    paidAt: data.paidAt ? Timestamp.fromDate(data.paidAt) : null,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: docRef.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  } as Order;
}

export async function updateOrder(orderId: string, data: Partial<Order>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.reservedAt) updateData.reservedAt = Timestamp.fromDate(data.reservedAt);
  if (data.expiresAt) updateData.expiresAt = Timestamp.fromDate(data.expiresAt);
  if (data.paidAt) updateData.paidAt = Timestamp.fromDate(data.paidAt);
  await updateDoc(doc(db, "orders", orderId), updateData);
}

// ========== LIVE SESSIONS ==========
export interface LiveSession {
  id: string;
  vendorId: string;
  title: string;
  platform: string;
  active: boolean;
  createdAt: Date;
  endedAt?: Date;
}

export async function getLiveSessions(vendorId: string): Promise<LiveSession[]> {
  const q = query(
    collection(db, "liveSessions"), 
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      endedAt: data.endedAt?.toDate(),
    };
  }) as LiveSession[];
}

export async function createLiveSession(data: Omit<LiveSession, "id" | "createdAt" | "active">): Promise<LiveSession> {
  const docRef = await addDoc(collection(db, "liveSessions"), {
    ...data,
    active: true,
    createdAt: Timestamp.now(),
  });
  return {
    ...data,
    id: docRef.id,
    active: true,
    createdAt: new Date(),
  };
}

export async function updateLiveSession(sessionId: string, data: Partial<LiveSession>): Promise<void> {
  const updateData: any = { ...data };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.endedAt) updateData.endedAt = Timestamp.fromDate(data.endedAt);
  await updateDoc(doc(db, "liveSessions", sessionId), updateData);
}

// ========== INVOICES ==========
export type InvoiceStatus = "pending" | "paid" | "expired" | "cancelled";

export interface Invoice {
  id: string;
  vendorId: string;
  productId?: string;
  clientPhone: string;
  amount: number;
  description?: string;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
}

export async function getInvoices(vendorId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, "invoices"), 
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      dueDate: data.dueDate?.toDate(),
      paidAt: data.paidAt?.toDate(),
    };
  }) as Invoice[];
}

export async function createInvoice(data: Omit<Invoice, "id" | "createdAt">): Promise<Invoice> {
  const docRef = await addDoc(collection(db, "invoices"), {
    ...data,
    dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
    paidAt: data.paidAt ? Timestamp.fromDate(data.paidAt) : null,
    createdAt: Timestamp.now(),
  });
  return {
    ...data,
    id: docRef.id,
    createdAt: new Date(),
  };
}

export async function updateInvoice(invoiceId: string, data: Partial<Invoice>): Promise<void> {
  const updateData: any = { ...data };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.dueDate) updateData.dueDate = Timestamp.fromDate(data.dueDate);
  if (data.paidAt) updateData.paidAt = Timestamp.fromDate(data.paidAt);
  await updateDoc(doc(db, "invoices", invoiceId), updateData);
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const docRef = doc(db, "invoices", invoiceId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    dueDate: data.dueDate?.toDate(),
    paidAt: data.paidAt?.toDate(),
  } as Invoice;
}

export async function getOrderByToken(token: string): Promise<Order | null> {
  // Token can be the order ID directly
  const docRef = doc(db, "orders", token);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    reservedAt: data.reservedAt?.toDate(),
    expiresAt: data.expiresAt?.toDate(),
    paidAt: data.paidAt?.toDate(),
  } as Order;
}

export async function getOrderByReceiptToken(receiptToken: string): Promise<Order | null> {
  const q = query(
    collection(db, "orders"),
    where("receiptToken", "==", receiptToken),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const orderDoc = snap.docs[0];
  const data = orderDoc.data();
  return {
    ...data,
    id: orderDoc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    reservedAt: data.reservedAt?.toDate(),
    expiresAt: data.expiresAt?.toDate(),
    paidAt: data.paidAt?.toDate(),
  } as Order;
}

// ========== FILE UPLOAD ==========
export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

// ========== REAL-TIME LISTENERS ==========

/**
 * Subscribe to real-time order updates
 * Returns an unsubscribe function
 */
export function subscribeToOrders(
  vendorId: string, 
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ordersRef = collection(db, "orders");
  const q = query(
    ordersRef,
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  
  return onSnapshot(q, 
    (snapshot) => {
      const orders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reservedAt: data.reservedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
          paidAt: data.paidAt?.toDate(),
        } as Order;
      });
      callback(orders);
    },
    (error) => {
      console.error("Orders subscription error:", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to real-time product updates
 */
export function subscribeToProducts(
  vendorId: string,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): () => void {
  const productsRef = collection(db, "products");
  const q = query(
    productsRef,
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q,
    (snapshot) => {
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as unknown as Product;
      });
      callback(products);
    },
    (error) => {
      console.error("Products subscription error:", error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to new orders only (for notifications)
 */
export function subscribeToNewOrders(
  vendorId: string,
  callback: (order: Order) => void
): () => void {
  const ordersRef = collection(db, "orders");
  const q = query(
    ordersRef,
    where("vendorId", "==", vendorId),
    where("createdAt", ">", Timestamp.now()),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const data = change.doc.data();
        const order = {
          ...data,
          id: change.doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Order;
        callback(order);
      }
    });
  });
}

// ========== OPERATIONAL MODULES ==========

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
export interface Appointment {
  id: string;
  vendorId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAppointments(vendorId: string): Promise<Appointment[]> {
  const q = query(
    collection(db, "appointments"),
    where("vendorId", "==", vendorId),
    orderBy("scheduledAt", "asc"),
    limit(300)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      scheduledAt: data.scheduledAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Appointment;
  });
}

export async function createAppointment(
  data: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<Appointment> {
  const now = Timestamp.now();
  const refDoc = await addDoc(collection(db, "appointments"), {
    ...data,
    scheduledAt: Timestamp.fromDate(data.scheduledAt),
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: refDoc.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateAppointment(appointmentId: string, data: Partial<Appointment>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.scheduledAt) updateData.scheduledAt = Timestamp.fromDate(data.scheduledAt);
  await updateDoc(doc(db, "appointments", appointmentId), updateData);
}

export type QueueTicketStatus = "waiting" | "called" | "serving" | "completed" | "cancelled" | "missed";
export interface QueueTicket {
  id: string;
  vendorId: string;
  queueNumber: number;
  customerName: string;
  customerPhone: string;
  servicePoint: string;
  priority: "normal" | "high" | "vip";
  status: QueueTicketStatus;
  calledAt?: Date;
  servedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function getQueueTickets(vendorId: string): Promise<QueueTicket[]> {
  const q = query(
    collection(db, "queueTickets"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(400)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      calledAt: data.calledAt?.toDate(),
      servedAt: data.servedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as QueueTicket;
  });
}

export async function createQueueTicket(
  data: Omit<QueueTicket, "id" | "createdAt" | "updatedAt" | "calledAt" | "servedAt">
): Promise<QueueTicket> {
  const now = Timestamp.now();
  const refDoc = await addDoc(collection(db, "queueTickets"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: refDoc.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateQueueTicket(ticketId: string, data: Partial<QueueTicket>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.calledAt) updateData.calledAt = Timestamp.fromDate(data.calledAt);
  if (data.servedAt) updateData.servedAt = Timestamp.fromDate(data.servedAt);
  await updateDoc(doc(db, "queueTickets", ticketId), updateData);
}

export type EventTicketStatus = "issued" | "paid" | "checked_in" | "cancelled" | "refunded";
export interface EventTicket {
  id: string;
  vendorId: string;
  eventName: string;
  eventCode: string;
  customerName: string;
  customerPhone: string;
  seatLabel?: string;
  ticketCode: string;
  amount: number;
  status: EventTicketStatus;
  eventDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export async function getEventTickets(vendorId: string): Promise<EventTicket[]> {
  const q = query(
    collection(db, "eventTickets"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(400)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      eventDate: data.eventDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as EventTicket;
  });
}

export async function createEventTicket(
  data: Omit<EventTicket, "id" | "createdAt" | "updatedAt">
): Promise<EventTicket> {
  const now = Timestamp.now();
  const refDoc = await addDoc(collection(db, "eventTickets"), {
    ...data,
    eventDate: data.eventDate ? Timestamp.fromDate(data.eventDate) : null,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: refDoc.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateEventTicket(ticketId: string, data: Partial<EventTicket>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.eventDate) updateData.eventDate = Timestamp.fromDate(data.eventDate);
  await updateDoc(doc(db, "eventTickets", ticketId), updateData);
}

export type ServiceInterventionStatus = "new" | "assigned" | "in_progress" | "resolved" | "closed";
export interface ServiceIntervention {
  id: string;
  vendorId: string;
  title: string;
  customerName: string;
  customerPhone: string;
  location?: string;
  priority: "low" | "normal" | "high" | "critical";
  assignedTo?: string;
  status: ServiceInterventionStatus;
  openedAt: Date;
  closedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getServiceInterventions(vendorId: string): Promise<ServiceIntervention[]> {
  const q = query(
    collection(db, "serviceInterventions"),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc"),
    limit(400)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      openedAt: data.openedAt?.toDate() || new Date(),
      closedAt: data.closedAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ServiceIntervention;
  });
}

export async function createServiceIntervention(
  data: Omit<ServiceIntervention, "id" | "createdAt" | "updatedAt">
): Promise<ServiceIntervention> {
  const now = Timestamp.now();
  const refDoc = await addDoc(collection(db, "serviceInterventions"), {
    ...data,
    openedAt: Timestamp.fromDate(data.openedAt),
    closedAt: data.closedAt ? Timestamp.fromDate(data.closedAt) : null,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: refDoc.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateServiceIntervention(
  interventionId: string,
  data: Partial<ServiceIntervention>
): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.openedAt) updateData.openedAt = Timestamp.fromDate(data.openedAt);
  if (data.closedAt) updateData.closedAt = Timestamp.fromDate(data.closedAt);
  await updateDoc(doc(db, "serviceInterventions", interventionId), updateData);
}

// ========== CRM CORE ==========

export type CrmPriority = "low" | "normal" | "high" | "critical";
export type CrmTicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed" | "escalated";
export type CrmModule =
  | "appointments"
  | "queue_management"
  | "ticketing"
  | "interventions"
  | "banking_microfinance"
  | "insurance"
  | "telecom"
  | "utilities"
  | "queue";

export interface CrmAgent {
  id: string;
  vendorId: string;
  name: string;
  phone?: string;
  email?: string;
  skills?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmSlaPolicy {
  id: string;
  vendorId: string;
  module: CrmModule;
  targetMinutesLow: number;
  targetMinutesNormal: number;
  targetMinutesHigh: number;
  targetMinutesCritical: number;
  escalationMinutes: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmTicket {
  id: string;
  vendorId: string;
  module: CrmModule;
  sourceRefId?: string;
  title: string;
  customerName?: string;
  customerPhone?: string;
  priority: CrmPriority;
  status: CrmTicketStatus;
  assignedAgentId?: string;
  slaDueAt?: Date;
  escalationDueAt?: Date;
  escalated: boolean;
  escalationLevel: number;
  notes?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmTicketHistory {
  id: string;
  vendorId: string;
  ticketId: string;
  action: "created" | "status_changed" | "assigned" | "escalated" | "comment";
  actor: string;
  fromStatus?: CrmTicketStatus;
  toStatus?: CrmTicketStatus;
  comment?: string;
  createdAt: Date;
}

function getDefaultSlaMinutes(priority: CrmPriority): number {
  switch (priority) {
    case "low":
      return 24 * 60;
    case "normal":
      return 8 * 60;
    case "high":
      return 2 * 60;
    case "critical":
      return 30;
    default:
      return 8 * 60;
  }
}

async function getSlaPolicyForModule(vendorId: string, module: CrmModule): Promise<CrmSlaPolicy | null> {
  const q = query(
    collection(db, "crmSlaPolicies"),
    where("vendorId", "==", vendorId),
    where("module", "==", module),
    where("active", "==", true),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    ...data,
    id: d.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as CrmSlaPolicy;
}

function computeSlaDates(priority: CrmPriority, policy: CrmSlaPolicy | null): { slaDueAt: Date; escalationDueAt: Date } {
  const now = new Date();
  const targetMinutes = policy
    ? priority === "low"
      ? policy.targetMinutesLow
      : priority === "normal"
        ? policy.targetMinutesNormal
        : priority === "high"
          ? policy.targetMinutesHigh
          : policy.targetMinutesCritical
    : getDefaultSlaMinutes(priority);
  const escalationMinutes = policy?.escalationMinutes || 30;
  return {
    slaDueAt: new Date(now.getTime() + targetMinutes * 60 * 1000),
    escalationDueAt: new Date(now.getTime() + (targetMinutes + escalationMinutes) * 60 * 1000),
  };
}

export async function getCrmAgents(vendorId: string): Promise<CrmAgent[]> {
  const q = query(
    collection(db, "crmAgents"),
    where("vendorId", "==", vendorId),
    orderBy("name", "asc"),
    limit(300)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CrmAgent;
  });
}

export async function createCrmAgent(data: Omit<CrmAgent, "id" | "createdAt" | "updatedAt">): Promise<CrmAgent> {
  const now = Timestamp.now();
  const refDoc = await addDoc(collection(db, "crmAgents"), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return {
    ...data,
    id: refDoc.id,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function updateCrmAgent(agentId: string, data: Partial<CrmAgent>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  await updateDoc(doc(db, "crmAgents", agentId), updateData);
}

export async function getCrmSlaPolicies(vendorId: string): Promise<CrmSlaPolicy[]> {
  const q = query(
    collection(db, "crmSlaPolicies"),
    where("vendorId", "==", vendorId),
    orderBy("module", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CrmSlaPolicy;
  });
}

export async function upsertCrmSlaPolicy(vendorId: string, module: CrmModule, data: Partial<CrmSlaPolicy>): Promise<void> {
  const q = query(
    collection(db, "crmSlaPolicies"),
    where("vendorId", "==", vendorId),
    where("module", "==", module),
    limit(1)
  );
  const snap = await getDocs(q);
  const now = Timestamp.now();
  const base = {
    vendorId,
    module,
    targetMinutesLow: data.targetMinutesLow ?? 24 * 60,
    targetMinutesNormal: data.targetMinutesNormal ?? 8 * 60,
    targetMinutesHigh: data.targetMinutesHigh ?? 2 * 60,
    targetMinutesCritical: data.targetMinutesCritical ?? 30,
    escalationMinutes: data.escalationMinutes ?? 30,
    active: data.active ?? true,
    updatedAt: now,
  };
  if (snap.empty) {
    await addDoc(collection(db, "crmSlaPolicies"), {
      ...base,
      createdAt: now,
    });
  } else {
    await updateDoc(snap.docs[0].ref, base as any);
  }
}

export async function addCrmTicketHistory(
  vendorId: string,
  ticketId: string,
  action: CrmTicketHistory["action"],
  actor: string,
  extra?: Partial<Omit<CrmTicketHistory, "id" | "vendorId" | "ticketId" | "action" | "actor" | "createdAt">>
): Promise<void> {
  await addDoc(collection(db, "crmTicketHistory"), {
    vendorId,
    ticketId,
    action,
    actor,
    ...extra,
    createdAt: Timestamp.now(),
  });
}

export async function createCrmTicket(
  data: Omit<CrmTicket, "id" | "createdAt" | "updatedAt" | "slaDueAt" | "escalationDueAt" | "escalated" | "escalationLevel">
): Promise<CrmTicket> {
  const now = Timestamp.now();
  const policy = await getSlaPolicyForModule(data.vendorId, data.module);
  const dates = computeSlaDates(data.priority, policy);
  const refDoc = await addDoc(collection(db, "crmTickets"), {
    ...data,
    slaDueAt: Timestamp.fromDate(dates.slaDueAt),
    escalationDueAt: Timestamp.fromDate(dates.escalationDueAt),
    escalated: false,
    escalationLevel: 0,
    createdAt: now,
    updatedAt: now,
  });
  await addCrmTicketHistory(data.vendorId, refDoc.id, "created", "system");
  return {
    ...data,
    id: refDoc.id,
    slaDueAt: dates.slaDueAt,
    escalationDueAt: dates.escalationDueAt,
    escalated: false,
    escalationLevel: 0,
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
  };
}

export async function getCrmTickets(
  vendorId: string,
  filters?: { module?: CrmModule; status?: CrmTicketStatus }
): Promise<CrmTicket[]> {
  const constraints: any[] = [where("vendorId", "==", vendorId)];
  if (filters?.module) constraints.push(where("module", "==", filters.module));
  if (filters?.status) constraints.push(where("status", "==", filters.status));
  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(600));
  const q = query(collection(db, "crmTickets"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      slaDueAt: data.slaDueAt?.toDate(),
      escalationDueAt: data.escalationDueAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CrmTicket;
  });
}

export async function getCrmTicketBySource(
  vendorId: string,
  module: CrmModule,
  sourceRefId: string
): Promise<CrmTicket | null> {
  const q = query(
    collection(db, "crmTickets"),
    where("vendorId", "==", vendorId),
    where("module", "==", module),
    where("sourceRefId", "==", sourceRefId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    ...data,
    id: d.id,
    slaDueAt: data.slaDueAt?.toDate(),
    escalationDueAt: data.escalationDueAt?.toDate(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as CrmTicket;
}

export async function updateCrmTicket(ticketId: string, data: Partial<CrmTicket>): Promise<void> {
  const updateData: any = { ...data, updatedAt: Timestamp.now() };
  delete updateData.id;
  delete updateData.createdAt;
  if (data.slaDueAt) updateData.slaDueAt = Timestamp.fromDate(data.slaDueAt);
  if (data.escalationDueAt) updateData.escalationDueAt = Timestamp.fromDate(data.escalationDueAt);
  await updateDoc(doc(db, "crmTickets", ticketId), updateData);
}

export async function assignCrmTicket(ticketId: string, vendorId: string, agentId: string, actor: string): Promise<void> {
  await updateCrmTicket(ticketId, { assignedAgentId: agentId, status: "in_progress" });
  await addCrmTicketHistory(vendorId, ticketId, "assigned", actor, { comment: `assigned:${agentId}` });
}

export async function updateCrmTicketStatus(
  ticketId: string,
  vendorId: string,
  fromStatus: CrmTicketStatus,
  toStatus: CrmTicketStatus,
  actor: string,
  comment?: string
): Promise<void> {
  await updateCrmTicket(ticketId, { status: toStatus });
  await addCrmTicketHistory(vendorId, ticketId, "status_changed", actor, { fromStatus, toStatus, comment });
}

export async function getCrmTicketHistory(vendorId: string, ticketId: string): Promise<CrmTicketHistory[]> {
  const q = query(
    collection(db, "crmTicketHistory"),
    where("vendorId", "==", vendorId),
    where("ticketId", "==", ticketId),
    orderBy("createdAt", "asc"),
    limit(500)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate() || new Date(),
    } as CrmTicketHistory;
  });
}

export async function runCrmAutoEscalation(vendorId: string, actor = "system"): Promise<number> {
  const q = query(
    collection(db, "crmTickets"),
    where("vendorId", "==", vendorId),
    where("status", "in", ["open", "in_progress", "waiting_customer"]),
    limit(500)
  );
  const snap = await getDocs(q);
  const now = new Date();
  let escalatedCount = 0;
  const batch = writeBatch(db);

  snap.docs.forEach((d) => {
    const data = d.data();
    const escalationDue = data.escalationDueAt?.toDate?.() || null;
    const status = data.status as CrmTicketStatus;
    if (escalationDue && escalationDue <= now && status !== "escalated") {
      batch.update(d.ref, {
        status: "escalated",
        escalated: true,
        escalationLevel: (data.escalationLevel || 0) + 1,
        updatedAt: Timestamp.now(),
      });
      escalatedCount += 1;
    }
  });

  if (escalatedCount > 0) {
    await batch.commit();
    const refreshed = await getCrmTickets(vendorId, { status: "escalated" });
    await Promise.all(
      refreshed.slice(0, escalatedCount).map((ticket) =>
        addCrmTicketHistory(vendorId, ticket.id, "escalated", actor, { comment: "auto_escalation" })
      )
    );
  }

  return escalatedCount;
}

// ========== SUPER ADMIN FUNCTIONS ==========

/**
 * Get all vendors (super admin only)
 */
export async function getAllVendors(): Promise<UserProfile[]> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "vendor"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  });
}

/**
 * Get all orders globally (super admin only)
 */
export async function getAllOrders(): Promise<Order[]> {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, orderBy("createdAt", "desc"), limit(500));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      reservedAt: data.reservedAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      paidAt: data.paidAt?.toDate(),
    } as Order;
  });
}

/**
 * Get all products globally (super admin only)
 */
export async function getAllProducts(): Promise<Product[]> {
  const productsRef = collection(db, "products");
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as unknown as Product;
  });
}

/**
 * Get platform stats (super admin only)
 */
export async function getPlatformStats(): Promise<{
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
}> {
  const [vendors, orders] = await Promise.all([
    getAllVendors(),
    getAllOrders(),
  ]);
  
  const productsRef = collection(db, "products");
  const productsSnapshot = await getDocs(productsRef);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const paidOrders = orders.filter(o => o.status === "paid");
  const todayOrders = orders.filter(o => o.createdAt >= today);
  const todayPaidOrders = todayOrders.filter(o => o.status === "paid");
  
  return {
    totalVendors: vendors.length,
    totalProducts: productsSnapshot.size,
    totalOrders: orders.length,
    totalRevenue: paidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    todayRevenue: todayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    todayOrders: todayOrders.length,
  };
}

/**
 * Get vendor config by vendor ID (super admin)
 */
export async function getVendorConfigById(vendorId: string): Promise<VendorConfig | null> {
  const configRef = collection(db, "vendor_configs");
  const q = query(configRef, where("vendorId", "==", vendorId), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as VendorConfig;
}

// ========== PLATFORM CONFIG ==========

export interface PlatformConfig {
  id: string;
  // WhatsApp Configuration
  whatsapp: {
    businessAccountId?: string;
    phoneNumberId?: string;
    accessToken?: string;
    verifyToken?: string;
    webhookUrl?: string;
    enabled: boolean;
    // Wasender API Configuration
    wasenderApiKey?: string;
    wasenderApiUrl?: string;
    wasenderInstanceId?: string;
  };
  // Payment Configuration
  payment: {
    waveApiKey?: string;
    waveSecretKey?: string;
    waveWebhookSecret?: string;
    waveEnabled: boolean;
    orangeMoneyApiKey?: string;
    orangeMoneySecretKey?: string;
    orangeMoneyEnabled: boolean;
    stripePublicKey?: string;
    stripeSecretKey?: string;
    stripeWebhookSecret?: string;
    stripeEnabled: boolean;
    // PayDunya PSP Configuration
    paydunyaApiKey?: string;
    paydunyaSecretKey?: string;
    paydunyaWebhookSecret?: string;
    paydunyaEnabled: boolean;
    paydunyaMode?: "sandbox" | "live";
    testMode: boolean;
  };
  // General Settings
  general: {
    platformName: string;
    supportEmail?: string;
    supportPhone?: string;
    defaultCurrency: string;
    defaultLanguage: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultReservationMinutes: number;
  };
  // Notification Settings
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    slackWebhook?: string;
  };
  updatedAt: Date;
  updatedBy?: string;
}

const DEFAULT_PLATFORM_CONFIG: Omit<PlatformConfig, "id" | "updatedAt"> = {
  whatsapp: {
    enabled: false,
    wasenderApiKey: "",
    wasenderApiUrl: "https://api.wasenderapi.com/api/v1",
    wasenderInstanceId: "",
  },
  payment: {
    waveEnabled: false,
    orangeMoneyEnabled: false,
    stripeEnabled: false,
    // PayDunya
    paydunyaEnabled: false,
    paydunyaMode: "sandbox",
    testMode: true,
  },
  general: {
    platformName: "LivePay",
    defaultCurrency: "XOF",
    defaultLanguage: "fr",
    maintenanceMode: false,
    registrationEnabled: true,
    defaultReservationMinutes: 30,
  },
  notifications: {
    emailEnabled: false,
    smsEnabled: false,
    pushEnabled: false,
  },
};

/**
 * Get platform configuration (super admin only)
 */
export async function getPlatformConfig(): Promise<PlatformConfig> {
  const docRef = doc(db, "platformConfig", "main");
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    // Create default config if it doesn't exist
    const defaultConfig = {
      ...DEFAULT_PLATFORM_CONFIG,
      updatedAt: serverTimestamp(),
    };
    await setDoc(docRef, defaultConfig);
    return {
      id: "main",
      ...DEFAULT_PLATFORM_CONFIG,
      updatedAt: new Date(),
    };
  }
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    whatsapp: data.whatsapp || DEFAULT_PLATFORM_CONFIG.whatsapp,
    payment: data.payment || DEFAULT_PLATFORM_CONFIG.payment,
    general: data.general || DEFAULT_PLATFORM_CONFIG.general,
    notifications: data.notifications || DEFAULT_PLATFORM_CONFIG.notifications,
    updatedAt: data.updatedAt?.toDate() || new Date(),
    updatedBy: data.updatedBy,
  };
}

/**
 * Update platform configuration (super admin only)
 */
export async function updatePlatformConfig(
  config: Partial<Omit<PlatformConfig, "id" | "updatedAt">>,
  adminEmail: string
): Promise<void> {
  const docRef = doc(db, "platformConfig", "main");
  await setDoc(docRef, {
    ...config,
    updatedAt: serverTimestamp(),
    updatedBy: adminEmail,
  }, { merge: true });
}

/**
 * Update user role (super admin only)
 */
export async function updateUserRole(userId: string, role: "vendor" | "admin" | "superadmin"): Promise<void> {
  const fn = httpsCallable(functions, "adminUpdateUserRole");
  await fn({ userId, role });
}

/**
 * Delete user (super admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
  const fn = httpsCallable(functions, "adminDeleteUser");
  await fn({ userId });
}

/**
 * Suspend/Activate user (super admin only)
 */
export async function toggleUserStatus(userId: string, suspended: boolean): Promise<void> {
  const fn = httpsCallable(functions, "adminToggleUserStatus");
  await fn({ userId, suspended });
}

export async function deleteEntity(entityId: string): Promise<void> {
  const fn = httpsCallable(functions, "adminDeleteEntity");
  await fn({ entityId });
}

/**
 * Purge all non-super-admin data from Firestore.
 * Keeps only users whose email is listed in SUPER_ADMIN_EMAILS.
 */
export async function purgePlatformKeepSuperAdmin(): Promise<{
  deletedUsers: number;
  deletedAuthUsers: number;
  deletedByCollection: Record<string, number>;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Session requise");
  }

  const token = await currentUser.getIdToken(true);
  const endpoint = "https://us-central1-live-pay-97ac6.cloudfunctions.net/purgePlatformData";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action: "purge_keep_super_admin" }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || "Impossible de purger la plateforme");
  }

  return {
    deletedUsers: payload.deletedUsers || 0,
    deletedAuthUsers: payload.deletedAuthUsers || 0,
    deletedByCollection: payload.deletedByCollection || {},
  };
}
