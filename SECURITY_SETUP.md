# 🔐 LivePay Security Setup Guide

## ⚠️ CRITICAL: Secure Your API Keys

This guide explains how to securely configure API keys and secrets for LivePay using Firebase Functions secrets management.

---

## 🚨 Security Issues Fixed

The following security vulnerabilities have been addressed:

1. ✅ **Removed hardcoded Wasender API key** - Wasender credentials now loaded from Firebase secrets
2. ✅ **Added webhook signature verification** - Both Wasender and Meta webhooks now verify signatures
3. ✅ **Implemented rate limiting** - Prevents abuse and spam attacks
4. ✅ **Secured Bictorys integration** - Payment secret key loaded from environment
5. ✅ **Added security headers** - CSP, X-Frame-Options, XSS protection
6. ✅ **Input validation utilities** - Phone number and amount sanitization

---

## 📋 Prerequisites

- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project linked: `firebase use <project-id>`
- Admin access to your Firebase project

---

## 🔑 Step 1: Set Up Firebase Secrets

Firebase Functions secrets allow you to store sensitive environment variables securely.

### **Wasender API Configuration**

```bash
# Set Wasender API Key
firebase functions:secrets:set WASENDER_API_KEY

# When prompted, paste your API key:
# c564c5d61135b8de1e6f486ea10fba0125c0b2735aa7c134ccb99975e83a0b24

# Set Wasender Instance ID
firebase functions:secrets:set WASENDER_INSTANCE_ID

# When prompted, paste your instance ID:
# 62942

# Set Wasender API URL (optional - has default)
firebase functions:secrets:set WASENDER_API_URL

# When prompted, paste the API URL:
# https://www.wasenderapi.com/api

# Set Wasender Webhook Secret (for signature verification)
firebase functions:secrets:set WASENDER_WEBHOOK_SECRET

# When prompted, paste your webhook secret:
# fcc622199ed3d71d0f9732e093b22879
```

### **Meta (Facebook) WhatsApp Configuration**

```bash
# Set Meta App Secret (for webhook verification)
firebase functions:secrets:set WHATSAPP_APP_SECRET

# When prompted, paste your app secret from Meta Developer Dashboard

# Set WhatsApp Verify Token (for webhook setup)
firebase functions:secrets:set WHATSAPP_VERIFY_TOKEN

# When prompted, enter your verify token:
# livepay_webhook_verify
```

### **Bictorys Payment Configuration**

```bash
# Set Bictorys Secret Key
firebase functions:secrets:set BICTORYS_SECRET_KEY

# When prompted, paste your Bictorys secret key
```

### **Other Secrets**

```bash
# Session Secret (for Express sessions if used)
firebase functions:secrets:set SESSION_SECRET

# Generate a random 32+ character string:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔍 Step 2: Verify Secrets Are Set

List all configured secrets:

```bash
firebase functions:secrets:access
```

Access a specific secret (for verification):

```bash
firebase functions:secrets:access WASENDER_API_KEY
```

---

## 🚀 Step 3: Deploy Functions with Secrets

After setting secrets, deploy your functions:

```bash
cd functions

# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:whatsappWebhookPro
```

---

## 🧪 Step 4: Test Webhook Security

### **Test Rate Limiting**

Send multiple rapid requests to test rate limiting:

```bash
# Using curl (send 100 requests in 1 minute)
for i in {1..100}; do
  curl -X POST https://<your-function-url> \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}' &
done

# You should see 429 errors after ~60 requests
```

### **Test Signature Verification**

#### **Wasender Webhook Test**

```bash
# Generate signature
SIGNATURE=$(echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "fcc622199ed3d71d0f9732e093b22879" | awk '{print $2}')

# Send with valid signature
curl -X POST https://<your-function-url>/api/webhooks/whatsapp-pro \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIGNATURE" \
  -d '{"test":"data"}'

# Send with invalid signature (should fail)
curl -X POST https://<your-function-url>/api/webhooks/whatsapp-pro \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: invalid-signature" \
  -d '{"test":"data"}'
```

#### **Meta Webhook Test**

```bash
# Generate Meta signature
SIGNATURE=$(echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "<YOUR_APP_SECRET>" | awk '{print $2}')

