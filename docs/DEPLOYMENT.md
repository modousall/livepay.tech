# 🚀 Deployment Guide

Complete guide for deploying LivePay to production.

---

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Cloud Functions](#cloud-functions)
- [Security Rules](#security-rules)
- [Database Migrations](#database-migrations)
- [Monitoring & Logs](#monitoring--logs)
- [Rollback Procedures](#rollback-procedures)

---

## ✅ Pre-Deployment Checklist

### Code Quality

```bash
# Run tests
npm test

# Check TypeScript compilation
npm run check

# Lint code
npm run lint

# Build locally
npm run build
npm run build:firebase
```

### Environment

- [ ] All environment variables configured
- [ ] Firebase project selected correctly: `firebase use production`
- [ ] Secrets configured: `firebase functions:secrets:set KEY`
- [ ] WhatsApp webhook URL verified
- [ ] Payment gateway credentials tested
- [ ] Backup created
- [ ] Rollback procedure documented

### Security

- [ ] No secrets committed to git (check `.gitignore`)
- [ ] Firestore rules reviewed and tested
- [ ] Storage rules configured
- [ ] Authentication setup verified
- [ ] CORS properly configured
- [ ] Rate limiting enabled

---

## 🎨 Frontend Deployment

### Build for Production

```bash
# Build Vite bundle
npm run build:firebase

# Generated in: `dist/public/`
```

### Deploy to Firebase Hosting

```bash
# Deploy only hosting
firebase deploy --only hosting

# With preview channel (optional)
firebase hosting:channel:deploy preview-123 --only hosting
```

### Verify Deployment

```bash
# Check deployment history
firebase hosting:list

# View logs
firebase hosting:log

# Test deployed app
curl https://livepay.tech

# Check performance
# See Firebase Console > Hosting
```

---

## 🖥️ Backend Deployment

### Environment Setup

```bash
# Select production Firebase project
firebase use production

# Set production environment
export NODE_ENV=production
export PORT=8080
```

### Server Start

```bash
# Build & start
npm run build
npm start

# Or through Cloud Run:
gcloud run deploy livepay-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --port 8080
```

### Verify Backend

```bash
# Health check
curl https://livepay.tech/api/health

# Check logs
firebase functions:log --tail
```

---

## ⚡ Cloud Functions Deployment

### Prerequisites

```bash
# Ensure Cloud Functions API is enabled
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:whatsappWebhook

# Deploy with verbose logging
firebase deploy --only functions --debug
```

### Configure Function Environment

```bash
# Set secrets
firebase functions:secrets:set WHATSAPP_ACCESS_TOKEN
firebase functions:secrets:set WASENDER_API_KEY
firebase functions:secrets:set PAYMENT_API_KEY

# Verify secrets
firebase functions:secrets:list
```

### Monitoring Functions

```bash
# Real-time logs
firebase functions:log --tail

# Filter by severity
firebase functions:log --severity ERROR

# Filter by function
firebase functions:log --only whatsappWebhook

# Export logs to Cloud Logging
gcloud functions describe whatsappWebhook --region us-central1
```

---

## 🔐 Security Rules Deployment

### Firestore Rules

```bash
# Preview rules deployment
firebase deploy --only firestore:rules --dry-run

# Deploy rules
firebase deploy --only firestore:rules

# Verify rules
firebase firestore:describe
```

### Storage Rules

```bash
# Preview storage rules
firebase deploy --only storage --dry-run

# Deploy storage rules
firebase deploy --only storage
```

### Test Rules

```bash
# Use Firebase Emulator to test rules locally before deploying
firebase emulators:start --only firestore,storage
```

---

## 🗄️ Database Migrations

### Backup Before Migration

```bash
# Export Firestore database
gcloud firestore export gs://backup-bucket/firestore-backup-date

# Export specific collections
gcloud firestore export gs://backup-bucket/firestore-backup-date \
  --collection-ids=products,orders,users
```

### Migration Steps

1. **Create backup** (see above)
2. **Test migration** locally using emulator
3. **Apply migration** in staging first
4. **Verify data** integrity
5. **Deploy to production** during low-traffic window
6. **Monitor** for errors
7. **Document** changes in commit message

### Restore from Backup

```bash
# If migration fails, restore from backup
gcloud firestore import gs://backup-bucket/firestore-backup-date

# Verify restore
firebase firestore:describe
```

---

## 📊 Monitoring & Logs

### Firebase Console

- **Hosting:** Console > Hosting > Deployments
- **Functions:** Console > Functions > Logs
- **Firestore:** Console > Firestore > Data
- **Storage:** Console > Storage > Files
- **Auth:** Console > Authentication > Users

### Cloud Logging

```bash
# View application logs
gcloud logging read "resource.type=cloud_function" \
  --limit 50 \
  --format json

# Set up log sink for long-term storage
gcloud logging sinks create archive-sink \
  gs://log-archive-bucket \
  --log-filter='severity>=ERROR'
```

### Monitoring Alerts

Set up alerts for:
- Failed deployments
- High error rates in functions
- rate limiting triggered
- Payment gateway failures
- Quota exceeded

**Firebase Console > Monitoring** to set up alerts

---

## 🔄 Rollback Procedures

### Quick Rollback (Last Deployment)

```bash
# View deployment history
firebase hosting:list

# Rollback to previous version
firebase hosting:rollback

# To specific version
firebase hosting:clone [version-id] [channel-id]
```

### Rollback Functions

```bash
# Functions don't have direct rollback
# Instead, deploy previous version from git:

git checkout [previous-commit]
firebase deploy --only functions

# Or manually delete problematic function
firebase functions:delete functionName --region us-central1
```

### Rollback Database

```bash
# If migration failed, restore backup
gcloud firestore import gs://backup-bucket/firestore-backup-date
```

---

## 📅 Deployment Schedule

### recommended Deployment Windows

- **Weekdays:** 10:00 AM - 2:00 PM (UTC)
- **Avoid:** Evenings, weekends, holidays
- **Notification:** Post in #deployments Slack channel before deploying

### Deployment Steps

1. Create PR with changes
2. Get approval + pass all tests
3. Merge to `main` branch
4. Deploy to staging first
5. Test thoroughly in staging
6. Schedule deployment window
7. Deploy to production
8. Monitor logs for 1 hour
9. Document deployment

---

## 🚨 Post-Deployment Checklist

- [ ] All services health check OK
- [ ] No error spikes in logs
- [ ] Analytics data flowing correctly
- [ ] WhatsApp webhooks processing
- [ ] Payment gateway functioning
- [ ] Database queries performing normally
- [ ] SSL/TLS certificates valid
- [ ] CDN cache warmed up

---

## 📞 Support & Troubleshooting

### Common Issues

**Deployment fails with "Permission denied"**
```bash
# Check Firebase project
firebase use

# Re-authenticate
firebase login
```

**Functions timeout**
```bash
# Increase timeout in firebase.json
{
  "functions": {
    "memory": 512,
    "timeout": 540
  }
}
```

**Firestore quota exceeded**
```bash
# Check usage in Firebase Console
# Upgrade billing plan if needed
firebase billing set-account [BILLING_ACCOUNT_ID]
```

### Contacting Support

- 📧 Deployment Support: deploy@livepay.tech
- 🐛 Issues: https://github.com/modousall/livepay.tech/issues
- 📚 Firebase Docs: https://firebase.google.com/docs

---

## 📖 Additional Resources

- [Firebase Deployment Guide](https://firebase.google.com/docs/hosting/quickstart)
- [Cloud Functions Guide](https://cloud.google.com/functions/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Performance Optimization](https://firebase.google.com/docs/perf)

---

*Last updated: February 2026*
