# 📋 Deployment Checklist

Use this checklist before deploying to production.

## 🔐 Security

- [ ] All secrets configured in Firebase (no hardcoded values)
- [ ] `.env` file is in `.gitignore`
- [ ] Firestore rules reviewed and tested
- [ ] Storage rules configured
- [ ] CORS headers properly configured
- [ ] Rate limiting enabled
- [ ] No console.log in production code

## 🧪 Testing

- [ ] All tests passing: `npm test`
- [ ] Type checking passes: `npm run check`
- [ ] No ESLint warnings: `npm run lint`
- [ ] Code formatted: `npm run format:check`
- [ ] Manual testing completed

## 📦 Build

- [ ] Clean build succeeds: `npm run build`
- [ ] Firebase hosting build succeeds: `npm run build:firebase`
- [ ] Bundle size acceptable (< 500KB gzipped recommended)
- [ ] No console errors in browser

## 🚀 Deployment

- [ ] Backup created: `gcloud firestore export gs://backup-bucket/...`
- [ ] Staging tested: Deploy to staging first
- [ ] Staging environment working correctly
- [ ] Production secrets configured
- [ ] Firebase project correct: `firebase projects:list`
- [ ] Ready for production deploy: `npm run deploy:all`

## ✅ Post-Deployment

- [ ] Health check passes: `curl https://livepay.tech/api/health`
- [ ] Frontend loads correctly
- [ ] WhatsApp webhooks operational
- [ ] Payment gateways responding
- [ ] Analytics collecting data
- [ ] Error monitoring configured
- [ ] No spike in error rates (check Firebase Console > Functions)
- [ ] Team notified of deployment

## 📊 Rollback Plan (If Needed)

```bash
# If deployment fails, rollback immediately:
git revert <commit-hash>
git push origin main
firebase deploy --only hosting
```

## 📞 Support Contact

deployment@livepay.tech

---

**Deployed by:** [Your Name]  
**Date:** [Date]  
**Version:** [Git commit hash]
