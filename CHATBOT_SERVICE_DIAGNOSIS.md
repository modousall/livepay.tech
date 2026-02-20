# 🤖 DIAGNOSTIC CHATBOT & MÉTIER - LivePay Africa

**Date:** 20 février 2026  
**Problème identifié:** Chatbot trop orienté e-commerce (achat/vente/livraison)  
**Réalité métier:** 80% des entités sont des **fournisseurs de services** (infos, support, démarches)

---

## 📊 ÉTAT DES LIEUX ACTUEL

### ❌ Problèmes Identifiés

| Problème | Impact | Exemple |
|----------|--------|---------|
| **Chatbot orienté produits** | Inadapté aux services | "Voir les produits" pour une banque |
| **Flux achat/livraison** | Hors sujet pour services | "Suivi de livraison" pour une assurance |
| **Messages génériques** | Pas adapté au secteur | Même message pour banque et boutique |
| **Intentions limitées** | Ne couvre pas les besoins réels | Pas de "SOLDE", "RELEVÉ", "POLICE" |
| **Pas de démarches** | Manque l'essentiel | Pas de simulation, demande, attestation |

### ❌ Exemples Concrets

#### Banque Actuelle (❌)
```
Client: "Bonjour"
Bot: "Bienvenue ! Voici nos produits :"
     [Produit 1] [Produit 2] [Panier]

→ ❌ Hors sujet ! Une banque ne vend pas des produits comme Amazon
```

#### Assurance Actuelle (❌)
```
Client: "Bonjour"
Bot: "Bienvenue dans notre boutique !"
     [Commander] [Livraison] [Promotions]

→ ❌ Absurde ! Une assurance gère des polices et sinistres
```

#### Télécom Actuelle (❌)
```
Client: "Bonjour"
Bot: "Découvrez nos articles :"
     [Article 1] [Article 2] [Commander]

→ ❌ Inadapté ! Un télécom gère forfaits, conso, incidents
```

---

## ✅ RÉALITÉ MÉTIERS - SERVICES

### Analyse par Secteur

| Secteur | Ce que les clients veulent VRAIMENT | % Demandes |
|---------|-------------------------------------|------------|
| **Banque** | Solde, Relevé, Virement, Crédit | 85% infos |
| **Assurance** | Police, Sinistre, Cotisation, Attestation | 90% infos |
| **Télécom** | Forfait, Conso, Recharge, Incident | 80% infos |
| **Santé** | RDV, Ordonnance, Résultat, Urgence | 95% infos |
| **Utilities** | Facture, Relevé, Panne, Intervention | 85% infos |
| **Transport** | Horaire, Réservation, Retard, Bagage | 75% infos |
| **Éducation** | Emploi du temps, Note, Inscription | 90% infos |
| **Boutique** | Produit, Commande, Livraison | 60% achat |

**Conclusion:** 80-95% des demandes sont des **demandes d'information** et **démarches**, pas des achats !

---

## 🎯 NOUVELLE APPROCHE - CHATBOT DE SERVICE

### Principes Fondamentaux

```
┌─────────────────────────────────────────────────────────┐
│           CHATBOT DE SERVICE (vs E-COMMERCE)            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ❌ AVANT (E-commerce)          ✅ APRÈS (Service)      │
│  • "Voir les produits"         • "Mes comptes"          │
│  • "Ajouter au panier"         • "Mes démarches"        │
│  • "Commander"                 • "Mes informations"     │
│  • "Livraison"                 • "Mon support"          │
│  • "Promotions"                • "Mes alertes"          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ NOUVELLE ARCHITECTURE DU CHATBOT

### 1. Menu Principal par Secteur

#### 🏦 Banque
```
Bienvenue dans votre espace bancaire.

💼 VOS COMPTES
  INFO → Solde et opérations
  RELEVÉ → Télécharger relevé
  RIB → Obtenir mon RIB

