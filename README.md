# 🚀 LIVE TECH - WhatsApp Business SaaS Platform

**Plateforme SaaS B2B pour digitaliser la relation client via WhatsApp Business**

[![GitHub](https://img.shields.io/badge/GitHub-modousall%2Flivetech-blue?logo=github)](https://github.com/modousall/livetech)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](package.json)

---

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)

---

## 🎯 Quick Start

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org))
- **npm** v10+
- **Supabase** account (free tier works)
- **Meta Developer Account** (WhatsApp Business API)

### 5-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/modousall/livetech.git
cd livetech

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your Supabase & WhatsApp credentials

# 4. Start development server
npm run dev

# 5. Open browser
# Visit: http://localhost:9002
```

---

## ✨ Features

### 💬 **Conversations WhatsApp**
- Interface unifiée pour toutes les conversations clients
- Historique complet des messages
- Assignment aux agents
- Escalade bot → agent humain

### 🤖 **Bot Intelligent**
- Réponses automatiques par mots-clés
- Scénarios de conversation configurables sans code
- Triggers intelligents
- Flux de conversation multi-étapes

### 📊 **Statistiques Temps Réel**
- Temps de réponse moyens
- Taux d'escalade bot/agent
- Nombre de conversations actives
- Performance des agents

### 👥 **Gestion des Agents**
- Rôles: SUPER_ADMIN, CLIENT_ADMIN, AGENT
- Assignment manuelle des conversations
- Multi-tenant avec isolation des données
- Audit logs pour toutes les actions

### 🔐 **Security & Reliability**
- Multi-tenant architecture avec isolation
- Row Level Security (RLS) Supabase
- JWT authentication
- Audit logging complet

---

## 🏗️ Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────┐
│         🌐 WhatsApp Business API (Meta)      │
│                   ↑  ↓                       │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────┐       ┌──────────────┐   │
│  │   Frontend   │───────│   Backend    │   │
│  │  (Next.js)   │       │ (API Routes) │   │
│  └──────────────┘       └──────────────┘   │
│       ↑   ↓                    ↑   ↓        │
│       └──────────────┬─────────┘   │        │
│                      │             │        │
│                  ┌───▼───────────┐ │        │
│                  │   Supabase    │ │        │
│                  │  ├─ PostgreSQL│ │        │
│                  │  ├─ Realtime  │ │        │
│                  │  └─ Auth      │ │        │
│                  └───────────────┘ │        │
│                                    ↓        │
│              ┌──────────────────────────┐   │
│              │  Webhook WhatsApp        │   │
│              │  Bot Engine              │   │
│              └──────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Multi-Tenant Data Model

```
tenants/                    # Organizations
  {id, name, type, status}

users/                      # User accounts
  {id, email, role, tenantId}

contacts/                   # WhatsApp contacts
  {id, phoneNumber, name, tenantId}

conversations/              # Conversation threads
  {id, contactId, tenantId, assignedTo, status}

messages/                   # Individual messages
  {id, conversationId, direction, content, type}

bot_scenarios/              # Bot configurations
  {id, tenantId, keywords, response, priority}

audit_logs/                 # Activity tracking
  {id, userId, action, resource, timestamp}
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (JWT) |
| **Real-time** | Supabase Realtime |
| **UI** | shadcn/ui, Radix UI |
| **Icons** | Lucide React |

---

## 🔧 Setup & Installation

### Environment Variables

```bash
# Copy template
cp .env.example .env

# Required variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations (SQL files in `/supabase/migrations`)
3. Copy project URL and keys to `.env`

### WhatsApp Business API Setup

1. Create a Meta App at [Meta for Developers](https://developers.facebook.com/)
2. Add WhatsApp product to your app
3. Configure webhook URL: `https://your-domain.com/api/webhook`
4. Get Phone Number ID and Access Token
5. Save credentials in tenant settings

---

## 💻 Development

### Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Format code
npm run format

# Lint check
npm run lint
```

### Code Style

This project uses **ESLint** and **Prettier**:

```bash
# Format & lint
npm run lint:fix
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push

# 2. Import project in Vercel
# 3. Add environment variables
# 4. Deploy
```

### VPS Deployment

```bash
# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "livetech" -- start
```

### Production Checklist

- [ ] Supabase credentials configured
- [ ] WhatsApp webhook publicly accessible
- [ ] SSL/HTTPS enabled
- [ ] RLS policies verified
- [ ] Audit logging enabled
- [ ] Error monitoring (Sentry)

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [docs/API.md](docs/API.md) | API endpoints |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment guide |
| [docs/BOT_SCENARIOS.md](docs/BOT_SCENARIOS.md) | Bot configuration |

---

## 🤝 Contributing

We welcome contributions! Please see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md)

### Quick PR Steps

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit: `git commit -am 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open Pull Request

---

## 📞 Support

- 📧 Email: contact@livepay.tech
- 🐛 Issues: [GitHub Issues](https://github.com/modousall/livetech/issues)

---

## 📄 License

**Proprietary** - All rights reserved

---

## 🙏 Acknowledgments

Built for African businesses & public services. Powering customer relationships via WhatsApp across francophone Africa.

**Website:** https://livetech.africa
**Contact:** contact@livepay.tech

---

*Last updated: February 2026*
