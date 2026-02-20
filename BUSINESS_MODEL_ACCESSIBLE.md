# LivePay Business Model (Accessible + Competitive)

## 1) Positioning
LivePay is a vertical conversation platform for:
- Commerce (shop/events)
- Service operations (appointments/queues)
- CRM-intensive sectors (banking, microfinance, insurance, telecom, utilities)

Core promise: one WhatsApp-first operating system for sales + support + ticketing.

## 2) Revenue Model
Use a hybrid model to stay affordable and profitable:

1. SaaS subscription (fixed monthly)
2. Usage fee (small fee per processed conversation/ticket)
3. Optional add-ons (premium modules)
4. API pass-through for WhatsApp/Firebase overages (transparent)

## 3) Suggested Plans
### Starter (small merchants / agencies)
- Price: 7,500 FCFA / month
- Includes:
  - 1 business profile
  - 1,000 inbound conversations
  - Basic dashboard + e-ticket
  - Standard support
- Overages:
  - 6 FCFA / additional conversation

### Growth (SMEs / microfinance branches)
- Price: 25,000 FCFA / month
- Includes:
  - Up to 3 business profiles
  - 5,000 conversations
  - CRM workflows (reclamations, routing, SLA)
  - Queue + appointment modules
  - Priority support
- Overages:
  - 4 FCFA / additional conversation

### Scale (banks / telcos / multi-site)
- Price: 90,000 FCFA / month
- Includes:
  - Multi-entity setup
  - 20,000 conversations
  - Advanced analytics + role-based governance
  - API/webhook integrations
  - Dedicated success manager
- Overages:
  - 3 FCFA / additional conversation

## 4) Optional Add-ons
- AI Copilot (intent + routing): 15,000 FCFA / month
- Advanced reporting pack: 10,000 FCFA / month
- Compliance archive/export: 8,000 FCFA / month
- White-label branding: 12,000 FCFA / month

## 5) Cost Control (Firebase + WhatsApp APIs)
Main cost levers:
- Firestore reads/writes
- Cloud Functions invocations + compute duration
- Cloud Storage e-tickets/media
- WhatsApp API message volume

Control strategy:
- Cache hot product/context data
- Filter webhook events (ignore non-incoming noise)
- Use batched writes where possible
- Generate lightweight tickets (PNG/PDF print mode)
- Keep audit logs structured and TTL-based where allowed

## 6) Unit Economics Target
Recommended guardrails:
- Gross margin target: >= 70%
- Infrastructure + messaging COGS: <= 30% of MRR
- Support + onboarding: <= 20% of MRR

Practical monitoring per tenant:
- COGS per 1,000 conversations
- Messages-to-conversion ratio
- Revenue per active profile
- Ticket resolution time (CRM sectors)

## 7) Go-to-Market by Segment
1. Microfinance / cooperative banks:
   - sell reclamation + dossier tracking first
2. Private clinics / diagnostics:
   - sell appointment + queue reduction first
3. Event organizers:
   - sell ticketing + anti-fraud check-in first
4. Multi-branch retail:
   - sell catalog + payment + fulfillment orchestration

## 8) Packaging Principles
- Keep entry cost low (Starter)
- Make usage billing predictable and capped
- Upsell by business outcomes, not by technical features
- Publish a transparent overage calculator in-app

## 9) 90-Day Monetization Priorities
1. Launch Starter/Growth plans with hard limits
2. Activate usage metering per tenant
3. Add in-app billing dashboard (forecast + overage alerts)
4. Bundle CRM templates for banking/microfinance
5. Create partner onboarding packs (agencies, integrators)