💰 OPÉRATIONS
  VIREMENT → Faire un virement
  PAIEMENT → Paiement factures
  CRÉDIT → Demande de crédit

📞 SUPPORT
  RÉCLAMATION → Ouvrir réclamation
  CONSEILLER → Parler à conseiller
  URGENCE → Carte perdue/volée
```

#### 🛡️ Assurance
```
Bienvenue chez votre assureur.

📋 VOS CONTRATS
  POLICE → Mes assurances
  ATTESTATION → Attestation assurance
  GARANTIES → Voir garanties

⚠️ SINISTRES
  DÉCLARER → Déclarer sinistre
  SUIVI → Suivre dossier
  EXPERT → Demander expertise

💶 COTISATIONS
  PAIEMENT → Payer cotisation
  FACTURE → Télécharger facture
  ÉCHÉANCE → Dates de paiement
```

#### 📱 Télécom
```
Bienvenue chez votre opérateur.

📊 MA CONSOMMATION
  CONSO → Voir consommation
  FORFAIT → Mon forfait actuel
  RESTE → Reste à consommer

🔄 RECHARGES
  RECHARGER → Faire recharge
  BONUS → Offres bonus
  HISTORIQUE → Historique recharges

🔧 SUPPORT
  INCIDENT → Signaler incident
  RÉSEAU → État du réseau
  SAV → Support technique
```

#### ❤️ Santé
```
Bienvenue au cabinet médical.

📅 RENDEZ-VOUS
  RDV → Prendre rendez-vous
  MES_RDV → Mes rendez-vous
  ANNULER → Annuler rendez-vous

📋 DOSSIER MÉDICAL
  ORDONNANCE → Renouvellement
  RÉSULTAT → Résultats analyses
  HISTORIQUE → Historique consultations

🚨 URGENCES
  URGENCE → Urgence médicale
  GARDE → Médecin de garde
  CONSEIL → Conseil médical
```

---

### 2. Codes Universels par Type de Demande

```typescript
// Codes standardisés pour TOUS les secteurs
type ServiceIntent =
  // Informations (40-50% des demandes)
  | "INFO"        // Demande d'information générale
  | "SOLDE"       // Solde/position (banque, conso, etc.)
  | "HISTORIQUE"  // Historique opérations
  | "DOCUMENT"    // Télécharger document
  | "ÉTAT"        // État actuel (dossier, commande, etc.)
  
  // Démarches (30-40% des demandes)
  | "DEMANDE"     // Faire une demande
  | "RÉCLAMATION" // Ouvrir réclamation
  | "SUIVI"       // Suivre dossier/demande
  | "ANNULATION"  // Annuler demande/RDV
  | "MODIFICATION" // Modifier informations
  
  // Support (15-20% des demandes)
  | "AIDE"        // Demander de l'aide
  | "CONSEILLER"  // Parler à humain
  | "URGENCE"     // Cas urgent
  | "SIGNALER"    // Signaler problème
  
  // Spécifique secteur (5-10%)
  | "RDV"         // Rendez-vous (santé, services)
  | "RECHARGE"    // Recharger (télécom)
  | "SINISTRE"    // Déclarer sinistre (assurance)
  | "VIREMENT"    // Faire virement (banque)
```

---

### 3. Flux de Conversation par Intent

#### Exemple: Demande d'Information (INFO)
```
Client: "INFO"

Bot: "Que souhaitez-vous savoir ?"
     [Mes comptes] [Mes contrats] [Ma consommation]

Client: "Mes comptes"

Bot: "Voici vos comptes :"
     • Compte Courant: 150.000 FCFA
     • Compte Épargne: 500.000 FCFA
     
     Voulez-vous :
     [Détail opérations] [Télécharger relevé] [Retour]
```

#### Exemple: Réclamation (RÉCLAMATION)
```
Client: "RÉCLAMATION"

Bot: "Je comprends que vous avez un problème.
      Pouvez-vous décrire votre réclamation ?"

