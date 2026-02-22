# Multi-WABA Setup - Guide d'Installation

## Vue d'ensemble

Guide complet pour configurer l'architecture **Multi-WABA** permettant à chaque vendeur d'avoir son propre numéro WhatsApp avec Wasender.

---

## Architecture

```
Multi-WABA
├── WABAManager (Centralisé)
│   ├── Redis Cache (phone → vendor lookup O(1))
│   └── Firestore (source of truth)
├── VendorWasenderService (Per-Vendor)
│   ├── Wasender Instance (phone number)
│   ├── Message sending
│   └── Webhook handling
└── VendorWasenderWebhooks
    ├── Incoming messages
    ├── Status updates
    └── Connection events
```

---

## Services Créés

| Service | Responsabilité |
|---------|---|
| `waba-manager.ts` | Manager central + cache |
| `vendor-wasender-service.ts` | Service per-vendor |
| `vendor-wasender-webhooks.ts` | Webhook handlers |
| `firebase-waba.ts` | Database layer |

---

## Configuration Firestore

### Collection: `waba_instances`
```json
{
  "vendorId": "vendor-001",
  "phoneNumber": "+221705555555",
  "wasenderInstanceId": "instance-abc123",
  "webhookSecret": "secret-key-abc123",
  "provider": "wasender",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### Collection: `vendor_configs` (Extended)
```json
{
  ...existing,
  "wabaInstanceId": "waba-001",
  "wabaProvider": "wasender"
}
```

---

## Tests Locaux

```bash
# 1. Create test WABA instance
npx tsx script/setup-waba-test.ts

# 2. Test webhook with signature
bash script/test-waba-webhook.sh

# 3. Verify Firestore
firebase firestore:describe waba_instances
```

---

## Déploiement

```bash
npm run build
firebase deploy
```

---

## Monitoring

```bash
gcloud functions logs read -f
```
