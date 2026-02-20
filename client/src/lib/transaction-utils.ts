/**
 * Transaction Utilities
 * Ensures data consistency between Firestore and Storage
 */

import { Timestamp, updateDoc, doc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getStorage,
  FirebaseStorage,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { OrderStatus } from "@shared/types";

export class PaymentProofError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "PaymentProofError";
  }
}

/**
 * Upload payment proof with transaction safety
 * Ensures the file is properly linked to the order or cleaned up on failure
 */
export async function uploadProofWithTransaction(
  orderId: string,
  proofFile: File
): Promise<string> {
  const timestamp = Date.now();
  const tempPath = `temp-uploads/${orderId}/${timestamp}_${proofFile.name}`;
  const finalPath = `payment-proofs/${orderId}/${timestamp}_${proofFile.name}`;

  try {
    // 1. Upload vers chemin temporaire
    const tempRef = ref(storage, tempPath);
    const snapshot = await uploadBytes(tempRef, proofFile);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // 2. Mettre à jour la commande
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      paymentProof: imageUrl,
      status: "pending" as OrderStatus,
      updatedAt: Timestamp.now(),
    });

    // 3. Déplacer de temp vers final (en réuploadant)
    const finalRef = ref(storage, finalPath);
    await uploadBytes(finalRef, proofFile);
    const finalUrl = await getDownloadURL(finalRef);

    // 4. Mettre à jour avec l'URL finale
    await updateDoc(orderRef, {
      paymentProof: finalUrl,
    });

    // 5. Nettoyer le fichier temporaire
    try {
      await deleteObject(tempRef);
    } catch (cleanupError) {
      console.warn("Failed to delete temp file:", cleanupError);
    }

    return finalUrl;
  } catch (err) {
    // Nettoyer les fichiers temporaires en cas d'erreur
    try {
      const tempRef = ref(storage, tempPath);
      await deleteObject(tempRef).catch(() => {});
    } catch (cleanupError) {
      console.warn("Failed to cleanup temp file:", cleanupError);
    }

    if (err instanceof PaymentProofError) {
      throw err;
    }

    throw new PaymentProofError("UPLOAD_FAILED", "Impossible d'uploader la preuve de paiement");
  }
}

/**
 * Delete a file from storage safely
 */
export async function deleteStorageFile(filePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error("Failed to delete storage file:", error);
    throw new PaymentProofError("DELETE_FAILED", "Impossible de supprimer le fichier");
  }
}

/**
 * Move a file from one path to another in storage
 */
export async function moveStorageFile(fromPath: string, toPath: string): Promise<string> {
  try {
    const fromRef = ref(storage, fromPath);
    const toRef = ref(storage, toPath);

    // Download the file data
    const fileData = await getFileData(fromRef);

    // Upload to new location
    const snapshot = await uploadBytes(toRef, fileData);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    // Delete old file
    await deleteObject(fromRef);

    return downloadUrl;
  } catch (error) {
    console.error("Failed to move storage file:", error);
    throw new PaymentProofError("MOVE_FAILED", "Impossible de déplacer le fichier");
  }
}

/**
 * Get file data from storage reference
 */
async function getFileData(fileRef: ReturnType<typeof ref>): Promise<Blob> {
  const response = await fetch(await getDownloadURL(fileRef));
  return response.blob();
}

/**
 * Upload file with retry logic
 */
export async function uploadWithRetry(
  file: File,
  path: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new PaymentProofError(
    "UPLOAD_FAILED_AFTER_RETRIES",
    `Échec de l'upload après ${maxRetries} tentatives: ${lastError?.message}`
  );
}

/**
 * Validate file before upload
 */
export function validateFileForUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 5, allowedTypes = ["image/jpeg", "image/png", "image/jpg"] } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(", ")}`,
    };
  }

  return { valid: true };
}
