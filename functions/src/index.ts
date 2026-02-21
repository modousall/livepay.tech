/**
 * LivePay Cloud Functions - Main Entry Point (source)
 */
import { setGlobalOptions } from "firebase-functions/v2/options";
import "./firebase";
import {
  WASENDER_API_KEY,
  WASENDER_API_URL,
  WASENDER_INSTANCE_ID,
  WASENDER_WEBHOOK_SECRET,
} from "./secrets";

setGlobalOptions({
  secrets: [
    WASENDER_API_KEY,
    WASENDER_API_URL,
    WASENDER_INSTANCE_ID,
    WASENDER_WEBHOOK_SECRET,
  ],
});

// Re-export existing compiled functions (keeps behavior until full TS migration)
const whatsapp = require("../lib/webhooks/whatsapp");
const whatsappPro = require("../lib/webhooks/whatsapp-pro");
const paymentProof = require("../lib/webhooks/payment-proof");
const expireOrders = require("../lib/scheduled/expireOrders");
const expireLiveReservations = require("../lib/scheduled/expireLiveReservations");
const ordersTriggers = require("../lib/triggers/orders");
const ordersServices = require("../lib/services/orders");
const testWhatsapp = require("../lib/services/test-whatsapp");
const storageProxy = require("../lib/services/storage-proxy");
const purgePlatform = require("../lib/admin/purge-platform");
const createEntity = require("../lib/admin/create-entity");

export const whatsappWebhook = whatsapp.whatsappWebhook;
export const whatsappWebhookVerify = whatsapp.whatsappWebhookVerify;
export const whatsappWebhookPro = whatsappPro.whatsappWebhookPro;
export const whatsappPaymentProof = paymentProof.whatsappPaymentProof;
export const expireOrders = expireOrders.expireOrders;
export const expireOrdersManual = expireOrders.expireOrdersManual;
export const expireLiveReservations = expireLiveReservations.expireLiveReservations;
export const onOrderCreated = ordersTriggers.onOrderCreated;
export const onOrderPaid = ordersTriggers.onOrderPaid;
export const onProductStockEmpty = ordersTriggers.onProductStockEmpty;
export const onUserDeleted = ordersTriggers.onUserDeleted;
export const confirmPaymentManual = ordersServices.confirmPaymentManual;
export const testWhatsAppConnection = testWhatsapp.testWhatsAppConnection;
export const storageProxy = storageProxy.storageProxy;
export const purgePlatformData = purgePlatform.purgePlatformData;
export const createEntityWithAdmin = createEntity.createEntityWithAdmin;

// New source function
export { publicShop } from "./services/public-shop";
