# 🚀 Architecture Multi-WABA Wasender - IMPLÉMENTÉE

## ✅ Résumé de l'implémentation

Vous êtes passés d'une architecture **centralisée** (tous les vendors utilisent +221705000505) à une **architecture multi-WABA décentralisée** où **chaque vendor a son propre numéro WhatsApp**.

---

## 🎯 Ce qui a été fait

### 1️⃣ **Schéma de Données (shared/types.ts)**

Nouveaux types TypeScript :

```typescript
// Nouveau: Interface WABA (WhatsApp Business Account)
interface WABAInstance {
  vendorId: string;
  phoneNumber: string;        // Ex: +221701111111
  provider: "wasender" | "meta" | "unipile";
  wasenderInstanceId: string;
  wasenderApiKey?: string;
  wasenderWebhookSecret: string;
  status: "connected" | "disconnected" | "pending";
}

// Mis à jour: VendorConfig
interface VendorConfig {
  // ... fields existants ...
  wabaInstanceId?: string;    // Référence WABA
  wabaProvider?: "wasender";  // Provider actif
}
```

**Firestore Collections:**
- ✅ `waba_instances` : Une par vendor (mapping phone → vendor)
- ✅ `vendor_configs` : Mise à jour avec `wabaInstanceId`

---

### 2️⃣ **Services Backend**

#### **WABAManager** (`server/lib/waba-manager.ts`)
- Gère les mappings entre numéros et vendors
- Cache Redis avec fallback mémoire
- Support pour > 50 vendors
- TTL configurable

```typescript
const manager = getWABAManager();

// Trouver vendor par numéro entrant
const result = await manager.findVendorByPhoneNumber("+221701111111");
// → { vendorId: "vendor_001", wabaInstance: {...} }

// Trouver par Wasender Instance ID
const result = await manager.findVendorByWasenderInstanceId("instance_abc");
// → { vendorId: "vendor_001", wabaInstance: {...} }
```

#### **VendorWasenderService** (`server/lib/vendor-wasender-service.ts`)
- Une instance par vendor
- Envoie messages WhatsApp
- Gère les statuts (livré, lu)
- Vérifie les signatures webhooks

```typescript
const service = new VendorWasenderService({
  vendorId: "vendor_001",
  apiKey: "api_key_xyz",
  instanceId: "instance_abc123"
});

// Envoyer un message
await service.sendMessage("+22170XXXXXX", "Bonjour!");

// Vérifier la signature webhook
const isValid = service.verifyWebhookSignature(signature, body);
```

#### **VendorWasenderRegistry** 
- Registre pour gérer les services par vendor
- Pattern singleton
- Lazy loading des configs

#### **Firebase WABA Integration** (`server/lib/firebase-waba.ts`)
- Persistence Firestore
- Requêtes : `findWABAByPhoneNumber`, `findWABAByWasenderInstanceId`, etc.
- Gestion CRUD pour les instances

---

### 3️⃣ **Webhooks Multi-Vendor**

#### **Routes** (`server/routes.ts` - Mises à jour)

```
POST /api/webhooks/wasender/:vendorId
├─ Reçoit les messages entrants
├─ Vérifie la signature avec le secret du vendor
├─ Route vers AlloPermet
└─ Envoie réponses automatiques (optionnel)

POST /api/webhooks/wasender/:vendorId/status
└─ Met à jour le statut des messages

POST /api/webhooks/wasender/:vendorId/connection
└─ Gère les événements de connexion

POST /api/admin/vendors/:vendorId/setup-wasender-webhook
└─ Configure automatiquement le webhook Wasender

GET /api/admin/vendors/:vendorId/wasender-status
└─ Retourne le statut actuel de l'instance
```

#### **Handlers** (`server/lib/vendor-wasender-webhooks.ts`)

```typescript
// Webhook messages entrants
handleVendorWasenderWebhook(req: Request, res: Response)

// Statut notifications
handleVendorWasenderStatus(req: Request, res: Response)

// Événements connexion
handleVendorWasenderConnection(req: Request, res: Response)
```

