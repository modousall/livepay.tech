# 🚀 Guide d'Intégration Wasender API - LivePay

## 📋 Vue d'ensemble

Ce guide vous explique comment intégrer **Wasender API** comme alternative à Meta WhatsApp Cloud API pour votre chatbot LivePay.

### Pourquoi Wasender?

| Avantage | Description |
|----------|-------------|
| ✅ **Pas d'approbation Meta** | Pas besoin de soumettre des templates pour approbation |
| ✅ **Messages illimités** | Aucune limitation du nombre de messages envoyés |
| ✅ **Multi-médias** | Images, vidéos, documents, audio, localisation |
| ✅ **Plusieurs instances** | Gérez plusieurs numéros WhatsApp |
| ✅ **Tarification simple** | Payez un abonnement fixe, pas à la conversation |
| ✅ **Support technique** | Assistance réactive en français |

---

## 🔧 Configuration Étape par Étape

### Étape 1: Créer un compte Wasender

1. Rendez-vous sur [https://wasenderapi.com](https://wasenderapi.com)
2. Cliquez sur **"S'inscrire"**
3. Remplissez le formulaire avec:
   - Email professionnel
   - Mot de passe sécurisé
4. Vérifiez votre email

### Étape 2: Créer une instance WhatsApp

1. Connectez-vous à votre dashboard Wasender
2. Cliquez sur **"Nouvelle Instance"**
3. Donnez un nom à votre instance (ex: `LivePay-Principal`)
4. Un QR code s'affiche

### Étape 3: Connecter WhatsApp

1. Ouvrez WhatsApp sur votre téléphone
2. Allez dans **Paramètres** → **Appareils connectés**
3. Cliquez sur **"Connecter un appareil"**
4. Scannez le QR code affiché sur Wasender
5. Attendez la confirmation de connexion

### Étape 4: Récupérer les identifiants API

Dans le dashboard Wasender:

1. Allez dans **Paramètres** → **API**
2. Notez:
   - **API Key** (ex: `wa_1234567890abcdef`)
   - **Instance ID** (ex: `inst_abc123`)
   - **API URL**: `https://api.wasenderapi.com/api/v1`

### Étape 5: Configurer LivePay

#### 5.1: Variables d'environnement

Ajoutez dans votre fichier `.env`:

```env
# Wasender API
WASENDER_API_KEY=wa_1234567890abcdef
WASENDER_API_URL=https://api.wasenderapi.com/api/v1
WASENDER_INSTANCE_ID=inst_abc123
```

#### 5.2: Déployer les Cloud Functions

```bash
cd Live-Commerce-Africa/functions

# Build
npm run build

# Déployer
firebase deploy --only functions
```

#### 5.3: Configurer le webhook WhatsApp

Dans le dashboard Wasender:

1. Allez dans **Webhooks**
2. Ajoutez l'URL de webhook:
   ```
   https://livepay.tech/api/webhooks/whatsapp-pro
   ```
3. Sélectionnez les événements:
   - ✅ Messages reçus
   - ✅ Statuts de livraison
   - ✅ Connexion/Déconnexion

---

## 🎯 Fonctionnalités Disponibles

### 1. Envoi de Messages Texte

```typescript
import { createWasenderService } from "./services/wasender";

const wasender = createWasenderService({
  apiKey: "your-api-key",
  apiUrl: "https://api.wasenderapi.com/api/v1",
  instanceId: "your-instance-id",
});

await wasender.sendText("221770000000", "Bonjour! Bienvenue chez LivePay!");
```

### 2. Envoi d'Images

```typescript
await wasender.sendImage(
  "221770000000",
  "https://example.com/product.jpg",
  "Super produit - 5000 FCFA"
);
```

### 3. Envoi de Documents

```typescript
await wasender.sendDocument(
  "221770000000",
  "https://example.com/catalog.pdf",
  "catalogue.pdf",
  "Notre catalogue complet"
);
```

### 4. Envoi de Localisation

```typescript
await wasender.sendLocation(
  "221770000000",
  14.6937, // Latitude (Dakar)
  -17.4441, // Longitude
  "Notre Boutique"
);
```

### 5. Broadcast (Messages en Masse)

```typescript
const phones = ["221770000000", "221770000001", "221770000002"];

const result = await wasender.sendBroadcast(
  phones,
  "🔥 VENTE FLASH! -20% sur tous les produits!\n\nCode: FLASH20",
  { delayMs: 1000 } // 1 seconde entre chaque message
);

console.log(`Succès: ${result.success}, Échecs: ${result.failed}`);
```

### 6. Envoi de Catalogue Produits

```typescript
const products = [
  {
    name: "Robe Wax Premium",
    price: 15000,
    description: "Magnifique robe en tissu Wax",
    imageUrl: "https://example.com/robe.jpg",
    keyword: "ROBE1",
  },
  {
    name: "Sac à Main",
    price: 10000,
    keyword: "SAC1",
  },
];

await wasender.sendProductCatalog(
  "221770000000",
  products,
  "Boutique Fashion"
);
```

### 7. Suivi de Statut de Commande

```typescript
await wasender.sendOrderStatus(
  "221770000000",
  {
    id: "CMD123",
    status: "shipped", // preparing, shipped, delivered
    total: 25000,
    products: [
      { name: "Robe Wax", quantity: 1 },
      { name: "Sac à Main", quantity: 1 },
    ],
  }
);
```

---

## 🔄 Flux de Messages LivePay avec Wasender

### Flux de Commande Standard

```
┌──────────────┐
│   Client     │
│  (WhatsApp)  │
└──────────────┘
       │
       │  1. Envoie "MENU"
       │─────────────────────────►
       │
       │  2. Reçoit menu interactif
       │     - 🛒 Nos Produits
       │     - 📋 Ma Commande
       │     - ℹ️ Informations
       │◄─────────────────────────┤ Wasender
       │
       │  3. Envoie "ROBE1"
       │─────────────────────────►
       │
       │  4. Reçoit info produit + image
       │     📦 Robe Wax Premium
       │     💰 15000 FCFA
       │     📊 5 disponibles
       │◄─────────────────────────┤
       │
       │  5. Envoie "2" (quantité)
       │─────────────────────────►
       │
       │  6. Ajouté au panier ✅
       │     Panier: 2 articles
       │     Total: 30000 FCFA
       │◄─────────────────────────┤
       │
       │  7. Envoie "COMMANDER"
       │─────────────────────────►
       │
       │  8. Crée commande + lien paiement
       │     ✅ Commandes Créées!
       │     💰 Total: 30000 FCFA
       │     👇 Cliquez pour payer
       │◄─────────────────────────┤
       │
       │  9. Paie via Wave
       │
       │  10. Upload preuve
       │─────────────────────────►
       │
       │  11. Vendeur vérifie
       │      Statut → Payé ✅
       │◄─────────────────────────┤
```

---

## 📊 Tableau des Commandes WhatsApp

| Commande | Description | Exemple |
|----------|-------------|---------|
| `MENU` | Afficher le menu principal | `MENU` |
| `AIDE` | Obtenir de l'aide | `AIDE` |
| `COMMANDES` | Voir ses commandes | `COMMANDES` |
| `PANIER` | Voir le panier | `PANIER` |
| `SOLDE` | Voir les promotions | `SOLDE` |
| `{CODE}` | Commander un produit | `ROBE1` |
| `{QUANTITÉ}` | Choisir quantité | `2` |
| `COMMANDER` | Finaliser commande | `COMMANDER` |
| `VIDER` | Vider le panier | `VIDER` |
| `PROMO {CODE}` | Appliquer code promo | `PROMO FLASH20` |

---

## 🎨 Messages Marketing avec Wasender

### 1. Annonce de Nouveau Produit

```typescript
await wasender.sendPromotion(
  "221770000000",
  {
    title: "✨ NOUVEAUTÉ",
    description: "Découvrez notre nouvelle collection de robes Wax!",
    imageUrl: "https://example.com/nouvelle-collection.jpg",
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
  }
);
```

### 2. Rappel de Panier Abandonné

```typescript
await wasender.sendText(
  "221770000000",
  `🛒 *Vous avez oublié quelque chose!*\n\n` +
  `Votre panier contient toujours:\n` +
  `• Robe Wax - 15000 FCFA\n` +
  `• Sac à Main - 10000 FCFA\n\n` +
  `Finalisez votre commande avant qu'il ne soit trop tard!\n\n` +
  `Envoyez *PANIER* pour reprendre.`
);
```

### 3. Message Post-Achat

```typescript
await wasender.sendText(
  "221770000000",
  `🎉 *Merci pour votre achat!*\n\n` +
  `Votre commande #CMD123 a été confirmée.\n\n` +
  `Nous vous tiendrons informé de l'avancement.\n\n` +
  `Besoin d'aide? Répondez simplement à ce message!`
);
```

---

## 🔐 Sécurité et Bonnes Pratiques

### 1. Gestion des Numéros

```typescript
// Toujours formater les numéros correctement
function formatPhone(phone: string): string {
  // Enlever tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, "");
  
  // Enlever le 0 initial si présent
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // Ajouter l'indicatif pays si manquant
  if (cleaned.length === 9) {
    cleaned = "221" + cleaned; // Sénégal
  }
  
  return cleaned;
}
```

### 2. Rate Limiting

```typescript
// Éviter le spam avec un délai entre les messages
async function sendWithDelay(
  wasender: WasenderService,
  phone: string,
  message: string,
  delayMs: number = 1000
) {
  await wasender.sendText(phone, message);
  await new Promise(resolve => setTimeout(resolve, delayMs));
}
```

### 3. Gestion des Erreurs

```typescript
try {
  const result = await wasender.sendText(phone, message);
  
  if (!result.success) {
    console.error(`Échec envoi à ${phone}: ${result.error}`);
    // Implémenter une logique de retry
  }
} catch (error) {
  console.error("Erreur Wasender:", error);
  // Fallback vers Meta WhatsApp API
}
```

---

## 📈 Statistiques et Suivi

### Dashboard Wasender

Le dashboard Wasender fournit:

- ✅ Nombre de messages envoyés
- ✅ Taux de délivrance
- ✅ Statut des instances
- ✅ Historique des conversations
- ✅ Logs d'erreurs

### Intégration avec LivePay Analytics

```typescript
// Dans votre dashboard LivePay
interface WhatsAppStats {
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  avgResponseTime: number;
  conversationsActive: number;
}