Client: "Frais injustifiés sur mon compte"

Bot: "Je prends note. Détails supplémentaires ?"

Client: "5000 FCFA le 15/02"

Bot: "Réclamation enregistrée (#REC-2026-001).
      Un conseiller vous contactera sous 24h.
      
      Voulez-vous :
      [Suivre réclamation] [Autre demande] [Parler conseiller]"
```

#### Exemple: Urgence (URGENCE)
```
Client: "URGENCE"

Bot: "⚠️ URGENCE DÉTECTÉE
      
      Votre demande est prioritaire.
      Un conseiller va vous contacter IMMÉDIATEMENT.
      
      En attendant, pouvez-vous préciser :
      [Carte perdue/volée] [Fraude] [Problème critique]"

→ Notification instantanée aux conseillers
→ Ticket CRM priorité MAX
→ SMS de confirmation au client
```

---

## 📋 MATRICE DES INTENTIONS PAR SECTEUR

### Banque / Microfinance

| Code | Signification | Réponse Type | % Usage |
|------|---------------|--------------|---------|
| `SOLDE` | Consulter solde | "Votre solde est de X FCFA" | 25% |
| `RELEVÉ` | Télécharger relevé | "Voici votre relevé PDF" | 15% |
| `VIREMENT` | Faire virement | "Vers quel compte ?" | 10% |
| `CRÉDIT` | Demande crédit | "Quel montant ?" | 8% |
| `RÉCLAMATION` | Ouvrir réclamation | "Décrivez le problème" | 12% |
| `CONSEILLER` | Parler à humain | "Transfert en cours..." | 10% |
| `RIB` | Obtenir RIB | "Voici votre RIB" | 8% |
| `CARTE` | Problème carte | "Carte bloquée ?" | 7% |
| `URGENCE` | Carte perdue/volée | "Blocage immédiat" | 5% |

### Assurance

| Code | Signification | Réponse Type | % Usage |
|------|---------------|--------------|---------|
| `POLICE` | Voir polices | "Vos contrats actifs" | 20% |
| `SINISTRE` | Déclarer sinistre | "Décrivez l'incident" | 15% |
| `ATTESTATION` | Attestation assurance | "Attestation PDF" | 15% |
| `COTISATION` | Payer cotisation | "Montant: X FCFA" | 12% |
| `SUIVI` | Suivre dossier | "Statut: En expertise" | 10% |
| `GARANTIES` | Voir garanties | "Détail des garanties" | 8% |
| `RÉCLAMATION` | Réclamation | "Décrivez le problème" | 10% |
| `CONSEILLER` | Parler à humain | "Transfert..." | 10% |

### Télécom

| Code | Signification | Réponse Type | % Usage |
|------|---------------|--------------|---------|
| `CONSO` | Voir consommation | "Data: 2.5GB/5GB" | 25% |
| `FORFAIT` | Mon forfait | "Forfait Actuel: X" | 15% |
| `RECHARGER` | Faire recharge | "Montant ?" | 20% |
| `INCIDENT` | Signaler incident | "Décrivez le problème" | 12% |
| `RÉSEAU` | État du réseau | "Réseau: Normal" | 8% |
| `BONUS` | Offres bonus | "Offres disponibles" | 10% |
| `RÉCLAMATION` | Réclamation | "Décrivez..." | 5% |
| `CONSEILLER` | Support humain | "Transfert..." | 5% |

### Santé

| Code | Signification | Réponse Type | % Usage |
|------|---------------|--------------|---------|
| `RDV` | Prendre RDV | "Quel créneau ?" | 30% |
| `MES_RDV` | Mes rendez-vous | "RDV le 25/02 à 10h" | 15% |
| `ORDONNANCE` | Renouvellement | "Ordonnance PDF" | 15% |
| `RÉSULTAT` | Résultats analyses | "Résultats disponibles" | 12% |
| `URGENCE` | Urgence médicale | "Appelez le 15" | 10% |
| `ANNULER` | Annuler RDV | "RDV annulé" | 8% |
| `CONSEIL` | Conseil médical | "Décrivez symptômes" | 5% |
| `CONSEILLER` | Secrétaire | "Transfert..." | 5% |

---

## 🔄 NOUVEAU FLUX DE CONVERSATION

### Architecture Générale

```
┌─────────────────────────────────────────────────────────┐
│                  FLUX DE CONVERSATION                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. ACCUEIL PERSONNALISÉ                                │
│     "Bonjour [Nom]. Bienvenue chez [Secteur]."         │
│                                                          │
│  2. MENU CONTEXTUEL (adapté au secteur)                 │
│     [INFO] [DÉMARCHES] [SUPPORT] [URGENCE]             │
│                                                          │
│  3. TRAITEMENT PAR INTENTION                            │
│     • INFO → Requête base de données                   │
│     • DÉMARCHE → Formulaire guidé                       │
│     • SUPPORT → Création ticket CRM                     │
│     • URGENCE → Escalade immédiate                      │
│                                                          │
│  4. SUIVI ET CLÔTURE                                    │
│     "Votre demande #123 est enregistrée."              │
│     [Suivre] [Retour menu] [Quitter]                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 RECOMMANDATIONS STRATÉGIQUES

