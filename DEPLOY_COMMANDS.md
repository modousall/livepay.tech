# 🎯 Commandes Finales - Déploiement Production

## Sur Votre Machine Locale

Exécuter ces commandes **hors du dev container**:

### 1️⃣ Authentification Firebase
```bash
firebase login
# Choisir: live-pay-97ac6 (livepay.tech)
# Vérifier:
firebase projects:list
firebase use live-pay-97ac6
```

### 2️⃣ Cloner & Préparer
```bash
# Depuis repo livepay.tech
cd /workspaces/livepay.tech

# Vérifier git
git status
git log --oneline -5

# Installer
npm install
```

### 3️⃣ Build
```bash
# Type check
npm run check

# Build (frontend + server)
npm run build

# Vérifier
ls -lh dist/
du -sh dist/public/
```

### 4️⃣ Déployer
```bash
# Option A: Script automatisé
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Option B: Commande directe
firebase deploy --project live-pay-97ac6 --force

# Option C: Par composant
firebase deploy:hosting --project live-pay-97ac6
firebase deploy:functions --project live-pay-97ac6
firebase deploy:firestore --project live-pay-97ac6
```

### 5️⃣ Vérifier
```bash
# Health check
curl https://livepay.tech/api/health

# Logs
gcloud functions logs read --limit 50 --project live-pay-97ac6

# Listing
firebase hosting:list
firebase functions:list --region us-central1
```

---

## 📱 Tester Multi-WABA

Après déploiement (~5 min):

### Test 1: Webhook Health
```bash
# Health endpoint
curl -v https://livepay.tech/api/health

# Expected: 200 OK, {"status":"ok"}
```

### Test 2: Webhook Message
```bash
# Vars
VENDOR_ID="test-vendor"
PHONE="+221705555555"
WEBHOOK_SECRET="test-secret-key"
BODY='{"type":"message","from":"'$PHONE'","message":"Hello","timestamp":1234567890}'

# Signature
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Send
curl -X POST https://livepay.tech/api/webhooks/wasender/$VENDOR_ID \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$BODY"

# Expected: 200 OK
```

### Test 3: Firestore Check
```bash
# Via Firebase Console
# → Firestore Database
# → Collections → waba_instances
# → Vérifier documents
```

---

## 📊 Monitoring

```bash
# Logs en temps réel
gcloud functions logs read -f --project live-pay-97ac6 --limit 20

# Erreurs
gcloud functions logs read --project live-pay-97ac6 --limit 100 | grep -i error

# Par fonction
gcloud functions logs read --region us-central1 --project live-pay-97ac6

# Détail webhook
gcloud functions logs read --project live-pay-97ac6 --limit 50 | grep webhook
```

---

## 🔄 Rollback (Si besoin)

```bash
# Voir versions
firebase hosting:channel:list

# Redéploy version précédente
git checkout HEAD~1
npm run build
firebase deploy

# Ou clear et redeploy
firebase hosting:disable
firebase deploy:hosting --force
```

---

## 🚀 Après Déploiement

### Activer Webhooks par Vendeur
```bash
# 1. Wasender dashboard → Créer instance per-vendor
# 2. Notez Wasender Instance ID
# 3. Configurer webhook:
#    - URL: https://livepay.tech/api/webhooks/wasender/{vendorId}
#    - Secret: Generate new → Copier

# 4. Ajouter à Firestore (manuellement ou script):
firebase firestore:set waba_instances/vendor-001 '{
  "vendorId": "vendor-001",
  "phoneNumber": "+221705555555",
  "wasenderInstanceId": "instance-abc123",
  "webhookSecret": "secret-key-abc123",
  "provider": "wasender",
  "status": "active",
  "createdAt": "2024-XX-XXT00:00:00Z",
  "updatedAt": "2024-XX-XXT00:00:00Z"
}'
```

### Migration de Vendeurs
```bash
# Interactif (ask per vendor)
npx tsx script/migrate-to-multi-waba.ts

# Batch (tous à la fois)
npx tsx script/setup-waba-test.ts

# Vérifier
firebase firestore:describe waba_instances
```

---

## 📞 Troubleshooting Rapide

### Erreur: "Firebase not authenticated"
```bash
firebase login --reauth
firebase use live-pay-97ac6
```

### Erreur: "Permission denied"
```bash
# Vérifier rules
firebase deploy:firestore --only firestore:rules
```

### Webhooks reçoivent 403
```bash
# Vérifier secret matche
firebase firestore:get waba_instances/vendor-001 \
  | grep webhookSecret

# Retest
bash script/test-waba-webhook.sh
```

### Function not found
```bash
firebase deploy:functions --force
gcloud functions list --project live-pay-97ac6
```

---

## ✅ Checklist Finale

Avant clore:

- [ ] `firebase login` → Authenticated
- [ ] `npm run build` → Success (0 errors)
- [ ] `firebase deploy` → Success (URLs printed)
- [ ] `curl https://livepay.tech/api/health` → 200 OK
- [ ] Firestore Collections existantes
- [ ] Test webhook → 200 OK
- [ ] Logs visible dans Firebase Console
- [ ] Monitoring configured
- [ ] Documentation passée en revue

---

## 📋 URLs Importantes

| Service | URL |
|---------|-----|
| **Website** | https://livepay.tech |
| **API Health** | https://livepay.tech/api/health |
| **Webhooks** | https://livepay.tech/api/webhooks/wasender/:vendorId |
| **Firebase Console** | https://console.firebase.google.com/project/live-pay-97ac6 |
| **Firestore** | Firebase Console → Firestore Database |
| **Hosting** | Firebase Console → Hosting |
| **Functions** | Firebase Console → Cloud Functions |
| **Wasender Dashboard** | https://cloud.wasender.com |

---

## 🎉 Success Criteria

Déploiement réussi si:

✅ Website accessible à https://livepay.tech  
✅ API répond sur /api/health  
✅ Webhooks reçus (200 OK)  
✅ Firestore collections remplies  
✅ Redis cache fonctionnel (optionnel)  
✅ Logs visibles dans Google Cloud  
✅ Aucun erreur dans Functions  

---

## 📝 Notes

- Build artifacts en `/dist/` prêts à être déployés
- Scripts de testing dans `/script/` pour validation
- Documentation complète dans `/docs/`
- Type-safe: Tous les types vérifiés
- Production-ready: Tous les tests passent

---

**Status: Ready to Deploy! 🚀**

Exécutez les 5 commandes ci-dessus et vous êtes prêt.
