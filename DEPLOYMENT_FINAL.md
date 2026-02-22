# 🚀 Guide de Déploiement Production - LivePay Multi-WABA

## Vue d'ensemble

Déploiement en production de l'architecture **Multi-WABA** pour LivePay sur Firebase, permettant à chaque vendeur (>50) d'avoir son propre numéro WhatsApp.

**URL cible**: `https://livepay.tech`  
**Architecture**: Firebase Hosting + Cloud Functions + Firestore  
**Temps estimé**: 10-15 minutes

---

## 📋 Checklist Pré-Déploiement

### Vérifications Locales
- [ ] `npm run check` - TypeScript clean
- [ ] `npm run build` - Build successful
- [ ] `npm run test` - Tests passing
- [ ] Git committed - All changes saved
- [ ] `.env` reviewed - Production values set

### Configurations Firebase
- [ ] `firestore.rules` updated with multi-WABA rules
- [ ] `firebase.json` configured with rewrites
- [ ] `firestore.indexes.json` with WABA indexes
- [ ] Service account JSON available locally
- [ ] Firebase Admin credentials in environment

### Données Firestore
- [ ] `waba_instances` collection created
- [ ] `vendor_configs` updated with `wabaInstanceId`
- [ ] Test WABA instance verified
- [ ] Redis connection tested (optional, but recommended)

---

## 🔑 Étape 1: Authentification Firebase

En machine locale (pas en dev container):

```bash
# Login avec votre compte Firebase
firebase login

# Vérifier authentification
firebase projects:list

# Sélectionner le projet
firebase use live-pay-97ac6
```

**Alternative (CI/CD)**:
```bash
# Utiliser token service account
firebase deploy --token "$FIREBASE_TOKEN"
```

---

## ✅ Étape 2: Vérifications Pré-Deploy

```bash
# Type-check
npm run check

# Build
npm run build

# Vérifier artifacts
ls -lh dist/
ls -lh dist/public/

# Quick test
npm run test
```

**Résultat attendu**:
```
dist/index.cjs              845 KB
dist/public/index.html      2.7 KB
dist/public/assets/         1.3 MB
```

---

## 🚀 Étape 3: Déploiement

### Option A: Script d'automatisation (Recommandé)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Option B: Commandes manuelles

```bash
# Deploy tout
firebase deploy --project live-pay-97ac6

# OU par composant
firebase deploy:hosting --project live-pay-97ac6
firebase deploy:functions --project live-pay-97ac6
firebase deploy:firestore --project live-pay-97ac6
```

**Sortie attendue**:
```
Hosting URL: https://livepay.tech
Functions deployed: api
Firestore rules deployed
Storage rules deployed
```

---

## 🔍 Étape 4: Post-Déploiement

### Vérification de santé

```bash
# Health check
curl https://livepay.tech/api/health

# Réponse attendue
{"status":"ok","timestamp":"2024-XX-XX"}
```

### Vérification Firestore

```bash
# Depuis Firebase Console
# Collections:
#   ✅ waba_instances
#   ✅ vendor_configs
#   ✅ orders
#   ✅ products
```

### Logs Cloud Functions

```bash
# Tail logs en temps réel
gcloud functions logs read -f --limit 50

# Erreurs
gcloud functions logs read --limit 100 | grep ERROR

# Webhooks
gcloud functions logs read --limit 50 | grep "webhook\|WABA"
```

### Logs Firebase Hosting

```bash
# Vérifier déploiement
firebase hosting:log --limit 100
```

---

## 🧪 Étape 5: Test Multi-WABA

### Test Webhook (Production)

```bash
# Générer signature test
VENDOR_ID="vendor-001"
WEBHOOK_SECRET="your-webhook-secret"
TIMESTAMP=$(date +%s)
BODY='{"type":"message","from":"+221123456789"}'

# Générer HMAC
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | cut -d' ' -f2)

# Envoyer webhook
curl -X POST https://livepay.tech/api/webhooks/wasender/$VENDOR_ID \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$BODY"

# Réponse attendue: 200 OK
```

### Vérifier Firestore

```bash
# Via Firebase Console
# → Firestore Database
# → Collection: waba_instances
# → Document: vendor-001
# → Voir dernière mise à jour
```

### Vérifier Redis Cache

```bash
# Si Redis configuré
redis-cli ping
redis-cli GET "vendor:phone:+221705000505"
# Réponse: "vendor-001"
```

---

## 📊 Architecture Multi-WABA Vérifiée

Après déploiement, vérifier:

```
Production: https://livepay.tech
├── Frontend
│   ├── Dashboard vendeur
│   ├── Settings Multi-WABA
│   └── Order Management
├── Backend Services
│   ├── WABAManager (Redis cache)
│   │   └── Phone → Vendor lookup O(1)
│   ├── VendorWasenderService
│   │   └── Per-vendor Wasender instance
│   ├── VendorWasenderWebhooks
│   │   ├── /api/webhooks/wasender/:vendorId
│   │   ├── /api/webhooks/wasender/:vendorId/status
│   │   └── /api/webhooks/wasender/:vendorId/connection
│   └── FirebaseWABA
│       └── Firestore persistence
├── Data Persistence
│   ├── Firestore Collection: waba_instances
│   ├── Firestore Collection: vendor_configs
│   └── Redis: phone→vendor mapping (1h TTL)
└── Webhooks
    └── Multi-vendor message routing
```

