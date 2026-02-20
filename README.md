# 🚀 LivePay - WhatsApp Live Commerce Platform

**Chatbot transactionnel WhatsApp pour le commerce en direct en Afrique francophone**

[![GitHub](https://img.shields.io/badge/GitHub-modousall%2Flivepay.tech-blue?logo=github)](https://github.com/modousall/livepay.tech)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue)](package.json)

---

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Development](#development)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)

---

## 🎯 Quick Start

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org))
- **npm** v10+
- **Firebase CLI** ([Install](https://firebase.google.com/docs/cli))
- **Git**

### 5-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/modousall/livepay.tech.git
cd livepay.tech

# 2. Install dependencies
npm install
npm --prefix functions install

# 3. Setup environment
cp .env.example .env
# Edit .env with your Firebase credentials

# 4. Start development server
npm run dev

# 5. Open browser
# Visit: http://localhost:5173
```

---

## ✨ Features

### 👤 **For Customers**
- 💬 WhatsApp product inquiries with keyword search
- 🛒 Interactive product selection & quantity choosing
- 💳 Multiple payment methods (Mobile Money, Card, Cash)
- ⏱️ Automatic payment link expiration (10 min)
- ✅ Real-time order confirmation

### 🏪 **For Vendors**
- 📊 Live commerce dashboard with analytics
- 📦 Product management with inventory tracking
- 📱 WhatsApp Business integration
- 💰 Revenue tracking & order management
- 🔔 Real-time notifications
- 📞 CRM module for customer management
- 📅 Appointment & queue management
- 🎫 Event ticketing system

### 🔐 **Security & Reliability**
- Firebase authentication (email/password)
- Firestore with RLS policies
- Webhook signature verification
- Rate limiting & DDoS protection
- Automated backup & recovery

---

## 📁 Project Structure

```
livepay.tech/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities, Firebase config
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Express backend
│   ├── index.ts           # Main server file
│   ├── routes.ts          # API routes & webhooks
│   ├── static.ts          # Static file serving
│   └── vite.ts            # Vite integration
├── functions/             # Firebase Cloud Functions
│   ├── lib/
│   │   ├── services/      # External API integrations
│   │   ├── triggers/      # Firestore triggers
│   │   ├── scheduled/     # Scheduled jobs
│   │   └── webhooks/      # Webhook handlers
│   └── package.json
├── shared/                # Shared types
│   └── types.ts           # TypeScript interfaces
├── script/                # Build scripts
└── docs/                  # Documentation
```

---

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│         🌐 WhatsApp Business API (Meta)             │
│                   ↑  ↓                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐       ┌──────────────┐          │
│  │   Frontend   │───────│   Backend    │          │
│  │  (React 18)  │       │  (Express)   │          │
│  └──────────────┘       └──────────────┘          │
│       ↑   ↓                    ↑   ↓               │
│       └──────────────┬─────────┘   │               │
│                      │             │               │
│                  ┌───▼───────────┐ │               │
│                  │   Firebase    │ │               │
│                  │  ├─ Firestore │ │               │
│                  │  ├─ Storage   │ │               │
│                  │  └─ Auth      │ │               │
│                  └───────────────┘ │               │
│                                    ↓               │
│              ┌──────────────────────────┐          │
│              │ Cloud Functions (Webhooks│          │
│              │  Notifications, Payments │          │
│              │  Scheduled Tasks)        │          │
│              └──────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| **Backend** | Express.js, Node.js 20 |
| **Database** | Firebase Firestore (NoSQL) |
| **Storage** | Firebase Cloud Storage |
| **Auth** | Firebase Authentication |
| **Functions** | Firebase Cloud Functions |
| **External APIs** | WhatsApp Business, Wave, Orange Money, WaSender |

---

## 🔧 Setup & Installation

### Environment Variables

```bash
# Copy template
cp .env.example .env

# Required variables:
NODE_ENV=development
PORT=5000
APP_BASE_URL=https://livepay.tech

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Payment Gateways
WAVE_API_KEY=your_key
ORANGE_MONEY_KEY=your_key

# Other services
WASENDER_API_KEY=your_key
```

### Firebase Setup

```bash
# Login to Firebase
firebase login

# Initialize functions
firebase init functions

# Deploy rules
npm run deploy:rules

# Deploy functions
npm --prefix functions run deploy
```

---

## 💻 Development

### Available Commands

```bash
# Start development server (with hot reload)
npm run dev

# Build for production
npm run build
npm run build:firebase

# Type checking
npm run check

# Deploy to Firebase Hosting
npm run deploy

# Deploy Firebase Rules only
npm run deploy:rules

# Deploy everything
npm run deploy:all
```

### Code Style

This project uses **ESLint** and **Prettier**:

```bash
# Format code
npm run format

# Lint check
npm run lint

# Lint & fix
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 🚀 Deployment

### Firebase Hosting

```bash
# Build frontend
npm run build:firebase

# Deploy
firebase deploy --only hosting

# View logs
firebase functions:log
```

### Production Checklist

- [ ] All environment variables configured
- [ ] Firebase rules deployed (`npm run deploy:rules`)
- [ ] Cloud Functions deployed
- [ ] WhatsApp webhook verified
- [ ] Payment gateways tested
- [ ] Analytics configured
- [ ] Error monitoring enabled

For detailed deployment guide, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE_MVP.md](ARCHITECTURE_MVP.md) | System design & data models |
| [SECURITY_SETUP.md](SECURITY_SETUP.md) | Security configuration guide |
| [docs/API.md](docs/API.md) | API endpoints documentation |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment procedures |
| [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) | Contribution guidelines |

---

## 🤝 Contributing

We welcome contributions! Please see [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for:

- Code of Conduct
- Development setup
- Pull request process
- Commit message conventions

### Quick PR Steps

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes & commit: `git commit -am 'feat: add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open Pull Request on GitHub

---

## 📞 Support

- 📧 Email: contact@livepay.tech
- 🐛 Issues: [GitHub Issues](https://github.com/modousall/livepay.tech/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/modousall/livepay.tech/discussions)

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built for African merchants & customers. Powering live commerce across francophone Africa.

**Website:** https://livepay.tech  
**Contact:** contact@livepay.tech

---

*Last updated: February 2026*
