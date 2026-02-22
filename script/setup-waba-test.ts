/**
 * Setup Script - Create WABA Instance for Testing
 * 
 * Usage:
 *   npx tsx script/setup-waba-test.ts
 * 
 * Crée une WABA instance de test en Firestore
 */

import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as fs from "fs";

const VENDOR_ID = "vendor_test_001";
const WEBHOOK_SECRET = "webhook_secret_test_123";

async function setup() {
  try {
    console.log("╔════════════════════════════════════════════╗");
    console.log("║  Setup WABA Instance pour Testing          ║");
    console.log("╚════════════════════════════════════════════╝\n");

    // Initialize Firebase Admin
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      "./serviceAccountKey.json";

    if (!fs.existsSync(serviceAccountPath)) {
      console.log("❌ Service account file not found!");
      console.log("   Path: " + serviceAccountPath);
      console.log("\n📝 Options:");
      console.log("   1. Set FIREBASE_SERVICE_ACCOUNT_PATH env var");
      console.log("   2. Download from Firebase Console > Project Settings > Service Accounts");
      console.log("   3. Or create manually via Firebase UI\n");

      // Afficher les instructions manuelles
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n✅ OPTION MANUELLE (via Firebase UI):\n");
      console.log("1. Allez à: https://console.firebase.google.com");
      console.log("2. Sélectionnez le projet: livepay");
      console.log("3. Allez à Firestore Database");
      console.log("4. Cliquez + Create Collection");
      console.log("5. Collection ID: waba_instances");
      console.log("6. Cliquez Auto-ID");
      console.log("7. Copier-coller ce document:\n");

      console.log(
        JSON.stringify(
          {
            vendorId: VENDOR_ID,
            phoneNumber: "+221701111111",
            provider: "wasender",
            wasenderInstanceId: "instance_test_123",
            wasenderWebhookSecret: WEBHOOK_SECRET,
            status: "connected",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        )
      );

      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      process.exit(1);
    }

    // Parse service account
    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf-8")
    );

    // Initialize Firebase Admin
    initializeApp({
      credential: cert(serviceAccount),
    });

    const db = getFirestore();

    // Create WABA instance
    const now = new Date();
    const wabaData = {
      vendorId: VENDOR_ID,
      phoneNumber: "+221701111111",
      provider: "wasender",
      wasenderInstanceId: "instance_test_123",
      wasenderWebhookSecret: WEBHOOK_SECRET,
      status: "connected",
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };

    console.log("📦 Créating WABA instance...\n");
    console.log("Data:", JSON.stringify(wabaData, null, 2));

    const docRef = db.collection("waba_instances").doc(`waba_${VENDOR_ID}`);
    await docRef.set(wabaData);

    console.log("\n✅ WABA instance created successfully!\n");
    console.log("📝 Details:");
    console.log(`   Collection: waba_instances`);
    console.log(`   Document ID: waba_${VENDOR_ID}`);
    console.log(`   Vendor ID: ${VENDOR_ID}`);
    console.log(`   Phone: +221701111111`);
    console.log(`   Webhook Secret: ${WEBHOOK_SECRET}\n`);

    console.log("🚀 Prêt à tester!\n");
    console.log("Relancer le webhook test:");
    console.log("   bash script/test-waba-webhook.sh\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

setup();
