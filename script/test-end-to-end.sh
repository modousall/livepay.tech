#!/bin/bash

# ============================================
# End-to-End Webhook Test
# ============================================

set -e

echo "╔════════════════════════════════════════════╗"
echo "║  End-to-End Webhook Testing                ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Test Checklist:${NC}\n"

# 1. Check server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:9002/api/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Server is running${NC}"
else
    echo -e "   ${YELLOW}⚠️  Server not responding${NC}"
    echo "   Start it with: npm run dev"
    exit 1
fi
echo ""

# 2. Check signature
echo "2️⃣  Verifying signature..."
if command -v python3 &> /dev/null; then
    if python3 script/test-signature.py > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ Signature is correct${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Python3 not found, skipping signature check${NC}"
fi
echo ""

# 3. Send webhook
echo "3️⃣  Sending webhook..."
RESPONSE=$(bash script/test-waba-webhook.sh 2>&1 | grep -A 5 "✅ Réponse" | head -3)
if [ -n "$RESPONSE" ]; then
    echo -e "   ${GREEN}✅ Webhook sent${NC}"
else
    echo -e "   ${YELLOW}⚠️  Could not send webhook${NC}"
fi
echo ""

# 4. Check logs
echo "4️⃣  Server logs:"
echo ""
echo "   Check the terminal where you ran 'npm run dev'"
echo "   Look for: '[VENDOR WASENDER WEBHOOK]'"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Test completed!${NC}"
echo ""
echo "Next steps:"
echo "   1. If logs show '[VENDOR WASENDER WEBHOOK]' → webhook is being received"
echo "   2. If you see 'Unknown vendor' → create WABA instance in Firestore"
echo "   3. Run: npx tsx script/setup-waba-test.ts"
echo ""
