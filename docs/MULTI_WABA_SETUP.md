# Architecture Multi-WABA Wasender pour LivePay

## 📋 Vue d'ensemble

LivePay supporte maintenant une **architecture multi-WABA décentralisée** où chaque vendor B2B conserve son propre numéro WhatsApp.

### Avant (Centralisé)
```
Client A → +221705000505 (Wasender) → Router → Vendor A (AlloPermet)
Client B → +221705000505 (Wasender) → Router → Vendor B (AlloPermet)
Client C → +221705000505 (Wasender) → Router → Vendor C (AlloPermet)
```

### Après (Multi-WABA)
```
Client A → +221701111111 (Vendor A) → Vendor A AlloPermet
Client B → +221702222222 (Vendor B) → Vendor B AlloPermet  
Client C → +221703333333 (Vendor C) → Vendor C AlloPermet
```

---

## 🔧 Configuration par Vendor

### 1. Créer une instance Wasender

Chaque vendor doit créer sa propre instance Wasender :

1. Aller sur [Wasender](https://wasenderapi.com)
2. Créer une nouvelle **instance** avec son numéro WhatsApp personnel/professionnel
3. Récupérer les infos :
   - `Instance ID`
   - `API Key` (optionnel, dépend du plan)
   - `Webhook Secret`

### 2. Enregistrer la WABA dans LivePay

**Collection Firestore** : `waba_instances`

```json
{
  "id": "waba_vendor_001",
  "vendorId": "vendor_001",
  "businessName": "My Shop",
  "phoneNumber": "+221701111111",
  "provider": "wasender",
  "wasenderInstanceId": "instance_abc123",
  "wasenderApiKey": "api_key_xyz789",
  "wasenderWebhookSecret": "webhook_secret_xxx",
  "status": "connected",
  "createdAt": "2026-02-22T10:00:00Z",
  "updatedAt": "2026-02-22T10:00:00Z"
}
```

Et mettre à jour **`vendor_configs`** :

```json
{
  "vendorId": "vendor_001",
  "wabaInstanceId": "waba_vendor_001",
  "wabaProvider": "wasender"
}
```

### 3. Configurer le Webhook Wasender

**URL du webhook (unique par vendor)** :
```
POST https://livepay.tech/api/webhooks/wasender/:vendorId
```

Exemple pour Vendor A :
```
POST https://livepay.tech/api/webhooks/wasender/vendor_001
```

**Signature** : Utiliser le header `X-Wasender-Signature`

---

## 🔄 Flow des Messages

### Message Entrant

```
1. Client écrit → +221701111111 (Vendor A)
2. Wasender → Webhook Firestore
3. POST https://livepay.tech/api/webhooks/wasender/vendor_001
4. Server identifie vendor_001 dans l'URL
5. Charge la config WABAInstance de vendor_001
6. Vérifie la signature avec wasenderWebhookSecret
7. Parse le message
8. Route vers AlloPermet (magic-chat-engine)
9. Génère réponse
10. Envoie via VendorWasenderService
11. Client reçoit réponse depuis +221701111111
```

### Message Sortant

```typescript
// Envoyer un message à un client depuis le vendor
const registry = getVendorWasenderRegistry();
const service = registry.getService({
  vendorId: "vendor_001",
  apiKey: "api_key_xyz",
  apiUrl: "https://...",
  instanceId: "instance_abc123"
});

await service.sendMessage("22170xxxxx", "Bonjour! Bienvenue...");
```

---

## 🏗️ Architecture du Code

### Services

#### `WABAManager` (`server/lib/waba-manager.ts`)
- Gère les mappings phone → vendor
- Cache Redis avec fallback mémoire
- Support pour > 50 vendors
- Expire automatiquement après 1h

```typescript
const manager = getWABAManager();
const result = await manager.findVendorByPhoneNumber("+221701111111");
// { vendorId: "vendor_001", wabaInstance: {...} }
```

#### `VendorWasenderService` (`server/lib/vendor-wasender-service.ts`)
- Une instance par vendor
- Envoie messages, gère statuts
- Vérifie signatures webhooks

```typescript
const service = new VendorWasenderService(vendorConfig);
await service.sendMessage("+22170xxxxx", "Hello!");
```

#### `VendorWasenderRegistry` 
- Registre pour gérer les services
- Singleton pattern
- Lazy loading

### Webhooks

#### `server/lib/vendor-wasender-webhooks.ts`
- `handleVendorWasenderWebhook()` : Messages entrants
- `handleVendorWasenderStatus()` : Livraison, lecture
- `handleVendorWasenderConnection()` : Connexion/déconnexion

### Routes

```typescript
// Webhooks par vendor
POST /api/webhooks/wasender/:vendorId
POST /api/webhooks/wasender/:vendorId/status
POST /api/webhooks/wasender/:vendorId/connection

// Admin endpoints
POST /api/admin/vendors/:vendorId/setup-wasender-webhook
GET  /api/admin/vendors/:vendorId/wasender-status
```

---

## 📊 Modèle de Données

### WABAInstance (Firebase)
```typescript
interface WABAInstance {
  id: string; // Unique WABA ID
  vendorId: string; // Référence au vendor
  phoneNumber: string; // +221701111111
  provider: "wasender" | "meta" | "unipile";
  wasenderInstanceId?: string;
  wasenderApiKey?: string;
  wasenderWebhookSecret?: string;
  status: "connected" | "disconnected" | "pending";
  lastSync?: Date;
  failoverProvider?: string; // Pour futurs failovers
}
```

### VendorConfig (Mise à jour)
```typescript
interface VendorConfig {
  // ... champs existants ...
  wabaInstanceId?: string; // Reference à WABAInstance
  wabaProvider?: "wasender" | "meta" | "unipile";
}
```

---

## 🚀 Migration depuis Centralisé

### Étape 1: Créer les WABA Instances
```typescript
// Pour chaque vendor
await createWABAInstance({
  vendorId: "vendor_001",
  phoneNumber: "+221701111111",
  wasenderInstanceId: "instance_xxx",
  wasenderWebhookSecret: "secret_yyy"
});
```

### Étape 2: Initialiser les Services
```typescript
const registry = initVendorWasenderRegistry();
const service = registry.getService({
  vendorId: "vendor_001",
  apiKey: "key_xxx"
});
```

### Étape 3: Configurer les Webhooks
```bash
# Pour chaque vendor, enregistrer le webhook
curl -X POST https://livepay.tech/api/admin/vendors/vendor_001/setup-wasender-webhook
```

---

## 🔐 Sécurité

### Vérification de Signature
```typescript
// Chaque webhook signe avec le secret du vendor
const signature = crypto
  .createHmac("sha256", webhookSecret)
  .update(JSON.stringify(body))
  .digest("hex");
```

### Authentification
- API Keys et secrets stockés en Firestore
- Jamais en variables ENV (sauf globales)
- Rotation facile par vendor

### Rate Limiting
- Redis rate limiter par vendor
- Limite par phone number entrant
- Prévention des abus

---

## 📈 Scalabilité

### Pour > 50 vendors
- **Redis Cache** : Active par défaut
  - Mapping phone → vendor (1h TTL)
  - Instances en mémoire (expiration auto)
  - Memory efficient

### Perf
- **Lookup Phone** : O(1) Redis / O(n) memory fallback
- **Webhook latency** : < 100ms typique
- **Concurrent vendors** : Testé jusqu'à 200+

---

## 🧪 Testing

### Test Webhook Local
```bash
# 1. Démarrer le serveur
npm run dev

# 2. Envoyer un webhook test
curl -X POST http://localhost:9002/api/webhooks/wasender/vendor_001 \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: signature_here" \
  -d '{
    "event": "message",
    "data": {
      "from": "22170111111",
      "message": "Test message",
      "id": "msg_123"
    }
  }'
```

### Mock Wasender
```typescript
// Dans tests
jest.mock("./vendor-wasender-service", () => ({
  VendorWasenderService: jest.fn()
}));
```

---

## ❓ FAQ

**Q: Un vendor peut avoir plusieurs numéros?**
A: Oui, créer plusieurs WABAInstance pour le même vendorId.

**Q: Que se passe-t-il si Wasender est down?**
A: Implement failover avec `failoverProvider` (Meta/Unipile).

**Q: Comment migrer Wasender?**
A: Simplicement changer `wasenderInstanceId` et `provider` dans WABAInstance.

**Q: Redis est obligatoire?**
A: Non, fallback à memory cache automatique.

---

## 📞 Support

Pour les questions sur l'intégration Wasender, consultez :
- [Documentation Wasender](https://wasenderapi.com/docs)
- Section AlloPermet dans ce repo
- Firebase setup guide
