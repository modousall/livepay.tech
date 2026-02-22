# Firestore Multi-WABA Schema

**Dernière mise à jour:** Février 2026

---

## Collections Structure

### Collection: `waba_instances`

Stocke la configuration de chaque WABA instance par vendeur.

**Document ID:** `{vendorId}`

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `vendorId` | string | Identifiant unique du vendeur |
| `phoneNumber` | string | Numéro WhatsApp (ex: +221705555555) |
| `wasenderInstanceId` | string | ID Wasender instance |
| `webhookSecret` | string | Secret pour signature HMAC |
| `provider` | string | "wasender" (ou autre provider) |
| `status` | string | "active" \| "inactive" \| "error" |
| `createdAt` | timestamp | Date création |
| `updatedAt` | timestamp | Dernière modification |

**Example:**

```json
{
  "vendorId": "vendor-001",
  "phoneNumber": "+221705555555",
  "wasenderInstanceId": "waba_123456",
  "webhookSecret": "sk_live_abc123def456",
  "provider": "wasender",
  "status": "active",
  "createdAt": {"seconds": 1704067200},
  "updatedAt": {"seconds": 1704067200}
}
```

---

### Collection: `vendor_configs`

Configuration générale du vendeur (existante, étendue).

**Document ID:** `{vendorId}`

**New Fields:**

```json
{
  "vendorId": "vendor-001",
  "businessName": "ShopXYZ",
  "wabaInstanceId": "waba-001",      // NEW
  "wabaProvider": "wasender",        // NEW
  "wabaStatus": "active",
  ...other fields
}
```

---

## Indexes

### Index 1: Phone Number Lookup

```
Collection: waba_instances
Fields: phoneNumber (Ascending)
```

Permet: `waba_instances.where('phoneNumber', '==', '+221705555555')`

### Index 2: Wasender Instance Lookup

```
Collection: waba_instances
Fields: wasenderInstanceId (Ascending)
```

Permet: `waba_instances.where('wasenderInstanceId', '==', 'instance-123')`

### Index 3: Status Query

```
Collection: waba_instances
Fields: status (Ascending), createdAt (Descending)
```

Permet: `waba_instances.where('status', '==', 'active').orderBy('createdAt', 'desc')`

---

## Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // WABA Instances - Multi-WABA Support
    match /waba_instances/{wabaId} {
      // Admins peuvent lire/écrire
      allow read, write: if request.auth.token.role == 'admin'
                         || request.auth.token.role == 'super_admin';

      // Vendors peuvent lire leurs propres WABAs
      allow read: if resource.data.vendorId == request.auth.uid;

      // Système peut lire (pour migration)
      allow read: if request.auth.token.role == 'system';
    }

    // Vendor configs
    match /vendor_configs/{vendorId} {
      allow read: if request.auth.uid == vendorId
                     || request.auth.token.role == 'admin';
      allow write: if request.auth.token.role == 'admin';
    }

    // Webhook logs (audit trail)
    match /waba_webhook_logs/{logId} {
      allow write: if request.auth.token.role == 'system';
      allow read: if request.auth.token.role == 'admin'
                     || request.auth.token.role == 'super_admin';
    }
  }
}
```

---

## Queries Communes

### Find WABA by Vendor

```javascript
firestore.collection('waba_instances')
  .doc(vendorId)
  .get()
```

### Find WABA by Phone

```javascript
firestore.collection('waba_instances')
  .where('phoneNumber', '==', phoneNumber)
  .limit(1)
  .get()
```

### Find WABA by Wasender Instance ID

```javascript
firestore.collection('waba_instances')
  .where('wasenderInstanceId', '==', wasenderInstanceId)
  .limit(1)
  .get()
```

### List All Active WABAs

```javascript
firestore.collection('waba_instances')
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .get()
```

---

## Setup Scripts

### Create WABA Instance Manually

```bash
firebase firestore:set waba_instances/vendor-001 \
  '{
    "vendorId": "vendor-001",
    "phoneNumber": "+221705555555",
    "wasenderInstanceId": "instance-abc123",
    "webhookSecret": "secret-key-abc123",
    "provider": "wasender",
    "status": "active",
    "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "updatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }' --merge
```

### Create via Script

```bash
npx tsx script/setup-waba-test.ts
```

---

## Backup & Restore

### Export Collection

```bash
gcloud firestore export gs://bucket/backup/waba_instances \
  --collection-ids=waba_instances
```

### Import Collection

```bash
gcloud firestore import gs://bucket/backup/waba_instances
```

---

## Monitoring

### Check Collection Size

```bash
firebase firestore:describe waba_instances
```

### Monitor Queries

```bash
gcloud functions logs read -f | grep "waba_instances"
```

### Quota Usage

Firebase Console → Firestore Database → Usage

---

## Voir aussi

- [Guide UI Firestore](./FIRESTORE_UI_GUIDE.md) - Guide pas à pas pour créer des instances
- [API WABA Endpoints](./API_WABA_ENDPOINTS.md) - Endpoints API
- [Déploiement](./DEPLOYMENT.md) - Guide de déploiement complet