---

### 4️⃣ **Scripts de Migration**

#### **Migration Interactive** (`script/migrate-to-multi-waba.ts`)

```bash
# Mode interactif (configure vendor par vendor)
npx tsx script/migrate-to-multi-waba.ts

# Mode batch (depuis CSV)
npx tsx script/migrate-to-multi-waba.ts batch waba-migration.csv
```

**CSV Format:**
```csv
vendorId,businessName,phoneNumber,wasenderInstanceId,wasenderWebhookSecret,wasenderApiKey
vendor_001,My Shop A,+221701111111,instance_abc123,secret_123,api_key_abc
vendor_002,My Shop B,+221702222222,instance_def456,secret_456,api_key_def
```

Example fourni : `script/waba-migration-example.csv`

---

### 5️⃣ **Configuration .env**

Mis à jour `.env.example` avec documentation multi-WABA :

```env
# Wasender API - Multi-WABA Support
WASENDER_API_URL=https://api.wasenderapi.com/api/v1
WASENDER_API_KEY=your-wasender-master-api-key
REDIS_URL=redis://localhost:6379  # Pour cache > 50 vendors
```

**Configurations par vendor** : Stockées en Firestore, pas en .env

---

### 6️⃣ **Documentation Complète**

#### **MULTI_WABA_SETUP.md** (`docs/MULTI_WABA_SETUP.md`)
- ✅ Vue d'ensemble architecture "Before/After"
- ✅ Configuration par vendor (pas à pas)
- ✅ Flow des messages (entrants/sortants)
- ✅ Architecture du code
- ✅ Modèle de données Firestore
- ✅ Instructions de migration
- ✅ Sécurité (signatures, API keys)
- ✅ Scalabilité (Redis, perf)
- ✅ FAQ

#### **API_WABA_ENDPOINTS.md** (`docs/API_WABA_ENDPOINTS.md`)
- ✅ Tous les endpoints webhooks
- ✅ Endpoints admin
- ✅ Paramètres et exemples
- ✅ Responses / Error codes
- ✅ Examples cURL, JavaScript, Python
- ✅ Rate limiting
- ✅ Troubleshooting

---

## 🔄 Flow Complet: De l'entrant à la réponse

```
1. Client écrit à +221701111111 (numéro Vendor A)
   ↓
2. Wasender reçoit et envoie webhook
   ↓
3. POST /api/webhooks/wasender/vendor_001
   ├─ Paramètre URL identifie vendor_001
   ├─ Header X-Wasender-Signature = signature
   └─ Body JSON = message + metadata
   ↓
4. Server valide:
   ├─ Vendor existe ?
   ├─ Signature valide ? (crypto SHA256)
   └─ Message parsable ?
   ↓
5. Message routing:
   ├─ Parser: "Bonjour, je cherche..."
   ├─ Intent detection (via AlloPermet)
   └─ Route vers handler métier (products, orders, etc)
   ↓
6. AlloPermet génère réponse:
   └─ "Bonjour! Nos produits sont..."
   ↓
7. Envoyer via VendorWasenderService:
   ├─ Registry.getService(vendor_001)
   ├─ service.sendMessage("+22170xxx", message)
   └─ Wasender envoie depuis +221701111111
   ↓
8. Client reçoit message depuis leur numéro!
```

---

## 📊 Comparaison: Avant vs Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Numéro WhatsApp** | 1 numéro (centralisé) | 1 par vendor |
| **Clients reçoivent** | Generic +221705000505 | Numéro du vendor |
| **Routing** | Route dans app | Webhook URL identifie vendor |
| **Scalabilité** | Limite 1 numéro | > 50 vendors supportés |
| **Cache** | N/A | Redis (ou memory fallback) |
| **Config** | .env global | Firestore per-vendor |
| **Sécurité** | 1 secret global | Secret par vendor |
| **Failover** | Manual | Plugin-ready (failoverProvider) |

