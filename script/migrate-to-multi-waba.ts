/**
 * Migration Script: Centralized → Multi-WABA Wasender
 * 
 * Usage:
 *   npx tsx script/migrate-to-multi-waba.ts
 * 
 * Ce script:
 * 1. Récupère tous les vendors
 * 2. Demande le numéro Wasender pour chaque
 * 3. Crée une instance WABA
 * 4. Met à jour la config vendor
 * 5. Enregistre le webhook
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

// Types
interface MigrationConfig {
  vendorId: string;
  businessName: string;
  phoneNumber: string;
  wasenderInstanceId: string;
  wasenderApiKey?: string;
  wasenderWebhookSecret: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function initializeFirebase() {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      "./serviceAccountKey.json";

    if (!fs.existsSync(serviceAccountPath)) {
      console.error(
        `❌ Service account file not found: ${serviceAccountPath}`
      );
      console.error(
        "Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable"
      );
      process.exit(1);
    }

    const serviceAccount = JSON.parse(
      fs.readFileSync(serviceAccountPath, "utf-8")
    );

    initializeApp({
      credential: cert(serviceAccount),
    });

    return getFirestore();
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    process.exit(1);
  }
}

async function getAllVendors(db: any): Promise<any[]> {
  const snapshot = await db.collection("vendor_configs").get();
  return snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function configureVendor(): Promise<MigrationConfig> {
  console.log("\n📋 Configure Vendor WABA Instance\n");

  const vendorId = await prompt("Vendor ID (or press Enter to exit): ");
  if (!vendorId) return null as any;

  const businessName = await prompt("Business Name: ");
  const phoneNumber = await prompt(
    'Phone Number (format: +221701111111): '
  );
  const wasenderInstanceId = await prompt(
    "Wasender Instance ID: "
  );
  const wasenderWebhookSecret = await prompt(
    "Wasender Webhook Secret: "
  );

  const apiKey = await prompt(
    "Wasender API Key (optional, press Enter to skip): "
  );

  return {
    vendorId,
    businessName,
    phoneNumber,
    wasenderInstanceId,
    wasenderApiKey: apiKey || undefined,
    wasenderWebhookSecret,
  };
}

async function createWABAInstance(db: any, config: MigrationConfig) {
  try {
    const now = new Date().toISOString();

    const wabaRef = db
      .collection("waba_instances")
      .doc(`waba_${config.vendorId}`);

    await wabaRef.set({
      vendorId: config.vendorId,
      businessName: config.businessName,
      phoneNumber: config.phoneNumber,
      provider: "wasender",
      wasenderInstanceId: config.wasenderInstanceId,
      wasenderApiKey: config.wasenderApiKey,
      wasenderWebhookSecret: config.wasenderWebhookSecret,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ Created WABA instance: ${wabaRef.path}`);

    return wabaRef.id;
  } catch (error) {
    console.error("❌ Failed to create WABA instance:", error);
    throw error;
  }
}

async function updateVendorConfig(
  db: any,
  vendorId: string,
  wabaInstanceId: string
) {
  try {
    const vendorRef = db.collection("vendor_configs").doc(vendorId);

    await vendorRef.update({
      wabaInstanceId,
      wabaProvider: "wasender",
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Updated vendor config for: ${vendorId}`);
  } catch (error) {
    console.error("❌ Failed to update vendor config:", error);
    throw error;
  }
}

async function setupWebhook(vendorId: string, phoneNumber: string) {
  const baseUrl = process.env.APP_BASE_URL || "https://livepay.tech";
  const webhookUrl = `${baseUrl}/api/webhooks/wasender/${vendorId}`;

  console.log(`\n🔗 Configure Webhook in Wasender:\n`);
  console.log(`URL: ${webhookUrl}`);
  console.log(`Method: POST`);
  console.log(`Events: message, status, connection`);
  console.log(`\n📱 Then verify the webhook is connected before proceeding.\n`);
}

async function migrateInteractive(db: any): Promise<void> {
  console.log("\n🚀 Multi-WABA Migration - Interactive Mode\n");
  console.log("Configure vendors one by one.\n");

  const migrationLog: MigrationConfig[] = [];

  let continueConfig = true;
  while (continueConfig) {
    const config = await configureVendor();

    if (!config) {
      continueConfig = false;
      break;
    }

    console.log(`\n⏳ Creating WABA instance for ${config.vendorId}...`);

    const wabaInstanceId = await createWABAInstance(db, config);
    await updateVendorConfig(db, config.vendorId, wabaInstanceId);
    setupWebhook(config.vendorId, config.phoneNumber);

    migrationLog.push(config);

    const more = await prompt(
      "Configure another vendor? (y/n): "
    );
    if (more.toLowerCase() !== "y") {
      continueConfig = false;
    }
  }

  // Save migration log
  if (migrationLog.length > 0) {
    const logPath = `./migration-log-${Date.now()}.json`;
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));
    console.log(`\n📋 Migration log saved: ${logPath}`);
  }
}

async function migrateBatch(db: any, csvFile?: string): Promise<void> {
  console.log("\n🚀 Multi-WABA Migration - Batch Mode\n");

  if (!csvFile) {
    console.error("CSV file path required for batch mode");
    process.exit(1);
  }

  if (!fs.existsSync(csvFile)) {
    console.error(`CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  // Parse CSV
  const content = fs.readFileSync(csvFile, "utf-8");
  const lines = content.split("\n").slice(1); // Skip header

  const configs: MigrationConfig[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const [
      vendorId,
      businessName,
      phoneNumber,
      wasenderInstanceId,
      wasenderWebhookSecret,
      wasenderApiKey,
    ] = line.split(",").map((v) => v.trim());

    configs.push({
      vendorId,
      businessName,
      phoneNumber,
      wasenderInstanceId,
      wasenderWebhookSecret,
      wasenderApiKey: wasenderApiKey || undefined,
    });
  }

  // Migrate each vendor
  for (const config of configs) {
    console.log(`\n⏳ Migrating ${config.vendorId}...`);

    const wabaInstanceId = await createWABAInstance(db, config);
    await updateVendorConfig(db, config.vendorId, wabaInstanceId);
    setupWebhook(config.vendorId, config.phoneNumber);
  }

  console.log("\n✅ Migration completed!");
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log("║   LivePay Multi-WABA Wasender Migration               ║");
  console.log("║   Transform from Centralized to Decentralized         ║");
  console.log("╚═══════════════════════════════════════════════════════╝");

  const db = await initializeFirebase();

  // Check mode
  const mode = process.argv[2] || "interactive"; // interactive | batch

  if (mode === "batch") {
    const csvFile = process.argv[3];
    await migrateBatch(db, csvFile);
  } else {
    await migrateInteractive(db);
  }

  console.log("\n✨ All done!\n");
  rl.close();
  process.exit(0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
  rl.close();
  process.exit(1);
});

main();
