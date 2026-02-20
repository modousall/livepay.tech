/**
 * Create a new entity (tenant) with admin user
 * This function is called by Super Admin only
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

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
  try {
    const createEntity = httpsCallable(functions, "createEntityWithAdmin");
    const result = await createEntity({
      businessName: data.businessName,
      adminEmail: data.adminEmail,
      adminPassword: data.adminPassword,
      adminFirstName: data.adminFirstName,
      adminLastName: data.adminLastName,
      phone: data.phone,
      sector: data.sector,
    });
    return result.data as CreateEntityResult;
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