// Récupérer les stats via API Wasender
async function getWhatsAppStats(): Promise<WhatsAppStats> {
  const response = await axios.get(
    "https://api.wasenderapi.com/api/v1/stats",
    {
      headers: { "Authorization": `Bearer ${API_KEY}` }
    }
  );
  
  return response.data;
}
```

---

## 🆘 Support et Dépannage

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| QR code n'apparaît pas | Rafraîchir la page, vérifier la connexion |
| Messages non envoyés | Vérifier le statut de l'instance |
| API retourne 401 | Vérifier l'API Key dans `.env` |
| Messages en double | Vérifier le cache des conversations |

### Contacter le Support Wasender

- 📧 Email: support@wasenderapi.com
- 💬 Telegram: @wasendersupport
- 📚 Documentation: https://wasenderapi.com/docs

---

## 💰 Tarifs Wasender (Exemple)

| Plan | Prix/mois | Messages | Instances |
|------|-----------|----------|-----------|
| **Starter** | 29€ | Illimités | 1 |
| **Pro** | 59€ | Illimités | 3 |
| **Business** | 99€ | Illimités | 10 |
| **Enterprise** | Sur devis | Illimités | Illimité |

*Comparé à Meta: ~0.005€ par conversation × volume = économie significative*

---

## ✅ Checklist de Déploiement

- [ ] Compte Wasender créé
- [ ] Instance WhatsApp connectée
- [ ] API Key récupérée
- [ ] Variables `.env` configurées
- [ ] Cloud Functions déployées
- [ ] Webhook configuré chez Wasender
- [ ] Test d'envoi de message réussi
- [ ] Test de réception de message réussi
- [ ] Flux de commande testé
- [ ] Dashboard vendeur fonctionnel

---

## 🎉 Prêt!

Votre chatbot WhatsApp LivePay est maintenant propulsé par Wasender API!

**Prochaines étapes:**
1. Importer vos produits
2. Configurer vos numéros WhatsApp
3. Tester le flux complet
4. Lancer vos premiers lives commerce!

Pour toute question, contactez l'équipe LivePay.
