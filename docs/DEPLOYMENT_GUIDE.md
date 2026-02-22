# 🚀 Guide Déploiement Production: Multi-WABA Wasender

## 📋 Checklist Déploiement

```
PHASE 1: Préparation (30 min)
☐ Vérifier le code TypeScript
☐ Builder le projet
☐ Tester en local production mode
☐ Vérifier les variables .env production

PHASE 2: Configuration Firebase (30 min)
☐ Mettre à jour firebase.json (webhooks)
☐ Configurer les Cloud Functions env vars
☐ Vérifier Firestore rules
☐ Vérifier Storage rules

PHASE 3: Déploiement (15 min)
☐ Build & deploy Frontend
☐ Deploy Cloud Functions (si besoin)
☐ Deploy Firestore rules
☐ Vérifier les logs

PHASE 4: Validation (15 min)
☐ Tester webhooks en production
☐ Vérifier les logs serveur
☐ Monitorer les erreurs
☐ Valider les données en Firestore
```

---

## 🔧 PHASE 1: Préparation

### 1️⃣ Vérifier le TypeScript

```bash
npm run check
```

✅ Devrait compiler sans erreurs

---

### 2️⃣ Builder pour la Production

```bash
npm run build
```

Vérifie:
- ✅ `dist/index.cjs` créé (serveur)
- ✅ `dist/public/` créé (frontend)

---

### 3️⃣ Variables d'Environnement Production

Créer `.env.production` (ou configurer dans Firebase):

```env
# === Production Server ===
NODE_ENV=production
PORT=9002
APP_HOST=https://livepay.tech
APP_DOMAIN=livepay.tech
APP_BASE_URL=https://livepay.tech

# === Wasender (Multi-WABA) ===
WASENDER_API_URL=https://api.wasenderapi.com/api/v1
WASENDER_API_KEY=your-master-api-key  # OU laisser vide (par vendor)

# === Redis (Cache pour > 50 vendors) ===
REDIS_URL=redis://your-redis-host:6379

# === Monitoring ===
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# === Firebase (auto-configuré par Cloud Functions) ===
# FIREBASE_PROJECT_ID=live-pay-97ac6
```

---

## 📝 PHASE 2: Configuration Firebase

### 1️⃣ Mettre à jour `firebase.json`

Ajouter les webhooks multi-WABA aux rewrites:

```json
{
  "hosting": [
    {
      "site": "live-pay-97ac6",
      "rewrites": [
        {
          "source": "/api/webhooks/wasender/:vendorId",
          "function": "wasenderWebhook"
        },
        {
          "source": "/api/webhooks/wasender/:vendorId/status",
          "function": "wasenderWebhookStatus"
        },
        {
          "source": "/api/webhooks/wasender/:vendorId/connection",
          "function": "wasenderWebhookConnection"
        },
        {
          "source": "/api/admin/vendors/:vendorId/setup-wasender-webhook",
          "function": "setupWasenderWebhook"
        },
        {
          "source": "/api/admin/vendors/:vendorId/wasender-status",
          "function": "getWasenderStatus"
        },
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

OU garder les endpoints sur le serveur Node.js existant (recommandé).

---

### 2️⃣ Configurer Firestore Rules

Ajouter règles pour la collection `waba_instances`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Règles existantes...
    
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

### 3️⃣ Vérifier Storage Rules

Pas de changement pour multi-WABA (fichiers/images existants).

---

## 🚀 PHASE 3: Déploiement

### Option A: Déployer tout (Frontend + Functions)

```bash
# 1. Build
npm run build

# 2. Deploy tout
npm run deploy:all
```

### Option B: Déployer par partie

```bash
# Juste le frontend
npm run deploy

# Juste les rules Firestore
npm run deploy:rules
```

---

## ✅ PHASE 4: Validation

### 1️⃣ Tester les Webhooks en Production

```bash
# Adapter le vendorId et les URLs pour production
bash script/test-waba-webhook.sh  # Modifier manuelle le base URL
```

OU créer un script spécial:

```bash
#!/bin/bash

VENDOR_ID="vendor_001"
API_BASE="https://livepay.tech"
WEBHOOK_SECRET="webhook_secret_xxx"

