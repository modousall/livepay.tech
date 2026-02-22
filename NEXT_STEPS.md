# 📋 Prochaines Étapes - Multi-WABA Production

## Phase 2: Activation Multi-WABA (Après Déploiement)

---

## 1️⃣ Configurer Wasender (1-2 jours)

### Pour **chaque vendeur**:

```bash
# 1. Créer WABA instance dans Wasender Dashboard
#    → https://cloud.wasender.com
#    → Créer nouvelle instance
#    → Obtenir: Instance ID, Webhook Secret

# 2. Configurer Webhook dans Wasender
#    URL: https://livepay.tech/api/webhooks/wasender/{vendorId}
#    Secret: Copier et sauvegarder

# 3. Créer document Firestore
firebase firestore:set waba_instances/vendor-001 '{
  "vendorId": "vendor-001",
  "phoneNumber": "+221705555555",
  "wasenderInstanceId": "waba_123456",
  "webhookSecret": "secret-key-here",
  "provider": "wasender",
  "status": "active",
  "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "updatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'
```

### Ou utiliser le script interactif:

```bash
# Mode interactif (demande infos pour chaque vendeur)
npx tsx script/migrate-to-multi-waba.ts

# Mode batch (si tous les vendeurs prêts)
npx tsx script/setup-waba-test.ts
```

---

## 2️⃣ Tester Webhooks en Production (1-2 jours)

### Test unitaire par vendeur:

```bash
# Générer signature de test
VENDOR_ID="vendor-001"
WEBHOOK_SECRET="secret-key-here"
BODY='{"type":"message","from":"+221701111111","message":"Test"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Envoyer webhook
curl -X POST https://livepay.tech/api/webhooks/wasender/$VENDOR_ID \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$BODY"

# Vérifier logs
gcloud functions logs read -f --project live-pay-97ac6 | grep -i $VENDOR_ID
```

### Vérifier dans Firestore:

```bash
# Consulter waba_instances collection
# Firebase Console → Firestore Database → waba_instances
# → Document {vendorId} → vérifier "status": "active"
```

---

## 3️⃣ Migrer Vendeurs (Selon besoin)

### Option A: Par vendeur (progressif)

```bash
# 1. Identifier vendeur
VENDOR_ID="vendor-abc"
PHONE="+221705555555"

# 2. Ajouter config Firestore
firebase firestore:set vendor_configs/$VENDOR_ID '{
  ...existing_fields,
  "wabaInstanceId": "waba-abc",
  "wabaProvider": "wasender"
}' --merge

# 3. Tester webhook
bash script/test-waba-webhook.sh
```

### Option B: Batch (tous à la fois)

```bash
# Migration script batch
npx tsx script/migrate-to-multi-waba.ts --batch

# Vérifier
firebase firestore:describe waba_instances
```

---

## 4️⃣ Monitoring Production (Continu)

### Health Check Quotidien

```bash
# 1. Vérifier site accessible
curl -I https://livepay.tech  # Doit retourner 200

# 2. Vérifier Firestore
firebase firestore:describe waba_instances  # Collections doivent exister

# 3. Vérifier functions
gcloud functions list --project live-pay-97ac6

# 4. Vérifier logs erreurs
gcloud functions logs read --project live-pay-97ac6 --limit 100 | grep ERROR
```

### Alertes à Configurer

```bash
# Erreurs webhooks > 5 en 5 min → Alert
# Firestore quota > 80% → Alert  
# Latency p99 > 2s → Alert
# Cloud Functions errors > 1% → Alert
```

---

## 5️⃣ Validation Complète (2-3 jours)

### Checklist:

- [ ] Wasender instances créées (1 par vendeur)
- [ ] Webhooks configurés dans Wasender
- [ ] Documents WABA en Firestore
- [ ] Tests webhooks réussis
- [ ] Logs production consultables
- [ ] Firestore quota OK
- [ ] Functions déployées sans erreur
- [ ] Domain livepay.tech accessible
- [ ] Frontend UI responsive
- [ ] Performance acceptée

---

## 📊 Timeline Estimée

| Étape | Estimation | Effort |
|-------|-----------|--------|
| 1. Configurer Wasender | 1-2 jours | Médium |
| 2. Tester Webhooks | 1-2 jours | Bas |
| 3. Migrer Vendeurs | 1 jour | Bas |
| 4. Monitoring | Continu | Minimal |
| **Total** | **3-5 jours** | |

---

## 🔧 Dépannage Courant

### Webhook ne reçoit pas de messages

```bash
# 1. Vérifier webhook secret matche
firebase firestore:get waba_instances/vendor-001 | grep webhookSecret

# 2. Vérifier URL correcte dans Wasender dashboard
# → /api/webhooks/wasender/vendor-001

# 3. Vérifier signature HMAC
bash script/test-waba-webhook.sh

# 4. Vérifier logs
gcloud functions logs read --limit 50 | grep vendor-001
```

### "CloudRun service doesn't exist"

```bash
# Cause: firebase.json pointe vers functions inexistantes
# Solution: Déjà corrigée - vérifier firebase.json
cat firebase.json | grep "function"

# Devrait être vide ou seulement resourceName
```

### Firestore quota dépassé

```bash
# Réduire writes:
# - Implémenter batch writes
# - Utiliser TTL indexes pour cleanup
# - Réduire fréquence logging

firebase firestore:bkup storage

# Augmenter quota dans Firebase Console
```

---

## 📞 Support

**Problème?** Cherchez dans:
1. `DEPLOYMENT_FINAL.md` - Guide production détaillé
2. `API_WABA_ENDPOINTS.md` - Endpoints reference
3. `FIRESTORE_SETUP_GUIDE.md` - Database schema

**Emergency?**
```bash
# Rollback à version précédente
git checkout HEAD~1
npm run build
firebase deploy
```

---

## ✨ Phase 3: Futures Améliorations

- [ ] AlloPermet integration (message routing)
- [ ] Dashboard analytics per-vendor
- [ ] Multi-media support (images, documents)
- [ ] Message templates
- [ ] Auto-responder
- [ ] Bulk messaging
- [ ] Advanced reporting

---

**Status:** 🟢 Production Ready

**Next:** Configure Wasender → Test Webhooks → Validate

Prêt? Commençons! 🚀
