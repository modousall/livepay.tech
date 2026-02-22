# 🧪 Guide de Test - Flux de Commande WhatsApp

**Objectif:** Vérifier que les messages de code de commande sont correctement relayés via Wasender

---

## 1️⃣ PRÉ-REQUIS

### Configurations Firestore requises

```javascript
// Collection: vendor_configs
// Document exemple:
{
  vendorId: "vendor_001",
  businessName: "Ma Boutique",
  
  // ✅ OBLIGATOIRE pour Wasender:
  wasenderAccessToken: "votre_api_key_wasender",
  wasenderApiUrl: "https://api.wasenderapi.com/api/v1",
  wasenderInstanceId: "instance_abc123",
  wasenderWebhookSecret: "secret_xyz789",
  
  // Meta WhatsApp (optionnel)
  whatsappPhoneNumberId: "...",
  whatsappAccessToken: "...",
  
  // Autres champs
  status: "active",
  mobileMoneyNumber: "+221705555555",
  ...
}
```

---

## 2️⃣ TEST #1: VÉRIFIER LA CONFIGURATION

### Via Firestore Console

```bash
# 1. Aller à https://console.firebase.google.com
# 2. Sélectionner votre projet
# 3. Firestore Database
# 4. Collection "vendor_configs"
# 5. Vérifier que votre vendor a:
#    ✅ vendorId
#    ✅ wasenderAccessToken (pas vide)
#    ✅ wasenderApiUrl (doit être https://api.wasenderapi.com/api/v1)
```

### Via Code (Console du navigateur)

```javascript
// Dans un terminal avec Firebase CLI
firebase console

// Ou via code client:
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./lib/firebase";

async function checkVendorConfig(vendorId) {
  const q = query(
    collection(db, "vendor_configs"),
    where("vendorId", "==", vendorId)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log("❌ CONFIG NOT FOUND!");
    console.log("   Cherche dans la collection: 'vendor_configs'");
    console.log("   Avec vendorId:", vendorId);
    return;
  }
  
  const config = snapshot.docs[0].data();
  
  console.log("✅ CONFIG FOUND:");
  console.log("   vendorId:", config.vendorId);
  console.log("   businessName:", config.businessName);
  console.log("   wasenderAccessToken:", config.wasenderAccessToken ? "✅ présent" : "❌ MANQUANT");
  console.log("   wasenderApiUrl:", config.wasenderApiUrl || "❌ MANQUANT");
  console.log("   wasenderInstanceId:", config.wasenderInstanceId || "optionnel");
  console.log("   Status:", config.status);
}

// Appel:
// await checkVendorConfig("vendor_001");
```

---

## 3️⃣ TEST #2: TESTER L'API WASENDER MANUELLEMENT

### Test curl

```bash
# 1. Remplacer YOUR_API_KEY et YOUR_PHONE_NUMBER

curl -X POST https://api.wasenderapi.com/api/v1/message/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_API_KEY",
    "to": "221701111111",
    "message": "Test message de LivePay"
  }'

# Réponse attendue:
# {
#   "success": true,
#   "messageId": "msg_12345",
#   "status": "success"
# }

# Si statut error:
# {
#   "success": false,
#   "error": "Invalid token" // ou autre erreur
# }
```

### Test via Code Node.js

```javascript
const send = async () => {
  const config = {
    token: "YOUR_WASENDER_API_KEY",
    to: "221701111111",
    message: "Test message"
  };

  try {
    const response = await fetch("https://api.wasenderapi.com/api/v1/message/sendText", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });

    const result = await response.json();
    console.log("✅ API Response:", result);

    if (!result.success) {
      console.error("❌ API Error:", result.error);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
};

await send();
```

---

## 4️⃣ TEST #3: TESTER LE WEBHOOK ENTRANT WASENDER

### Simuler un webhook entrant

```bash
# 1. Récupérer le secret du webhook
VENDOR_ID="vendor_001"
WEBHOOK_SECRET="votre_webhook_secret_depuis_firestore"

# 2. Créer le payload
PAYLOAD='{"event":"message","data":{"from":"221705555555","message":"Bonjour, je veux commander","type":"text","id":"msg_123","time":1708000000}}'

# 3. Générer la signature HMAC-SHA256
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# 4. Envoyer au webhook
curl -X POST http://localhost:9002/api/webhooks/wasender/$VENDOR_ID \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$PAYLOAD"

# Réponse attendue: 200 OK avec {"success": true}
```

### Via Code JavaScript

```javascript
import crypto from 'crypto';

const testWebhook = async (vendorId, webhookSecret) => {
  const payload = {
    event: "message",
    data: {
      from: "221705555555",
      message: "Comando test",
      type: "text",
      id: "msg_test_123",
      time: Math.floor(Date.now() / 1000)
    }
  };

  // Générer signature
  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadString)
    .digest('hex');

  try {
    const response = await fetch(
      `http://localhost:9002/api/webhooks/wasender/${vendorId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wasender-Signature": signature
        },
        body: payloadString
      }
    );

    const result = await response.json();
    console.log("✅ Webhook Response:", result);
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
  }
};

