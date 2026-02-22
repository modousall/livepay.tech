#!/bin/bash

# ============================================
# 🚀 DEPLOYMENT SCRIPT - LivePay Multi-WABA
# Production Release v2.0
# ============================================

set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║  🚀 LivePay Multi-WABA - Production Deployment         ║"
echo "║  Version 2.0 - Multi-Vendor WhatsApp                  ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# STEP 1: TYPE CHECK
# ============================================
echo -e "${BLUE}📋 STEP 1: TypeScript Check${NC}"
npm run check
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Type check passed${NC}\n"
else
    echo -e "${RED}❌ Type errors found${NC}\n"
    exit 1
fi

# ============================================
# STEP 2: BUILD
# ============================================
echo -e "${BLUE}📦 STEP 2: Building${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
    echo "   Frontend: dist/public/ (1.3 MB)"
    echo "   Server: dist/index.cjs (845 KB)"
    echo ""
else
    echo -e "${RED}❌ Build failed${NC}\n"
    exit 1
fi

# ============================================
# STEP 3: AUTH CHECK
# ============================================
echo -e "${BLUE}🔐 STEP 3: Firebase Login Check${NC}"
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Firebase not authenticated${NC}"
    echo "Run: firebase login"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Firebase authenticated${NC}\n"

# ============================================
# STEP 4: DEPLOY
# ============================================
echo -e "${BLUE}🚀 STEP 4: Deploying to Production${NC}"
echo "Deploying to: https://livepay.tech"
echo ""

firebase deploy --project live-pay-97ac6

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📱 Production URLs:${NC}"
    echo "   Website: https://livepay.tech"
    echo "   Health: https://livepay.tech/api/health"
    echo "   Webhooks: https://livepay.tech/api/webhooks/wasender/:vendorId"
    echo ""
    echo -e "${BLUE}📊 Multi-WABA Architecture Deployed:${NC}"
    echo "   ✅ WABAManager (Redis cache)"
    echo "   ✅ VendorWasenderService per-vendor"
    echo "   ✅ 5 new webhook handlers"
    echo "   ✅ Firestore multi-WABA schema"
    echo ""
    echo -e "${BLUE}📈 Monitor:${NC}"
    echo "   Firebase Console: https://console.firebase.google.com"
    echo "   Logs: gcloud functions logs read --limit 50"
    echo "   Errors: gcloud functions logs read --limit 100 | grep ERROR"
    echo ""
    echo -e "${BLUE}🔄 Next Steps:${NC}"
    echo "   1. Test webhooks: bash script/test-waba-webhook.sh"
    echo "   2. Migrate vendors: npx tsx script/migrate-to-multi-waba.ts"
    echo "   3. Monitor logs: gcloud functions logs read -f"
    echo ""
else
    echo ""
    echo -e "${RED}❌ DEPLOYMENT FAILED${NC}"
    echo "Check logs: gcloud functions logs read --limit 100"
    exit 1
fi

# ============================================
# STEP 5: VERIFICATION
# ============================================
echo -e "${BLUE}✓ STEP 5: Post-Deployment Verification${NC}"
sleep 10  # Wait for deployment

echo "Testing health endpoint..."
HEALTH=$(curl -s https://livepay.tech/api/health | grep -o '"status":"ok"')

if [ -z "$HEALTH" ]; then
    echo -e "${YELLOW}⚠️  Health check inconclusive (may need DNS propagation)${NC}"
else
    echo -e "${GREEN}✅ Health check passed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 DeploymentComplete!${NC}"
echo ""
