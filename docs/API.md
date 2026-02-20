# 📡 LivePay API Documentation

Complete API reference for LivePay backend endpoints.

---

## 🌐 Base URL

**Staging:** `https://staging-livepay.web.app/api`  
**Production:** `https://livepay.tech/api`

---

## 🔐 Authentication

All endpoints (except webhook verification) require Firebase authentication.

```bash
# Include in request headers:
Authorization: Bearer <firebase_token>
```

---

## 📋 Endpoints

### Health Check

#### `GET /health`

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-20T10:30:00Z",
  "mode": "firebase",
  "message": "LivePay API - Data stored in Firebase"
}
```

---

### WhatsApp Webhooks

#### `GET /webhooks/whatsapp`

WhatsApp Business Platform verification hook.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `hub.mode` | string | ✓ | Must be "subscribe" |
| `hub.verify_token` | string | ✓ | Must match `WHATSAPP_VERIFY_TOKEN` |
| `hub.challenge` | string | ✓ | Challenge value to echo back |

**Response:**
```
<hub.challenge_value>
```

**Example:**
```bash
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=livepay_webhook_verify&hub.challenge=12345
```

---

#### `POST /webhooks/whatsapp`

Receive incoming WhatsApp messages and status updates.

**Headers:**
```
Content-Type: application/json
X-Hub-Signature-256: sha256=<signature>
```

**Body (Message):**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "...",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "phone_number_id": "994899897039054"
            },
            "messages": [
              {
                "from": "221761234567",
                "id": "wamid.xxx",
                "message": {
                  "type": "text",
                  "text": {
                    "body": "ROBE1"
                  }
                },
                "timestamp": "1700000000"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response:**
```
HTTP 200 OK
```

**Processing:**
- Message is logged asynchronously
- Processed by Firebase Cloud Functions
- Response sent immediately (always 200 OK)

---

### Products API

#### `GET /api/products`

List products for authenticated vendor.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "vendorId": "vendor_456",
      "keyword": "ROBE1",
      "name": "Robe Wax Premium",
      "price": 15000,
      "stock": 10,
      "active": true,
      "imageUrl": "https://...",
      "createdAt": "2026-02-15T10:00:00Z",
      "updatedAt": "2026-02-20T14:30:00Z"
    }
  ]
}
```

---

#### `POST /api/products`

Create new product.

**Headers:**
```
Authorization: Bearer <firebase_token>
Content-Type: application/json
```

**Body:**
```json
{
  "keyword": "ROBE1",
  "name": "Robe Wax Premium",
  "price": 15000,
  "stock": 10,
  "imageUrl": "https://...",
  "description": "Premium wax fabric dress"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "prod_new_123",
    "keyword": "ROBE1",
    "name": "Robe Wax Premium",
    "price": 15000,
    "stock": 10,
    "createdAt": "2026-02-20T14:35:00Z"
  }
}
```

---

### Orders API

#### `GET /api/orders`

List orders for vendor.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | Filter by status: `pending`, `paid`, `expired` |
| `limit` | number | 20 | Results limit |
| `offset` | number | 0 | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_123",
      "vendorId": "vendor_456",
      "productName": "Robe Wax Premium",
      "clientPhone": "221761234567",
      "quantity": 2,
      "totalAmount": 30000,
      "status": "paid",
      "paymentMethod": "wave",
      "paidAt": "2026-02-20T14:30:00Z",
      "createdAt": "2026-02-20T14:25:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### `POST /api/orders`

Create order (internal use by webhook/functions).

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order_new_789",
    "status": "pending",
    "paymentUrl": "https://wave.com/pay?token=xyz"
  }
}
```

---

### Analytics API

#### `GET /api/analytics/dashboard`

Dashboard metrics for vendor.

**Headers:**
```
Authorization: Bearer <firebase_token>
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | enum | `day`, `week`, `month` (default: `day`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "day",
    "metrics": {
      "totalOrders": 47,
      "totalRevenue": 1250000,
      "averageOrderValue": 26595,
      "conversionRate": 0.32,
      "topProducts": [
        {
          "name": "Robe Wax Premium",
          "quantity": 15,
          "revenue": 225000
        }
      ],
      "ordersByStatus": {
        "paid": 45,
        "pending": 2,
        "expired": 0
      }
    }
  }
}
```

---

## 🔄 Data Models

### Order Object

```json
{
  "id": "order_123",
  "vendorId": "vendor_456",
  "productId": "prod_789",
  "productName": "Robe Wax Premium",
  "clientPhone": "221761234567",
  "clientName": "Awa Dia",
  "quantity": 2,
  "unitPrice": 15000,
  "totalAmount": 30000,
  "status": "paid",
  "paymentMethod": "wave",
  "paymentToken": "pay_xyz_tokens",
  "paymentUrl": "https://wave.com/pay?token=xyz",
  "pspReference": "wave_ref_123",
  "reservedAt": "2026-02-20T14:25:00Z",
  "expiresAt": "2026-02-20T14:35:00Z",
  "paidAt": "2026-02-20T14:30:00Z",
  "createdAt": "2026-02-20T14:25:00Z",
  "updatedAt": "2026-02-20T14:30:00Z"
}
```

**Status Values:**
- `pending` - Awaiting payment
- `reserved` - Stock reserved
- `paid` - Payment received
- `expired` - Payment link expired
- `cancelled` - Manually cancelled

---

### Product Object

```json
{
  "id": "prod_123",
  "vendorId": "vendor_456",
  "keyword": "ROBE1",
  "name": "Robe Wax Premium",
  "description": "Premium wax fabric dress",
  "price": 15000,
  "stock": 10,
  "reservedStock": 2,
  "imageUrl": "https://...",
  "active": true,
  "createdAt": "2026-02-15T10:00:00Z",
  "updatedAt": "2026-02-20T14:30:00Z"
}
```

---

## ⚠️ Error Responses

### Standard Error Format

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with keyword 'ROBE1' not found",
    "statusCode": 404
  }
}
```

### Common Error Codes

| Code | Status | Message |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🔑 Rate Limiting

- **Webhook endpoints:** Unlimited (signature verified)
- **API endpoints:** 100 requests / minute per vendor
- **Response header:** `X-RateLimit-Remaining`

---

## 📚 Examples

### cURL

```bash
# Get products
curl -H "Authorization: Bearer $TOKEN" \
  https://livepay.tech/api/products

# Create order
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": "prod_123", "quantity": 2}' \
  https://livepay.tech/api/orders
```

### JavaScript/Node.js

```javascript
const API_URL = 'https://livepay.tech/api';

async function getProducts(token) {
  const res = await fetch(`${API_URL}/products`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

// Get products
const result = await getProducts(firebaseToken);
console.log(result.data);
```

---

## 🔄 Webhooks

### Signature Verification

All webhook payloads are signed with `X-Hub-Signature-256`.

**Verification algorithm:**

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, appSecret) {
  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}
```

---

## 📞 Support

- 📧 API Support: api@livepay.tech
- 🐛 Issues: https://github.com/modousall/livepay.tech/issues
- 📚 Docs: https://livepay.tech/docs

---

*Last updated: February 2026*
