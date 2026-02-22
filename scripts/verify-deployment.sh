#!/bin/bash

# ============================================
# ✅ LivePay Multi-WABA Deployment Verification
# ============================================

echo "╔════════════════════════════════════════════════════════╗"
echo "║  ✅ LivePay Multi-WABA - Verification Checklist       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $1"
        ((FAILED++))
    fi
}

# Function to check directory
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $1"
        ((FAILED++))
    fi
}

echo -e "${BLUE}📋 CHECKING BUILD ARTIFACTS${NC}"
check_file "dist/index.cjs"
check_file "dist/public/index.html"
check_dir "dist/public/assets"
echo ""

echo -e "${BLUE}📋 CHECKING MULTI-WABA SERVICES${NC}"
check_file "server/lib/waba-manager.ts"
check_file "server/lib/vendor-wasender-service.ts"
check_file "server/lib/vendor-wasender-webhooks.ts"
check_file "server/lib/firebase-waba.ts"
echo ""

echo -e "${BLUE}📋 CHECKING MIGRATION SCRIPTS${NC}"
check_file "script/migrate-to-multi-waba.ts"
check_file "script/setup-waba-test.ts"
check_file "script/test-waba-webhook.sh"
check_file "script/test-signature.py"
echo ""

echo -e "${BLUE}📋 CHECKING DEPLOYMENT SCRIPTS${NC}"
check_file "scripts/deploy.sh"
echo ""

echo -e "${BLUE}📋 CHECKING CONFIGURATION FILES${NC}"
check_file "firebase.json"
check_file "firestore.rules"
check_file "firestore.indexes.json"
check_file "shared/types.ts"
check_file "server/routes.ts"
echo ""

echo -e "${BLUE}📋 CHECKING DOCUMENTATION${NC}"
check_file "SUMMARY.md"
check_file "DEPLOYMENT_FINAL.md"
check_file "DEPLOY_COMMANDS.md"
check_file "MULTI_WABA_SETUP.md"
check_file "API_WABA_ENDPOINTS.md"
check_file "FIRESTORE_SETUP_GUIDE.md"
echo ""

echo -e "${BLUE}📋 CHECKING BUILD SIZES${NC}"
if [ -f "dist/index.cjs" ]; then
    SIZE=$(du -h dist/index.cjs | cut -f1)
    echo -e "${GREEN}✅${NC} dist/index.cjs: $SIZE"
    ((PASSED++))
fi

if [ -d "dist/public" ]; then
    SIZE=$(du -sh dist/public | cut -f1)
    echo -e "${GREEN}✅${NC} dist/public/: $SIZE"
    ((PASSED++))
fi
echo ""

echo -e "${BLUE}📋 CHECKING TYPE DEFINITIONS${NC}"
if grep -q "interface WABAInstance" shared/types.ts; then
    echo -e "${GREEN}✅${NC} WABAInstance interface defined"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} WABAInstance interface missing"
    ((FAILED++))
fi

if grep -q "wabaInstanceId" shared/types.ts; then
    echo -e "${GREEN}✅${NC} VendorConfig extended with wabaInstanceId"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} VendorConfig not extended"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}📋 CHECKING API ENDPOINTS${NC}"
if grep -q "wasender/:vendorId" server/routes.ts; then
    echo -e "${GREEN}✅${NC} Webhook endpoints configured"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Webhook endpoints missing"
    ((FAILED++))
fi

if grep -q "setup-wasender-webhook" server/routes.ts; then
    echo -e "${GREEN}✅${NC} Admin endpoints configured"
    ((PASSED++))
else
    echo -e "${RED}❌${NC} Admin endpoints missing"
    ((FAILED++))
fi
echo ""

echo -e "${BLUE}📋 CHECKING LINE COUNTS${NC}"
if [ -f "server/lib/waba-manager.ts" ]; then
    LINES=$(wc -l < server/lib/waba-manager.ts)
    echo -e "${GREEN}✅${NC} waba-manager.ts: $LINES lines"
    ((PASSED++))
fi

if [ -f "server/lib/vendor-wasender-service.ts" ]; then
    LINES=$(wc -l < server/lib/vendor-wasender-service.ts)
    echo -e "${GREEN}✅${NC} vendor-wasender-service.ts: $LINES lines"
    ((PASSED++))
fi

if [ -f "server/lib/vendor-wasender-webhooks.ts" ]; then
    LINES=$(wc -l < server/lib/vendor-wasender-webhooks.ts)
    echo -e "${GREEN}✅${NC} vendor-wasender-webhooks.ts: $LINES lines"
    ((PASSED++))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      SUMMARY                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo -e "   ${GREEN}$PASSED / $TOTAL${NC} items verified (100%)"
    echo ""
    echo -e "${GREEN}🎉 Ready for Production Deployment!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
    echo -e "   ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC} ($PERCENTAGE%)"
    echo ""
    echo -e "${YELLOW}Please fix missing items before deploying${NC}"
    exit 1
fi
