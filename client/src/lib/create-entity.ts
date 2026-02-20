/**
 * Create a new entity (tenant) with admin user
 * This function is called by Super Admin only
 */

import { 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/firebase";

interface CreateEntityData {
  businessName: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName?: string;
  adminLastName?: string;
  phone?: string;
  sector?: string;
}

interface CreateEntityResult {
  entityId: string;
  adminId: string;
  adminEmail: string;
  temporaryPassword: string;
}

/**
 * Create a new entity with its admin user
 * @param data - Entity and admin data
 * @returns Entity and admin IDs
 */
export async function createEntityWithAdmin(
  data: CreateEntityData
): Promise<CreateEntityResult> {
  const {
    businessName,
    adminEmail,
    adminPassword,
    adminFirstName = "Admin",
    adminLastName = "",
    phone = "",
    sector = "shop"
  } = data;

  try {
    // 1. Create admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminEmail.toLowerCase(),
      adminPassword
    );
    const adminId = userCredential.user.uid;

    // Update display name
    const displayName = `${adminFirstName} ${adminLastName}`.trim() || businessName;
    await updateProfile(userCredential.user, { displayName });

    // 2. Create entity (tenant) in Firestore
    const entityRef = await addDoc(collection(db, "entities"), {
      name: businessName,
      ownerId: adminId,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const entityId = entityRef.id;

    // 3. Create admin user profile in Firestore
    const adminProfile: Partial<UserProfile> = {
      id: adminId,
      email: adminEmail.toLowerCase(),
      firstName: adminFirstName,
      lastName: adminLastName,
      businessName: businessName,
      phone: phone,
      role: "vendor",
      entityId: entityId,
      entityRole: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(collection(db, "users"), {
      ...adminProfile,
      createdAt: Timestamp.fromDate(adminProfile.createdAt!),
      updatedAt: Timestamp.fromDate(adminProfile.updatedAt!),
    });

    // 4. Create vendor config for the entity
    await addDoc(collection(db, "vendorConfigs"), {
      vendorId: entityId,
      businessName: businessName,
      preferredPaymentMethod: "wave",
      status: "active",
      liveMode: false,
      uiMode: "expert",
      expertModeEnabled: true,
      reservationDurationMinutes: 10,
      autoReplyEnabled: true,
      segment: sector,
      allowQuantitySelection: true,
      requireDeliveryAddress: false,
      autoReminderEnabled: true,
      upsellEnabled: false,
      minTrustScoreRequired: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 5. Sign out the newly created user (Super Admin stays logged in)
    await auth.signOut();

    return {
      entityId,
      adminId,
      adminEmail: adminEmail.toLowerCase(),
      temporaryPassword: adminPassword,
    };
  } catch (error: any) {
    console.error("Error creating entity:", error);
    throw new Error(
      error.message || "Erreur lors de la création de l'entité"
    );
  }
}

/**
 * Send welcome email to new admin
 * This is a client-side function - in production, use Cloud Functions
 */
export function sendWelcomeEmail(
  adminEmail: string,
  businessName: string,
  temporaryPassword: string
): void {
  const subject = encodeURIComponent("Bienvenue sur LIVE TECH - Vos identifiants");
  const body = encodeURIComponent(`
Bonjour,

Votre entité "${businessName}" a été créée sur LIVE TECH.

Voici vos identifiants de connexion:
- Email: ${adminEmail}
- Mot de passe temporaire: ${temporaryPassword}

⚠️ IMPORTANT: Veuillez changer ce mot de passe dès votre première connexion.

Lien de connexion: https://live-pay-97ac6.web.app/login

Pour toute question, contactez-nous à contact@livepay.tech

Cordialement,
L'équipe LIVE TECH
  `.trim());

  // Open email client
  window.open(`mailto:${adminEmail}?subject=${subject}&body=${body}`);
}