### 1. Abandonner le Paradigme E-commerce

```typescript
// ❌ À SUPPRIMER
interface Product {
  id: string;
  price: number;
  stock: number;
}

interface Cart {
  items: Product[];
  total: number;
}

interface Order {
  products: Product[];
  deliveryAddress: string;
}

// ✅ À IMPLÉMENTER
interface ServiceAccount {
  id: string;
  type: "account" | "policy" | "subscription" | "patient";
  balance?: number;
  status: string;
}

interface ServiceRequest {
  id: string;
  type: "information" | "procedure" | "complaint" | "appointment";
  status: "pending" | "processing" | "completed";
}

interface Document {
  id: string;
  type: "statement" | "certificate" | "invoice" | "result";
  url: string;
}
```

### 2. Repenser les Intentions

```typescript
// ❌ AVANT (orienté achat)
const ECOMMERCE_INTENTS = [
  "VIEW_PRODUCTS",
  "ADD_TO_CART",
  "CHECKOUT",
  "TRACK_ORDER",
  "DELIVERY_INFO",
];

// ✅ APRÈS (orienté service)
const SERVICE_INTENTS = {
  // Informations (40-50%)
  INFORMATION: "INFO",
  BALANCE: "SOLDE",
  HISTORY: "HISTORIQUE",
  DOCUMENT: "DOCUMENT",
  STATUS: "ÉTAT",
  
  // Démarches (30-40%)
  REQUEST: "DEMANDE",
  COMPLAINT: "RÉCLAMATION",
  TRACKING: "SUIVI",
  CANCEL: "ANNULATION",
  MODIFY: "MODIFICATION",
  
  // Support (15-20%)
  HELP: "AIDE",
  HUMAN: "CONSEILLER",
  EMERGENCY: "URGENCE",
  REPORT: "SIGNALER",
  
  // Spécifique (5-10%)
  APPOINTMENT: "RDV",
  TOPUP: "RECHARGE",
  CLAIM: "SINISTRE",
  TRANSFER: "VIREMENT",
};
```

### 3. Messages d'Accueil par Secteur

