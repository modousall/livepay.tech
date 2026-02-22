# 📚 Documentation - LivePay Multi-WABA

**Dernière mise à jour:** Février 2026  
**Version:** 2.0.0  
**Site:** https://livepay.tech

---

## 🚀 Guides Principaux

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| [DEPLOYMENT.md](./DEPLOYMENT.md) | **Guide complet de déploiement** | Déployer en production |
| [MULTI_WABA_SETUP.md](./MULTI_WABA_SETUP.md) | Architecture Multi-WABA | Comprendre l'architecture |
| [API.md](./API.md) | API générale | Développer des features |
| [API_WABA_ENDPOINTS.md](./API_WABA_ENDPOINTS.md) | API Multi-WABA | Intégrer webhooks WhatsApp |

---

## 🗄️ Base de Données

| Document | Description |
|----------|-------------|
| [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) | Schéma technique Firestore |
| [FIRESTORE_UI_GUIDE.md](./FIRESTORE_UI_GUIDE.md) | Guide pas à pas UI Firestore |

---

## 📖 Autres Documents

| Emplacement | Description |
|-------------|-------------|
| [README.md](../README.md) | Vue d'ensemble du projet |
| [DEVELOPMENT.md](../DEVELOPMENT.md) | Guide de développement local |
| [CHANGELOG_V3.md](../CHANGELOG_V3.md) | Historique des versions |
| [SECURITY.md](../SECURITY.md) | Politique de sécurité |
| [SECURITY_SETUP.md](../SECURITY_SETUP.md) | Configuration sécurité |
| [UI_IMPROVEMENTS_PHASE5.md](../UI_IMPROVEMENTS_PHASE5.md) | Améliorations UI |

---

## 📋 Quick Reference

### Commandes de Déploiement

```bash
# Build
npm run build

# Déployer
firebase deploy --project live-pay-97ac6

# Health check
curl https://livepay.tech/api/health
```

### Collections Firestore

- `waba_instances` - Configuration WABA par vendor
- `vendor_configs` - Configuration générale vendors
- `orders` - Commandes
- `products` - Produits
- `users` - Utilisateurs

### Endpoints Principaux

- `POST /api/webhooks/wasender/:vendorId` - Webhooks WhatsApp
- `GET /api/admin/vendors/:vendorId/wasender-status` - Statut vendor
- `POST /api/admin/vendors/:vendorId/setup-wasender-webhook` - Config webhook

---

## 🔗 Liens Utiles

| Service | URL |
|---------|-----|
| Firebase Console | https://console.firebase.google.com/project/live-pay-97ac6 |
| Wasender Dashboard | https://cloud.wasender.com |
| GitHub Repository | https://github.com/modousall/livetech |

---

## 📞 Support

- 📧 Email: contact@livepay.tech
- 🐛 Issues: [GitHub Issues](https://github.com/modousall/livetech/issues)
