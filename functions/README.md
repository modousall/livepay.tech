# LivePay Cloud Functions

Firebase Cloud Functions pour le chatbot WhatsApp transactionnel LivePay.

## 📋 Fonctions Disponibles

### Webhooks

| Fonction | URL | Description |
|----------|-----|-------------|
| `whatsappWebhook` | `/api/webhooks/whatsapp` | Reçoit les messages WhatsApp de Meta |
| `whatsappWebhookVerify` | `/api/webhooks/whatsapp/verify` | Vérification du webhook par Meta |
| `paymentWebhook` | `/api/webhooks/payment` | Reçoit les confirmations de paiement Bictorys |
| `confirmPaymentManual` | `/api/payments/confirm` | Confirmation manuelle (admin/test) |

### Scheduled Functions

| Fonction | Fréquence | Description |
|----------|-----------|-------------|
| `expireOrders` | Toutes les minutes | Expire les commandes non payées et libère le stock |

### Firestore Triggers

| Fonction | Collection | Description |
|----------|------------|-------------|
| `onOrderCreated` | `orders` | Déclenché à la création d'une commande |
| `onOrderPaid` | `orders` | Déclenché quand une commande est payée |
| `onProductStockEmpty` | `products` | Déclenché quand le stock atteint zéro |
| `onUserDeleted` | `users` | Nettoyage à la suppression d'un utilisateur |

## 🚀 Installation

```bash
cd functions
npm install
```

## 🔧 Configuration

### Variables d'environnement

Configurer les secrets Firebase:

```bash
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN
firebase functions:secrets:set BICTORYS_WEBHOOK_SECRET
firebase functions:secrets:set APP_BASE_URL
```

### Webhook Meta (WhatsApp Business API)

1. Aller sur [Meta for Developers](https://developers.facebook.com/)
2. Configurer le webhook URL: `https://livepay.tech/api/webhooks/whatsapp`
3. Configurer le verify token (celui défini dans la config vendeur)
4. S'abonner aux événements `messages`

> **Note**: Pour la vérification initiale, Meta envoie un GET à `/api/webhooks/whatsapp`.
> Assurez-vous que la fonction `whatsappWebhookVerify` est correctement déployée.

### Webhook Bictorys (PSP)

1. Aller sur le dashboard Bictorys
2. Configurer le webhook URL: `https://livepay.tech/api/webhooks/payment`
3. Noter le webhook secret pour la vérification de signature

## 📦 Déploiement

```bash
# Build
npm run build

# Déployer toutes les fonctions
npm run deploy

# Ou via firebase CLI
firebase deploy --only functions
```

## 🧪 Test Local

```bash
# Démarrer l'émulateur Firebase
npm run serve

# Les fonctions seront disponibles sur http://localhost:5001
```

## 📊 Logs

```bash
# Voir les logs en direct
npm run logs

# Ou via firebase CLI
firebase functions:log --only whatsappWebhook
```

## 🔄 Flux WhatsApp Complet

```
Client envoie "ROBE1"
        ↓
whatsappWebhook reçoit le message
        ↓
Vérifie: Mode Live ON? Produit existe? Stock dispo?
        ↓
Envoie info produit + boutons quantité
        ↓
Client choisit quantité
        ↓
Envoie récap + boutons confirmation
        ↓
Client confirme
        ↓
createOrder() → Réserve stock + Crée commande
        ↓
Envoie lien de paiement
        ↓
Client paie
        ↓
paymentWebhook reçoit confirmation
        ↓
confirmOrderPayment() → Met à jour stock réel
        ↓
Envoie confirmation WhatsApp au client
```

## 📁 Structure

```
functions/
├── src/
│   ├── index.ts              # Point d'entrée
│   ├── config.ts             # Configuration et templates
│   ├── webhooks/
│   │   ├── whatsapp.ts       # Handler WhatsApp
│   │   └── payment.ts        # Handler paiement
│   ├── scheduled/
│   │   └── expireOrders.ts   # Cron expiration
│   ├── triggers/
│   │   └── orders.ts         # Firestore triggers
│   └── services/
│       ├── whatsapp.ts       # Service envoi WhatsApp
│       ├── orders.ts         # Service commandes
│       ├── notifications.ts  # Service notifications
│       └── payment.ts        # Service Bictorys
├── package.json
└── tsconfig.json
```

## ⚠️ Notes Importantes

- Les fonctions scheduled nécessitent le plan Blaze (pay-as-you-go)
- Le webhook WhatsApp doit répondre en < 20 secondes
- Les secrets sont chiffrés et non versionnés
- Tester avec l'émulateur avant de déployer en production