# Send with valid signature
curl -X POST https://<your-function-url>/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=$SIGNATURE" \
  -d '{"test":"data"}'
```

---

## 🛡️ Security Best Practices

### **1. Never Commit Secrets**

✅ **DO:**
```bash
# Use Firebase secrets
firebase functions:secrets:set MY_SECRET
```

❌ **DON'T:**
```typescript
// Never do this!
const API_KEY = "hardcoded-key-123";
```

### **2. Rotate Secrets Regularly**

Update secrets every 90 days:

```bash
firebase functions:secrets:set WASENDER_API_KEY
firebase deploy --only functions
```

### **3. Use Different Secrets per Environment**

```bash
# Development
firebase use development
firebase functions:secrets:set WASENDER_API_KEY

# Production
firebase use production
firebase functions:secrets:set WASENDER_API_KEY
```

### **4. Monitor Function Logs**

Watch for security-related logs:

```bash
# Stream logs
firebase functions:log

# Filter by severity
firebase functions:log --severity ERROR

# Filter by function
firebase functions:log --only whatsappWebhookPro
```

### **5. Enable Cloud Audit Logs**

In Firebase Console:
1. Go to **Project Settings** → **Service Accounts**
2. Enable **Cloud Audit Logs**
3. Monitor access to secrets

---

## 🔧 Troubleshooting

### **Error: "WASENDER_API_KEY is not configured"**

**Cause:** Secret not set or not deployed properly.

**Fix:**
```bash
# Verify secret exists
firebase functions:secrets:access WASENDER_API_KEY

# If missing, set it
firebase functions:secrets:set WASENDER_API_KEY

# Redeploy functions
firebase deploy --only functions
```

### **Error: "Invalid webhook signature"**

**Cause:** Webhook secret mismatch or missing.

**Fix:**
1. Verify webhook secret is set correctly in Wasender dashboard
2. Set the same secret in Firebase:
   ```bash
   firebase functions:secrets:set WASENDER_WEBHOOK_SECRET
   ```
3. Redeploy functions

### **Error: "Too many requests" (429)**

**Cause:** Rate limit exceeded.

**Fix:**
- This is expected behavior!
- Wait for the rate limit window to reset
- Or adjust limits in `functions/src/lib/security.ts`:
  ```typescript
  export function whatsappRateLimit() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // Increase if needed
      // ...
    });
  }
  ```

---

## 📊 Security Monitoring

### **Set Up Alerts**

Create alerts for suspicious activity:

```bash
# Using gcloud (Google Cloud CLI)
gcloud alpha monitoring policies create --policy-from-file=alert-policy.json
```

Example alert policy (`alert-policy.json`):
```json
{
  "displayName": "High Rate of Failed Webhook Signatures",
  "conditions": [
    {
      "displayName": "Failed signature count > 10 per minute",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_function\" AND metric.type=\"logging.googleapis.com/counter\" AND metric.labels.severity=\"ERROR\"",
        "comparison": "COMPARISON_GT",
        "thresholdValue": 10,
        "duration": "60s"
      }
    }
  ]
}
```

### **Review Logs Regularly**

```bash
# Check for security errors
firebase functions:log --severity ERROR | grep -i "signature\|unauthorized\|forbidden"

# Check rate limit hits
firebase functions:log | grep -i "ratelimit"
```

---

## 🎯 Security Checklist

Before going to production, verify:

- [ ] All API keys stored in Firebase secrets
- [ ] No hardcoded credentials in source code
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] `.env` file in `.gitignore`
- [ ] Different secrets for dev/prod environments
- [ ] Monitoring and alerts configured
- [ ] Secret rotation schedule established

---

## 📚 Additional Resources

- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-parameters)
- [Wasender API Documentation](https://wasenderapi.com/docs)
- [Meta Webhook Security](https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests)
- [OWASP Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

---

## 🆘 Support

If you encounter security issues:

1. Check function logs: `firebase functions:log`
2. Verify secrets are set: `firebase functions:secrets:access`
3. Review this guide
4. Contact LivePay support

---

**Last Updated:** February 19, 2026  
**Version:** 1.0.0
