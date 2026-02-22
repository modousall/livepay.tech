#!/bin/bash

# ============================================
# Créer WABA Instance en Firestore pour le test
# ============================================

echo "📝 Creating WABA Instance in Firestore..."
echo ""
echo "1️⃣ Allez à Firebase Console:"
echo "   https://console.firebase.google.com"
echo ""
echo "2️⃣ Sélectionnez le projet: livepay"
echo ""
echo "3️⃣ Allez à Firestore Database"
echo ""
echo "4️⃣ Créez une nouvelle collection: waba_instances"
echo ""
echo "5️⃣ Le document ID doit être: waba_vendor_test_001"
echo ""
echo "6️⃣ Copier-coller ce JSON dans le document:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'
{
  "vendorId": "vendor_test_001",
  "phoneNumber": "+221701111111",
  "provider": "wasender",
  "wasenderInstanceId": "instance_test_123",
  "wasenderWebhookSecret": "webhook_secret_test_123",
  "status": "connected",
  "createdAt": "2026-02-22T12:22:44Z",
  "updatedAt": "2026-02-22T12:22:44Z"
}
EOF
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "7️⃣ Click SAVE"
echo ""
echo "8️⃣ Relancer le test webhook:"
echo ""
echo "   bash script/test-waba-webhook.sh"
echo ""
echo "✨ Notes:"
echo "   - Assurez-vous que Firebase est bien connecté"
echo "   - Vérifiez les Firestore Rules (doivent permettre write en dev)"
echo "   - Les timestamps doivent être au format ISO string"
echo ""
