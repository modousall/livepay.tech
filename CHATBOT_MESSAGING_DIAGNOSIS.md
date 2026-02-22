# 🔍 Diagnostic - Messages de Commande WhatsApp Non Relayés via Wasender

**Date:** Février 2026  
**Problème:** Les messages de code de commande sur le numéro WhatsApp de l'entité ne sont pas relayés par Wasender. Aucun message n'est reçu.

---

## 🔴 PROBLÈMES IDENTIFIÉS ET CORRIGÉS

### ❌ **Problème 1: MISMATCH CRITIQUE - Noms de Collection Firestore Incohérents** ⚠️ **CAUSE PRINCIPALE**

**Le bug root cause découvert:**

| Composant | Collection | État |
|-----------|-----------|-------|
| `server/lib/firebase-waba.ts:14` | `"vendor_configs"` (définition) | ✓ OK |
| `server/lib/whatsapp-orchestrator.ts:660` (avant correction) | `"vendorConfigs"` (recherche) | ✗ **ERREUR** |
| `client/src/lib/firebase.ts` (avant correction) | `"vendorConfigs"` (création client) | ✗ **ERREUR** |
| `client/src/lib/config-fix.ts` (avant correction) | `"vendorConfigs"` (création) | ✗ **ERREUR** |
| `client/src/lib/superadmin-demo.ts` (avant correction) | `"vendorConfigs"` (CRUD) | ✗ **ERREUR** |

**Conséquence:**
```
1. Client crée la config dans: collection("vendorConfigs")
2. Serveur cherche la config dans: collection("vendor_configs") 
3. Résultat: getVendorConfig() retourne TOUJOURS NULL
4. Les champs wasenderAccessToken et wasenderApiUrl sont undefined
5. sendViaWasender() échoue silencieusement et retourne false
```

**✅ Solution appliquée:** Harmonisation de tous les noms de collection `"vendorConfigs"` → `"vendor_configs"`
- ✅ `server/lib/whatsapp-orchestrator.ts:660` 
- ✅ `client/src/lib/firebase.ts` (4 occurrences)
- ✅ `client/src/lib/config-fix.ts` (2 occurrences)
- ✅ `client/src/lib/superadmin-demo.ts` (3 occurrences)

---

## 🏗️ ARCHITECTURE DE FLUX - MESSAGES ENTRANTS À SORTANTS

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT ENVOIE MESSAGE DE COMMANDE @ +221701111111 (numéro vendor) │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ WASENDER WEBHOOK ENTRANT                                        │
│ POST /api/webhooks/wasender/:vendorId                          │
│ (vendor-wasender-webhooks.ts)                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ✅ Vérification signature
         ✅ Parsing du message entrant
         ✅ Sauvegarde en Firestore (vendor_messages)
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ ORCHESTRATEUR WHATSAPP                                          │
│ handleIncomingMessage() (whatsapp-orchestrator.ts)             │
│                                                                 │
│ 1. Sauvegarder message entrant                                  │
│ 2. Mettre à jour contexte conversation                          │
│ 3. Détecter intention (COMMANDE, SOLDE, etc.)                  │
│ 4. Générer réponse du chatbot (code commande, prix, etc.)      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ GÉNÉRATION RÉPONSE                                              │
│ generateResponse() 🎯 ICI: Code commande généré                │
│                                                                 │
│ Exemple: "Votre code: CMD-12345-XYZ"                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ ENVOI RÉPONSE                                                   │
│ sendOutboundMessage()                                           │
│                                                                 │
│ if primaryProvider == "meta":                                   │
│    → sendViaMeta()                                              │
│    → if fails && fallbackEnabled:                               │
│       → sendViaWasender()  🎯 ICI: LE PROBLÈME ÉTAIT          │
│ else:                                                           │
│    → sendViaWasender()                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ MÉTHODE PROBLÉMATIQUE: sendViaWasender()                        │
│                                                                 │
│ const vendorConfig = await this.getVendorConfig(vendorId)      │
│     ↓                                                           │
│ Si getVendorConfig() retourne NULL (🔴 BUG):                   │
│     ↓                                                           │
│ if (!vendorConfig?.wasenderAccessToken || ...)                 │
│     ↓                                                           │
│ return false  ❌ MESSAGE NON ENVOYÉ                            │
│                                                                 │
│ ✅ FIX: Maintenant getVendorConfig() cherche dans la bonne     │
│    collection "vendor_configs" et trouve la config              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ ENVOI VIA WASENDER API                                          │
│ POST {wasenderApiUrl}/message/sendText                         │
│                                                                 │
│ Payload:                                                        │
│ {                                                               │
│   "token": vendorConfig.wasenderAccessToken,                   │
│   "to": "22170...",                                             │
│   "message": "Votre code: CMD-12345-XYZ"                       │
│ }                                                               │
│                                                                 │
│ ✅ Réponse reçue                                                │
│ ✅ Code de commande livré au client                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST - VÉRIFICATIONS À EFFECTUER

### ✅ Base de Données
- [ ] Vérifier que les `vendor_configs` sont créées dans Firestore  
- [ ] Vérifier que chaque config a les champs:
  - [ ] `vendorId` (ID du vendor)
  - [ ] `wasenderAccessToken` (clé API Wasender)
  - [ ] `wasenderApiUrl` (URL API: `https://api.wasenderapi.com/api/v1`)
  - [ ] `wasenderInstanceId` (optionnel)
  - [ ] `wasenderWebhookSecret` (optionnel)

