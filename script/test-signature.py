#!/usr/bin/env python3

"""
Test Webhook Signature Verification
Vérifie que la signature HMAC-SHA256 est correcte
"""

import hmac
import hashlib
import json
import sys

def verify_signature(payload, signature, secret):
    """Vérifier la signature HMAC-SHA256"""
    # Créer le HMAC
    expected_sig = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    # Comparer
    return hmac.compare_digest(signature, expected_sig)

# Test data
PAYLOAD = """{
  "event": "message",
  "instanceId": "instance_test_123",
  "data": {
    "from": "+221701111111",
    "message": "Bonjour! Je cherche un produit",
    "type": "text",
    "id": "msg_test_1771719764_30769",
    "time": 1771719764
  }
}"""

SIGNATURE = "e1fca4d5846d6bb948e74221c158dba5782545a221aff1f1eeebfbb4726ef09d"
SECRET = "webhook_secret_test_123"

print("╔════════════════════════════════════════════╗")
print("║  Signature Verification Test               ║")
print("╚════════════════════════════════════════════╝\n")

print("📨 Payload:")
print(json.dumps(json.loads(PAYLOAD), indent=2))
print()

print("🔐 Signature Received:")
print(SIGNATURE)
print()

print("🔑 Secret:")
print(SECRET)
print()

# Verify
is_valid = verify_signature(PAYLOAD, SIGNATURE, SECRET)

print("✅ Verification Result:")
print(f"   Valid: {is_valid}")
print()

if is_valid:
    print("✨ Success! Signature is valid.")
    print()
    print("Now you can test the webhook with:")
    print("   bash script/test-waba-webhook.sh")
else:
    # Generate correct signature
    correct_sig = hmac.new(
        SECRET.encode(),
        PAYLOAD.encode(),
        hashlib.sha256
    ).hexdigest()
    
    print("❌ Signature mismatch!")
    print()
    print(f"Expected: {correct_sig}")
    print(f"Got:      {SIGNATURE}")
    sys.exit(1)
