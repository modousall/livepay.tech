# API Multi-WABA Endpoints Documentation

## Webhooks

### POST `/api/webhooks/wasender/:vendorId`
Reçoit les messages WhatsApp entrants

**Params:**
- `vendorId` - Unique vendor identifier

**Headers:**
- `X-Wasender-Signature` - HMAC-SHA256 signature
- `Content-Type: application/json`

**Body:**
```json
{
  "type": "message",
  "from": "+221705555555",
  "message": "Hello vendor!",
  "timestamp": 1234567890,
  "messageId": "msg-123"
}
```

**Response:**
```json
{
  "status": "received",
  "processId": "proc-123"
}
```

---

### POST `/api/webhooks/wasender/:vendorId/status`
Mises à jour de statut des messages

**Body:**
```json
{
  "messageId": "msg-123",
  "status": "delivered|read|failed",
  "timestamp": 1234567890
}
```

**Response:** `200 OK`

---

### POST `/api/webhooks/wasender/:vendorId/connection`
Événements de connexion

**Body:**
```json
{
  "type": "connected|disconnected|error",
  "timestamp": 1234567890
}
```

**Response:** `200 OK`

---

## Admin Endpoints

### POST `/api/admin/vendors/:vendorId/setup-wasender-webhook`
Configure webhook pour un vendeur

**Headers:** `Authorization: Bearer admin-token`

**Body:**
```json
{
  "wasenderInstanceId": "instance-123",
  "phoneNumber": "+221705555555",
  "webhookSecret": "secret-key-123"
}
```

**Response:**
```json
{
  "status": "configured",
  "webhookUrl": "https://livepay.tech/api/webhooks/wasender/vendor-001"
}
```

---

### GET `/api/admin/vendors/:vendorId/wasender-status`
Récupère le statut WABA du vendeur

**Response:**
```json
{
  "vendorId": "vendor-001",
  "phoneNumber": "+221705555555",
  "status": "active",
  "wasenderInstanceId": "instance-123",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Test Examples

### Signature Generation
```bash
BODY='{"type":"message","from":"+221705555555"}'
SIGNATURE=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "secret-key" | cut -d' ' -f2)
```

### Send Webhook
```bash
curl -X POST https://livepay.tech/api/webhooks/wasender/vendor-001 \
  -H "X-Wasender-Signature: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$BODY"
```