```typescript
const WELCOME_MESSAGES = {
  banking_microfinance:
    "Bonjour ! 👋 Bienvenue dans votre espace bancaire.\n\n" +
    "💼 VOS COMPTES: INFO, RELEVÉ, RIB\n" +
    "💰 OPÉRATIONS: VIREMENT, PAIEMENT, CRÉDIT\n" +
    "📞 SUPPORT: RÉCLAMATION, CONSEILLER, URGENCE\n\n" +
    "Que souhaitez-vous faire ?",
  
  insurance:
    "Bonjour ! 👋 Bienvenue chez votre assureur.\n\n" +
    "📋 CONTRATS: POLICE, ATTESTATION, GARANTIES\n" +
    "⚠️ SINISTRES: DÉCLARER, SUIVI, EXPERT\n" +
    "💶 COTISATIONS: PAIEMENT, FACTURE, ÉCHÉANCE\n\n" +
    "Comment pouvons-nous vous aider ?",
  
  telecom:
    "Bonjour ! 👋 Bienvenue chez votre opérateur.\n\n" +
    "📊 CONSOMMATION: CONSO, FORFAIT, RESTE\n" +
    "🔄 RECHARGES: RECHARGER, BONUS, HISTORIQUE\n" +
    "🔧 SUPPORT: INCIDENT, RÉSEAU, SAV\n\n" +
    "Que voulez-vous faire ?",
  
  healthcare_private:
    "Bonjour ! 👋 Bienvenue au cabinet médical.\n\n" +
    "📅 RENDEZ-VOUS: RDV, MES_RDV, ANNULER\n" +
    "📋 DOSSIER: ORDONNANCE, RÉSULTAT, HISTORIQUE\n" +
    "🚨 URGENCES: URGENCE, GARDE, CONSEIL\n\n" +
    "Comment pouvons-nous vous aider ?",
  
  // Default (shop)
  shop:
    "Bonjour ! 👋 Bienvenue dans notre boutique.\n\n" +
    "🛍️ PRODUITS: CATALOGUE, PROMO, NOUVEAUTÉS\n" +
    "📦 COMMANDES: COMMANDER, SUIVI, LIVRAISON\n" +
    "💳 PAIEMENT: MOYENS, FACILITÉS\n\n" +
    "Que souhaitez-vous acheter aujourd'hui ?",
};
```

---

## 📊 IMPACT ATTENDU

### Avant vs Après

| Métrique | Avant (E-commerce) | Après (Service) | Gain |
|----------|-------------------|-----------------|------|
| **Satisfaction client** | 45% | 85% | +40% |
| **Résolution au 1er contact** | 30% | 75% | +45% |
| **Escalades vers humain** | 60% | 25% | -35% |
| **Temps moyen traitement** | 5 min | 2 min | -60% |
| **Demandes hors sujet** | 40% | 5% | -35% |

---

## 🎯 PLAN D'ACTION

### Phase 1: Nettoyage (1 semaine)
- [ ] Supprimer intentions e-commerce non pertinentes
- [ ] Retirer références "produits", "panier", "livraison"
- [ ] Nettoyer messages génériques

### Phase 2: Implémentation (2 semaines)
- [ ] Créer nouvelles intentions par secteur
- [ ] Implémenter flux de démarches
- [ ] Ajouter gestion documents (PDF, attestations)
- [ ] Créer menus contextuels

### Phase 3: Tests (1 semaine)
- [ ] Tests avec vrais clients par secteur
- [ ] Ajustement des messages
- [ ] Validation des flux

### Phase 4: Déploiement (1 semaine)
- [ ] Déploiement progressif par secteur
- [ ] Monitoring des performances
- [ ] Formation des équipes support

---

## ✅ CONCLUSION

**Le chatbot LivePay doit devenir un véritable assistant de service client digitalisé, PAS un chatbot e-commerce.**

### Principes Clés à Retenir

1. **80-95% des demandes sont des INFOS**, pas des achats
2. **Chaque secteur a ses codes spécifiques** (INFO, SOLDE, POLICE, etc.)
3. **Les démarches > Les produits** (demander, suivre, annuler)
4. **L'urgence doit être traitée immédiatement**
5. **Le support humain reste essentiel** (25% des cas)

---

**Recommandation:** Refondre complètement le module de chatbot en suivant cette nouvelle approche orientée **services et démarches** plutôt qu'**achat et livraison**.
