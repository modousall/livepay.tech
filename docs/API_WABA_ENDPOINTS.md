bash script/test-waba-webhook.sh1️⃣  npm run check         (Vérifier code)
2️⃣  npm run build         (Builder local)
3️⃣  npm run deploy:all    (Déployer production)
4️⃣  curl https://...     (Tester)
5️⃣  gcloud functions...  (Vérifier logs)# API Endpoints - Multi-WABA Management

## 🔐 Authentication

Tous les endpoints admin nécessitent une authentification Firebase (Token Bearer ou User session).

## Endpoints Webhook

### POST /api/webhooks/wasender/:vendorId

Reçoit les messages entrants d'un vendor.

**Headers:**
```
Content-Type: application/json
X-Wasender-Signature: hmac-sha256-signature
```

**Body:**
```json
{
  "event": "message",
  "instanceId": "instance_abc123",
  "data": {
    "from": "22170111111",
    "message": "Bonjour! Je cherche...",
    "type": "text",
    "id": "msg_12345",
    "time": 1708691234
  }
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/webhooks/wasender/:vendorId/status

Reçoit les notifications de statut (livré, lu, etc).

**Body:**
```json
{
  "event": "status",
  "messageId": "msg_12345",
  "status": "delivered",
  "timestamp": 1708691334
}
```

**Response:**
```json
{
  "success": true
}
```

---

### POST /api/webhooks/wasender/:vendorId/connection

Reçoit les événements de connexion/déconnexion.

**Body:**
```json
{
  "event": "connection_status",
  "status": "connected",
  "phoneNumber": "+221701111111",
  "timestamp": 1708691434
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Admin Endpoints

### POST /api/admin/vendors/:vendorId/setup-wasender-webhook

Configure automatiquement le webhook Wasender pour un vendor.

**Parameters:**
- `vendorId` (string) : ID du vendor

**Response:**
```json
{
  "success": true,
  "message": "Webhook configured successfully",
  "webhookUrl": "https://livepay.tech/api/webhooks/wasender/vendor_001"
}
```

**Errors:**
```json
{
  "error": "Vendor service not found"
}
```

---

### GET /api/admin/vendors/:vendorId/wasender-status

Obtient le statut actuel de l'instance Wasender d'un vendor.

**Parameters:**
- `vendorId` (string) : ID du vendor

**Response (Connected):**
```json
{
  "status": "connected",
  "phoneNumber": "+221701111111"
}
```

**Response (Disconnected):**
```json
{
  "status": "disconnected"
}
```

**Response (Error):**
```json
{
  "status": "error"
}
```

---

## Firestore Endpoints (à créer)

### GET /api/admin/vendors/:vendorId/waba-instances

Obtenir toutes les instances WABA d'un vendor.

**Response:**
```json
{
  "success": true,
  "instances": [
    {
      "id": "waba_vendor_001",
      "vendorId": "vendor_001",
      "phoneNumber": "+221701111111",
      "provider": "wasender",
      "wasenderInstanceId": "instance_abc123",
      "status": "connected",
      "createdAt": "2026-02-22T10:00:00Z",
      "updatedAt": "2026-02-22T10:00:00Z"
    }
  ]
}
```

---

### GET /api/admin/vendors/:vendorId/waba/:wabaId

Obtenir les détails d'une instance WABA.

**Response:**
```json
{
  "id": "waba_vendor_001",
  "vendorId": "vendor_001",
  "businessName": "My Shop",
  "phoneNumber": "+221701111111",
  "provider": "wasender",
  "wasenderInstanceId": "instance_abc123",
  "status": "connected",
  "lastSync": "2026-02-22T11:30:00Z",
  "failoverProvider": "meta"
}
```

---

### PUT /api/admin/vendors/:vendorId/waba/:wabaId

Mettre à jour une instance WABA.

**Body:**
```json
{
  "phoneNumber": "+221704444444",
  "wasenderInstanceId": "instance_xyz789",
  "status": "connected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Instance updated successfully"
}
```

---

### DELETE /api/admin/vendors/:vendorId/waba/:wabaId

Supprimer une instance WABA.

**Response:**
```json
{
  "success": true,
  "message": "Instance deleted successfully"
}
```

**Note:** Avant la suppression, vérifier qu'aucun message actif n'est en cours.

---

### POST /api/admin/vendors/:vendorId/switch-provider

Basculer d'un provider à l'autre (Wasender → Meta, etc).

**Body:**
```json
{
  "provider": "meta",
  "config": {
    "phoneNumberId": "...",
    "accessToken": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider switched successfully",
  "webhookUrl": "https://livepay.tech/api/webhooks/meta/vendor_001"
}
```

---

## Statistics Endpoints (à créer)

### GET /api/admin/analytics/waba-instances

Obtenir des statistiques sur toutes les instances WABA.

**Response:**
```json
{
  "totalVendors": 42,
  "totalInstances": 45,
  "byProvider": {
    "wasender": 35,
    "meta": 8,
    "unipile": 2
  },
  "statusBreakdown": {
    "connected": 42,
    "disconnected": 2,
    "pending": 1
  },
  "recentFailures": [
    {
      "vendorId": "vendor_123",
      "phoneNumber": "+221701111111",
      "lastError": "Connection timeout",
      "lastFailedAt": "2026-02-22T09:30:00Z"
    }
  ]
}
```

---

### GET /api/admin/analytics/vendor/:vendorId/messages

Obtenir les statistiques de messages pour un vendor.

**Query Parameters:**
- `from` (ISO date) : Date de début
- `to` (ISO date) : Date de fin
- `status` (string) : "sent", "delivered", "read", "failed"

**Response:**
```json
{
  "vendorId": "vendor_001",
  "period": {
    "from": "2026-02-22T00:00:00Z",
    "to": "2026-02-22T23:59:59Z"
  },
  "stats": {
    "totalMessages": 245,
    "inbound": 120,
    "outbound": 125,
    "byStatus": {
      "sent": 100,
      "delivered": 125,
      "read": 20,
      "failed": 0
    },
    "avgResponseTime": "2.5s"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid vendor ID format"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "You don't have permission to manage this vendor"
}
```

### 404 Not Found
```json
{
  "error": "Vendor not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "requestId": "req_abc123"
}
```

---

## Rate Limiting

- **Global**: 100 requests/minute per API key
- **Per Vendor**: 10 requests/second
- **Webhook**: Unlimited (but should complete < 5s)

---

## Examples

### cURL: Récupérer le statut Wasender

```bash
curl -X GET https://livepay.tech/api/admin/vendors/vendor_001/wasender-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL: Configurer le webhook

```bash
curl -X POST https://livepay.tech/api/admin/vendors/vendor_001/setup-wasender-webhook \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### JavaScript: Envoyer un message

```javascript
// Via service côté client FirebaseAuth + Firestore
const response = await fetch(
  `https://livepay.tech/api/admin/vendors/vendor_001/send-message`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to: "+22170111111",
      message: "Bonjour! Comment puis-je vous aider?"
    })
  }
);
const result = await response.json();
console.log(result);
```

### Python: Tester webhook signature

```python
import hmac
import hashlib
import json

def verify_webhook(body, signature, secret):
    payload = json.dumps(body, separators=(',', ':'))
    expected_sig = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_sig)

# Utilisation
secret = "webhook_secret_xyz"
body = {"event": "message", "data": {...}}
signature = "abc123..."

is_valid = verify_webhook(body, signature, secret)
print(f"Webhook signature valid: {is_valid}")
```

---

## Notes de Déploiement

1. **Signer tous les webhooks** avec le webhook secret du vendor
2. **Valider les IPs** de Wasender si possible (whitelist)
3. **Timeout**: 5 secondes max pour le traitement webhook
4. **Retry logic**: Wasender retry 5 fois avec backoff exponentiel
5. **Monitoring**: Logger tous les webhooks en debug mode

---

## Support & Troubleshooting

Voir [MULTI_WABA_SETUP.md](./MULTI_WABA_SETUP.md) pour plus de détails.