// Appel:
// await testWebhook("vendor_001", "votre_webhook_secret");
```

---

## 5️⃣ TEST #4: VÉRIFIER LES LOGS EN TEMPS RÉEL

### Firebase Functions Logs

```bash
# Voir les logs en direct des Cloud Functions
firebase functions:log --follow

# Ou voir les logs d'une fonction spécifique
firebase functions:log --limit 100
```

### Logs à chercher

✅ **BON flux (message reçu et envoyé):**
```
[VENDOR WASENDER WEBHOOK] Received - vendorId: vendor_001, event: message
[Vendor Wasender] Message signature verified
[VENDOR MESSAGE PROCESS] Starting - vendorId: vendor_001, from: 221705555555
[Vendor MESSAGE PROCESS] Orchestrator called
[Wasender] Message sent: msg_12345
[VENDOR MESSAGE PROCESS] Completed
```

❌ **MAUVAIS flux (configuration manquante):**
```
[VENDOR WASENDER WEBHOOK] Received - vendorId: vendor_001
[Vendor Wasender] Message signature verified
[VENDOR MESSAGE PROCESS] Starting
[Wasender] Configuration manquante  ← PROBLÈME ICI
```

❌ **PIRE scenario (getVendorConfig retourne null):**
```
[VENDOR MESSAGE PROCESS] Starting - vendorId: vendor_001
[WhatsApp] Get vendor config error: Firestore operation error
← Signifie: Cherche dans la mauvaise collection
```

---

## 6️⃣ TEST #5: TESTER LE FLUX COMPLET MANUELLEMENT

### 1. Mettre en place Firestore Emulator (développement)

```bash
# Démarrer l'émulateur
firebase emulators:start

# Aller à http://localhost:4000 (Firestore Emulator UI)
```

### 2. Créer la configuration de vendor

```javascript
// Dans Firestore (via console ou code):
db.collection("vendor_configs").add({
  vendorId: "test_vendor",
  businessName: "Test Shop",
  wasenderAccessToken: "test_api_key",
  wasenderApiUrl: "https://api.wasenderapi.com/api/v1",
  wasenderWebhookSecret: "test_secret",
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### 3. Envoyer un webhook de test

```bash
# Générer la signature et envoyer (voir TEST #3)
curl -X POST http://localhost:9002/api/webhooks/wasender/test_vendor \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: test_signature" \
  -d '{"event":"message","data":{"from":"221705555555","message":"Test","type":"text","id":"msg_1","time":1708000000}}'
```

### 4. Vérifier les logs

```bash
# Voir les logs dans firebase emulators ou console du serveur
firebase serve
```

### 5. Vérifier Firestore

- ✅ Message sauvegardé dans `vendor_messages`
- ✅ Conversation créée dans `whatsapp_conversations`
- ✅ Réponse envoyée (si signature correcte)

---

## 7️⃣ RÉSOLUTION DES PROBLÈMES COURANTS

### ❌ "Configuration manquante"

```
Cause: wasenderAccessToken ou wasenderApiUrl est undefined

Solution:
1. Vérifier que getVendorConfig() cherche dans "vendor_configs" (pas "vendorConfigs")
2. Vérifier que le vendor_configs a les champs requis
3. Ajouter les logs manquants
```

### ❌ "Invalid signature"

```
Cause: HMAC-SHA256 ne correspond pas

Solution:
1. Vérifier que webhookSecret est correct dans Firestore
2. Vérifier que le payload n'a pas changé entre la signature et l'envoi
3. Vérifier l'encodage (hex vs base64)
```

### ❌ "API error from Wasender: Invalid token"

```
Cause: Token API Wasender invalide ou expiré

Solution:
1. Vérifier le token dans Firestore
2. Aller au dashboard Wasender et régénérer le token
3. Mettre à jour le token dans la config
4. Tester avec curl
```

### ❌ "Could not find vendor config"

```
Cause: getVendorConfig() retourne null

Solution:
1. Vérifier le nom de la collection: "vendor_configs" (pas "vendorConfigs")
2. Vérifier que la config a le champ "vendorId"
3. Vérifier que le vendorId passé correspond exactement
```

---

## 📊 CHECKLIST DE VÉRIFICATION

- [ ] Configuration Firestore existe dans `vendor_configs`
- [ ] Champs requis présents et remplis
- [ ] API Key Wasender valide (testé avec curl)
- [ ] Webhook Secret configuré
- [ ] Signature HMAC-SHA256 correcte
- [ ] Logs sans erreur
- [ ] Message arrive au client via WhatsApp
- [ ] Code de commande correctement formaté et envoyé

---

## 🎯 RÉSUMÉ DES CORRECTIFS APPLIQUÉS

✅ **Problème:** Collection Firestore mal nommée
✅ **Solution:** Tous les fichiers corrigés pour utiliser "vendor_configs"

🔧 **Fichiers modifiés:**
- server/lib/whatsapp-orchestrator.ts
- client/src/lib/firebase.ts
- client/src/lib/config-fix.ts
- client/src/lib/superadmin-demo.ts

📈 **Résultat attendu après redéploiement:**
✅ Les messages de code de commande seront maintenant relayés correctement via Wasender