# Générer payload + signature
PAYLOAD='{"event":"message","data":{"from":"+221701111111","message":"Test"}}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/.*= //')

# Envoyer
curl -X POST "$API_BASE/api/webhooks/wasender/$VENDOR_ID" \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

### 2️⃣ Vérifier les Logs Serveur

```bash
# Via Firebase Console
# → Functions → Logs

# OU via gcloud CLI
gcloud functions logs read wasenderWebhook --limit 50
```

Chercher:
```
✅ [VENDOR WASENDER WEBHOOK] Received
✅ [VENDOR WASENDER WEBHOOK] Signature verified
✅ [VENDOR MESSAGE PROCESS] Starting
```

### 3️⃣ Vérifier Firestore

Aller à:
```
Firebase Console
→ Firestore Database
→ Collections: waba_instances
→ Vérifier les documents
```

### 4️⃣ Monitorer les Erreurs

```bash
# Firebase Console
→ Functions → Errors

# OU
gcloud functions logs read --limit 100 | grep ERROR
```

---

## 📊 Architecture Production

```
Client → Wasender
           ↓
    Webhook HTTPS
           ↓
    livepay.tech
           ↓
    /api/webhooks/wasender/:vendorId
           ↓
    Express Server (Node.js)
           ↓
    WABAManager (Redis cache)
           ↓
    VendorWasenderService
           ↓
    Firestore (waba_instances)
           ↓
    AlloPermet (message routing)
```

---

## 🔐 Sécurité Production

### HTTPS Obligatoire
- ✅ Firebase Hosting: HTTPS auto (gratuit)
- ✅ Certificats: Let's Encrypt (auto-renew)

### Validation des Webhooks
- ✅ HMAC-SHA256 signature par vendor
- ✅ Vérification dans `vendor-wasender-service.ts`
- ✅ Reject si signature invalide

### Rate Limiting
- ✅ Redis rate limiter (par vendor)
- ✅ Max 10 req/s par vendor
- ✅ Max 100 req/min global

### Variables Sensibles
- ✅ Webhook secrets en Firestore (chiffré)
- ✅ API keys en Cloud Functions env vars
- ✅ Jamais en .env distribué

---

## 🆘 Troubleshooting

### Webhooks ne sont pas reçus

```bash
# 1. Vérifier les logs
gcloud functions logs read --limit 20

# 2. Vérifier la URL
curl https://livepay.tech/api/health

# 3. Vérifier Firestore a la WABA instance
# Firebase Console → waba_instances
```

### Erreur "Signature invalid"

```bash
# Vérifier le webhook secret
# Configuration → Firebase Console
# Puis tester avec le bon secret

python3 script/test-signature.py
```

### Redis connection error

```bash
# Vérifier REDIS_URL
echo $REDIS_URL

# Si indisponible, fallback à memory cache
# Voir logs: "[WABA Manager] Redis not available"
```

### Firestore permission denied

```bash
# Vérifier les Firestore rules
# Ajouter règles pour waba_instances
# Voir ci-dessus section "Firestore Rules"
```

---

## 📈 Monitoring Production

### Stack Recommandé

1. **Firebase Console** (gratuit)
   - Functions logs
   - Firestore monitoring
   - Performance

2. **Sentry** (optional)
   ```env
   SENTRY_DSN=https://your-key@sentry.io/123456
   ```

3. **Datadog** (optional)
   - APM
   - Logs centralisés
   - Alertes

### Dashboards à Surveiller

- ✅ Webhook success rate
- ✅ Webhook latency (target: < 1s)
- ✅ Firestore read/write ops
- ✅ Redis cache hit rate
- ✅ Error rate par vendor

---

## 🎯 Résumé Déploiement

```bash
# 1. Vérifier code
npm run check

# 2. Build
npm run build

# 3. Deploy
npm run deploy:all

# 4. Test
curl https://livepay.tech/api/health

# 5. Monitor
gcloud functions logs read --limit 20
```

---

## 📞 Support Déploiement

Problèmes?
- Voir les logs: `gcloud functions logs read`
- Vérifier Firestore: `Firebase Console`
- Tester webhook: `bash script/test-waba-webhook.sh`

**Prêt à déployer?** 🚀