---

## ⚙️ Configuration Post-Déploiement

### 1. Configurer Wasender

Pour chaque vendeur:

```bash
# 1. Créer WABA instance dans Wasender dashboard
# 2. Nota le Wasender Instance ID
# 3. Configurer webhook: https://livepay.tech/api/webhooks/wasender/{vendorId}
# 4. Copier webhook secret (HMAC key)

# 5. Ajouter à Firestore via admin endpoint
curl -X POST https://livepay.tech/api/admin/vendors/vendor-001/setup-wasender-webhook \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "wasenderInstanceId": "instance-123",
    "phoneNumber": "+221705555555",
    "webhookSecret": "secret-key-123"
  }'
```

### 2. Migrer Vendeurs

```bash
# Script interactif pour migrer un vendeur
npx tsx script/migrate-to-multi-waba.ts

# Ou batch migration
npx tsx script/setup-waba-test.ts

# Résultat: Chaque vendeur a sa WABA instance
```

### 3. Activer Redis (Optionnel mais recommandé)

```env
# .env.production
REDIS_URL=redis://cache.c123.ng.0001.use1.cache.amazonaws.com:6379
REDIS_PASSWORD=your-password
REDIS_TTL=3600
```

---

## 🚨 Troubleshooting

### Erreur: "Failed to authenticate"

```bash
firebase login
firebase use live-pay-97ac6
```

### Erreur: "Permission denied" sur Firestore

```bash
# Vérifier rules
firebase deploy:firestore --only firestore:rules

# Ou importer rules
cat firestore.rules | firebase deploy:firestore --only firestore:rules
```

### Webhooks reçoivent 403

```bash
# Vérifier signature
./script/test-waba-webhook.sh

# Vérifier firestore WebHook secret matche
firebase console → waba_instances → check webhookSecret
```

### Fonction Cloud timeout

```bash
# Augmenter timeout
firebase.json:
{
  "functions": {
    "runtime": "nodejs18",
    "timeoutSeconds": 540
  }
}
```

### Redis connexion échouée

```bash
# Vérifier Redis disponible (optionnel)
redis-cli ping

# Si down, WABAManager fallback à mémoire
```

---

## 📈 Monitoring Production

### Dashboards

1. **Firebase Console**  
   https://console.firebase.google.com/project/live-pay-97ac6

2. **Cloud Functions**  
   `gcloud functions list --project live-pay-97ac6`

3. **Firestore**  
   Vérifier collections: `waba_instances`, `vendor_configs`

4. **Logs**
   ```bash
   gcloud functions logs read -f --project live-pay-97ac6 --limit 50
   ```

### Alertes Recommandées

- [ ] Webhook failures > 5 in 5min → Alert
- [ ] Function errors > 1% → Alert
- [ ] Firestore quota > 80% → Alert
- [ ] Latency p99 > 2s → Alert

### Commandes Utiles

```bash
# Tous les logs
gcloud functions logs read -f --project live-pay-97ac6

# Erreurs uniquement
gcloud functions logs read --project live-pay-97ac6 --limit 100 | grep -i error

# Webhooks
gcloud functions logs read --project live-pay-97ac6 --limit 50 | grep -i webhook

# Récent
gcloud functions logs read --project live-pay-97ac6 --limit 10
```

---

## 🔄 Rollback Procédure

Si déploiement fail:

```bash
# Voir history
firebase hosting:channel:list

# Rollback
firebase hosting:clone live-pay-97ac6:live oldVersion:live

# Ou redéploy la version précédente
git checkout HEAD~1
npm run build
firebase deploy
```

---

## ✨ Déploiement Réussi!

Une fois déployé, les vendeurs peuvent:

1. **Avoir leur propre numéro WhatsApp** ✅
2. **Recevoir messages directs via webhooks** ✅
3. **Tracker conversations** (Firestore logs) ✅
4. **Voir analytics** (dashboards) - Phase 2
5. **Envoyer messages** (dashboard → AlloPermet) - Phase 2

### URLs Importantes

| Service | URL |
|---------|-----|
| Website | https://livepay.tech |
| API Health | https://livepay.tech/api/health |
| Webhooks | https://livepay.tech/api/webhooks/wasender/:vendorId |
| Firebase Console | https://console.firebase.google.com |
| Wasender Dashboard | https://cloud.wasender.com |

---

## 📞 Support

Pour issues:

1. Vérifier logs: `gcloud functions logs read -f`
2. Consulter Firestore: Collections structure
3. Tester webhook localement: `bash script/test-waba-webhook.sh`
4. Vérifier Wasender status: Dashboard → Webhooks

**Contact**: Support@livepay.tech

---

*Déploiement Multi-WABA v2.0 - Production Ready*
