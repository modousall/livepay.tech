#!/bin/bash

# ============================================
# Test Webhook Multi-WABA Wasender
# Envoi un message de test avec signature
# ============================================

set -e

# Configuration
VENDOR_ID="vendor_test_001"
API_BASE="http://localhost:9002"
WEBHOOK_SECRET="webhook_secret_test_123"
FROM_PHONE="+221701111111"
MESSAGE_TEXT="Bonjour! Je cherche un produit"

echo "╔════════════════════════════════════════════╗"
echo "║  Test Webhook Wasender Multi-WABA          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# 1. Construire le payload
TIMESTAMP=$(date +%s)
MESSAGE_ID="msg_test_$(date +%s)_$RANDOM"

PAYLOAD=$(cat <<EOF
{
  "event": "message",
  "instanceId": "instance_test_123",
  "data": {
    "from": "$FROM_PHONE",
    "message": "$MESSAGE_TEXT",
    "type": "text",
    "id": "$MESSAGE_ID",
    "time": $TIMESTAMP
  }
}
EOF
)

echo "📨 Payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"
echo ""

# 2. Générer la signature HMAC SHA256
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -hex | sed 's/^.*= //')

echo "🔐 Signature (SHA256):"
echo "$SIGNATURE"
echo ""

# 3. Afficher l'URL du webhook
WEBHOOK_URL="$API_BASE/api/webhooks/wasender/$VENDOR_ID"
echo "🔗 URL Webhook:"
echo "$WEBHOOK_URL"
echo ""

# 4. Envoyer le webhook
echo "📤 Envoi du webhook..."
echo ""

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -d "$PAYLOAD")

echo "✅ Réponse du serveur:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# 5. Instructions pour vérifier les logs
echo "📋 Prochaines étapes:"
echo ""
echo "1️⃣  Vérifier les logs du serveur (sur le terminal npm):"
echo "   Rechercher: '[VENDOR WASENDER WEBHOOK]'"
echo ""
echo "2️⃣  Pour que ça fonctionne complètement:"
echo "   - Créer une WABA instance en Firestore:"
echo ""
echo "   Collection: waba_instances"
echo "   Document ID: waba_${VENDOR_ID}"
echo ""
echo '   {
     "vendorId": "'$VENDOR_ID'",
     "phoneNumber": "'$FROM_PHONE'",
     "provider": "wasender",
     "wasenderInstanceId": "instance_test_123",
     "wasenderWebhookSecret": "'$WEBHOOK_SECRET'",
     "status": "connected",
     "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
     "updatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
   }'
echo ""

echo "3️⃣  Vérifier la signature en Python:"
echo ""
echo "   import hmac, hashlib, json"
echo "   secret = '$WEBHOOK_SECRET'"
echo "   payload = '$PAYLOAD'"
echo "   sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()"
echo "   print(sig)"
echo ""

echo "4️⃣  Tester avec statut notification:"
echo "   curl -X POST $API_BASE/api/webhooks/wasender/$VENDOR_ID/status \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"event\":\"status\",\"messageId\":\"$MESSAGE_ID\",\"status\":\"delivered\"}'"
echo ""
