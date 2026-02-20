/**
 * Firebase Admin SDK Configuration (Server-side)
 * For use in server-side code only
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAKl0W7XqgBCtBiWXp8bANDhwv_lnVR2GU",
  projectId: process.env.FIREBASE_PROJECT_ID || "live-pay-97ac6",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "live-pay-97ac6.firebasestorage.app",
};

// Initialize Firebase Admin
if (!getApps().length) {
  // Try to use service account if available
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath) {
    try {
      const serviceAccount = require(serviceAccountPath);
      initializeApp({
        credential: cert(serviceAccount),
        ...firebaseConfig,
      });
      console.log("[FIREBASE] Initialized with service account");
    } catch (error) {
      console.warn("[FIREBASE] Failed to load service account, using default credentials");
      initializeApp({
        ...firebaseConfig,
      });
    }
  } else {
    // Use default credentials (Application Default Credentials)
    initializeApp({
      ...firebaseConfig,
    });
    console.log("[FIREBASE] Initialized with default credentials");
  }
}

export const db: Firestore = getFirestore();
export const adminApp = getApps()[0];