### ✅ Configuration Wasender
- [ ] Vérifier que l'API Key Wasender est valide et active
- [ ] Vérifier que l'instance Wasender est connectée (`status: "connected"`)
- [ ] Vérifier le numéro WhatsApp rangé en `waba_instances`
- [ ] Tester manuellement l'API Wasender:
```bash
curl -X POST https://api.wasenderapi.com/api/v1/message/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_API_KEY",
    "to": "221701111111",
    "message": "Test message"
  }'
```

### ✅ Firebase
- [ ] Logs vérifier les logs pour les erreurs:
```bash
# Voir les logs d'erreur de l'orchestrador
firebase functions:log --only sendViaWasender
```
- [ ] Vérifier que les messages entrants/sortants sont sauvegardés en Firestore
- [ ] Vérifier la collection `whatsapp_conversations` pour les contextes

### ✅ Collections Firestore Obligatoires
```
vendor_configs/
├── vendorId: string
├── businessName: string
├── wasenderAccessToken: string
├── wasenderApiUrl: string
├── wasenderInstanceId?: string
├── wasenderWebhookSecret?: string
└── [autres champs]

waba_instances/
├── vendorId: string  
├── phoneNumber: string
├── wasenderInstanceId: string
├── status: "connected" | "disconnected"
└── [autres champs]

vendor_messages/
├── vendorId: string
├── from: string
├── message: string
├── type: "text" | "image" | "document"
├── status: "received" | "sent" | "failed"
└── timestamp: Timestamp

whatsapp_conversations/
├── sessionId: string (vendorId_phoneNumber)
├── vendorId: string
├── clientPhone: string
├── messageCount: number
├── lastMessageAt: Timestamp
└── [contexte conversation]
```

---

## 🐛 LOGS À VÉRIFIER

Quand un message est reçu, chercher ces logs:

```bash
# 1. Message entrant via webhook Wasender
[VENDOR WASENDER WEBHOOK] Received - vendorId: vendor_001, event: message

# 2. Vérification signature
[Vendor Wasender] Message signature verified

# 3. Parsing du message
[VENDOR MESSAGE PROCESS] Starting - vendorId: vendor_001, from: 22170...

# 4. Appel orchestrator
[VENDOR MESSAGE PROCESS] Orchestrator called - vendorId: vendor_001

# 5. Envoi via Wasender (bon)
[Wasender] Message sent: msg_12345

# ❌ MAUVAIS - Chercher EXACT:
# "Configuration manquante" → Les champs wasenderAccessToken ou wasenderApiUrl sont undefined
# "Get vendor config error" → Erreur lors de la recherche de la config
# "getVendorConfig retourne null" → Cherchait dans la mauvaise collection
```

---

## 🔧 COMMANDES DE VÉRIFICATION

### Vérifier les configurations de vendor
```javascript
// Dans Firebase Console ou Firestore Emulator
db.collection("vendor_configs")
  .where("vendorId", "==", "YOUR_VENDOR_ID")
  .get()
  .then(snapshot => {
    if (snapshot.empty) console.log("❌ CONFIG NOT FOUND");
    else console.log("✅ CONFIG FOUND:", snapshot.docs[0].data());
  });
```

### Vérifier les messages reçus
```javascript
db.collection("vendor_messages")
  .where("vendorId", "==", "YOUR_VENDOR_ID")
  .orderBy("timestamp", "desc")
  .limit(5)
  .get()
  .then(snapshot => {
    console.log(`✅ ${snapshot.size} messages received`);
    snapshot.docs.forEach(doc => {
      console.log(`- From: ${doc.data().from}, Status: ${doc.data().status}`);
    });
  });
```

### Vérifier les conversations
```javascript
db.collection("whatsapp_conversations")
  .where("vendorId", "==", "YOUR_VENDOR_ID")
  .get()
  .then(snapshot => {
    console.log(`✅ ${snapshot.size} conversations`);
  });
```

---

## 📦 FICHIERS MODIFIÉS

### ✅ Déjà corrigés (cette session):
1. `server/lib/whatsapp-orchestrator.ts` - Collection "vendor_configs"
2. `client/src/lib/firebase.ts` - Collection "vendor_configs" (3 occurrences)
3.  `client/src/lib/config-fix.ts` - Collection "vendor_configs"
4. `client/src/lib/superadmin-demo.ts` - Collection "vendor_configs" (3 occurrences)

### 🔄 À tester/vérifier:
1. Données Firestore - configurations correctement créées
2. API Wasender - clés et tokens valides
3. Webhooks - signature correctement vérifiée
4. Logs - pas d'erreurs lors de l'envoi

---

## 🚀 PROCHAINES ÉTAPES

1. **Redéployer** le code avec les corrections
2. **Tester** en envoyant un message WhatsApp au numéro du vendor
3. **Vérifier les logs** pour voir si le message est traité
4. **Tester manuellement** l'API Wasender avec curl
5. **Simuler** un webhook Wasender entrant pour vérifier le flux complet

---

## 📞 CONTACTS/RESSOURCES

- **Wasender API Docs:** https://wasenderapi.com/docs
- **Firebase Firestore:** https://console.firebase.google.com
- **Test API:** Postman Collection (à créer)

---

**Status:** 🟡 En cours de test - Code corrigé, en attente de vérification
