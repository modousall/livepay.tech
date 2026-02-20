# 🔐 Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LivePay, please email **security@livepay.tech** instead of using the public issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your name/handle (for credit if desired)

**We will:**
- Acknowledge receipt within 24 hours
- Provide status updates every 48 hours
- Work on a fix with priority
- Coordinate disclosure timing

## Security Updates

We release security updates as soon as they're ready. Always keep LivePay updated to the latest version.

## Known Security Practices

- All secrets stored in Firebase Cloud Functions Secrets
- Firestore Rules enforce Row-Level Security (RLS)
- WhatsApp webhooks signed with X-Hub-Signature-256
- Rate limiting applied to all endpoints
- HTTPS enforced on all connections
- Regular dependency updates via Dependabot

## Security Contacts

- **General Security:** security@livepay.tech
- **Bug Reports:** bugs@livepay.tech
- **Incident Response:** incident@livepay.tech