---

## 🚀 Prêts à Démarrer ?

### **Phase 1: Setup (Jour 1)**

1. **Vérifier Redis** dans `.env`
   ```bash
   echo $REDIS_URL
   # redis://localhost:6379
   ```

2. **Créer test WABA instance** en Firestore:
   ```json
   Collection: waba_instances
   Document: waba_vendor_001
   {
     "vendorId": "vendor_001",
     "phoneNumber": "+221701111111",
     "provider": "wasender",
     "wasenderInstanceId": "instance_test",
     "wasenderWebhookSecret": "secret_test_123",
     "status": "pending"
   }
   ```

3. **Tester webhook** local :
   ```bash
   curl -X POST http://localhost:9002/api/webhooks/wasender/vendor_001 \
     -H "Content-Type: application/json" \
     -H "X-Wasender-Signature: xxx" \
     -d '{"event":"message","data":{"from":"22170xxx","message":"Test"}}'
   ```

### **Phase 2: Migration Vendors (Jour 2-3)**

```bash
# Run migration script
npm run build  # If needed
npx tsx script/migrate-to-multi-waba.ts

# Pour chaque vendor:
# 1. Entrer ID, numéro, Wasender instance ID
# 2. Copier webhook URL dans Wasender
# 3. Tester la connexion
```

### **Phase 3: Monitoring (Ongoing)**

```bash
# Vérifier statuts
curl https://livepay.tech/api/admin/vendors/vendor_001/wasender-status

# Debugging
tail -f logs/webhook.log | grep "WABA\|vendor"
```

---

## ⚠️ Points Importants

1. **Redis est recommandé** pour > 50 vendors (performance)
2. **Secrets Wasender** : JAMAIS en .env, toujours en Firestore chiffré
3. **Webhook signature** : OBLIGATOIRE, vérifie via crypto SHA256
4. **Timeouts** : Max 5s traitement webhook
5. **Failover** : Ready pour Meta/Unipile (champ `failoverProvider`)

---

## 📚 Fichiers Modifiés/Créés

### Créés:
- ✅ `server/lib/waba-manager.ts` (Manager + cache)
- ✅ `server/lib/vendor-wasender-service.ts` (Service per-vendor)
- ✅ `server/lib/vendor-wasender-webhooks.ts` (Handlers webhooks)
- ✅ `server/lib/firebase-waba.ts` (Persistance Firestore)
- ✅ `script/migrate-to-multi-waba.ts` (Migration script)
- ✅ `docs/MULTI_WABA_SETUP.md` (Docs complètes)
- ✅ `docs/API_WABA_ENDPOINTS.md` (API reference)
- ✅ `script/waba-migration-example.csv` (CSV template)

### Modifiés:
- ✅ `shared/types.ts` (Nouveaux types WABAInstance)
- ✅ `server/routes.ts` (Nouveaux endpoints)
- ✅ `.env.example` (Exemple multi-WABA)
- ✅ `package.json` (Si besoin dépendances Redis)

---

## 🎓 Prochain Pas: Unipile

Si besoin de switch à Unipile plus tard :

```typescript
// Créer UnipileService similaire à VendorWasenderService
// Implémenter handler unipile-webhooks.ts
// Mettre à jour WABAManager pour supporter Unipile
// Changer provider dans WABAInstance de "wasender" → "unipile"
// ✅ Tout le reste reste identique!
```

---

## 📞 Support

Pour toute question:
- Docs: Voir `MULTI_WABA_SETUP.md` et `API_WABA_ENDPOINTS.md`
- Migration: `npm run build && npx tsx script/migrate-to-multi-waba.ts`
- Firestore: Collection `waba_instances`
- Tests: Voir exemples cURL dans `API_WABA_ENDPOINTS.md`

**Êtes-vous prêt à migrer tes vendors ? 🚀**
