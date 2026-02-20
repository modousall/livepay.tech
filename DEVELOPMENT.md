# 👨‍💻 Development Guide

This guide helps developers set up and work on the LivePay project locally.

---

## 📦 Installation

### Prerequisites

- Node.js 20+ ([Download](https://nodejs.org))
- npm 10+
- Git
- Firebase CLI

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/modousall/livepay.tech.git
cd livepay.tech

# 2. Install dependencies
npm install
npm --prefix functions install

# 3. Setup Firebase emulator (optional but recommended)
firebase init emulators

# 4. Create .env file
cp .env.example .env
# Edit with your Firebase credentials

# 5. Start development server
npm run dev
```

---

## 🚀 Development Server

```bash
# Start with hot reload
npm run dev

# Your app will be available at: http://localhost:5173
```

### What's Running

- **Frontend:** Vite dev server (port 5173)
- **Backend:** Express server (port integrated)
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication

---

## 📝 File Structure

### Key Directories

```
client/src/
├── components/     # Reusable UI components
│   ├── ui/        # Base UI components (from shadcn)
│   └── *.tsx      # Feature components
├── hooks/         # Custom React hooks
├── lib/           # Utilities & helpers
│   ├── firebase.ts     # Firebase config
│   ├── utils.ts        # Helper functions
│   └── auth-utils.ts   # Auth utilities
├── pages/         # Page components
├── App.tsx        # Main app component
└── main.tsx       # App entry point

server/
├── index.ts       # Express server
├── routes.ts      # API routes
└── vite.ts        # Vite integration

functions/
├── lib/           # Function handlers
│   ├── services/  # External APIs
│   ├── triggers/  # Firestore triggers
│   └── webhooks/  # Webhook handlers
└── package.json

shared/
├── types.ts       # TypeScript types
├── logger.ts      # Logging system
└── errors.ts      # Error types
```

---

## 💻 Common Commands

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build all
npm run build:firebase  # Build frontend
npm run check        # TypeScript check
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Testing

```bash
npm test             # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### Deployment

```bash
npm run deploy       # Deploy to Firebase Hosting
npm run deploy:rules # Deploy Firestore rules
npm run deploy:all   # Deploy everything
```

---

## 🔧 Configuring Firebase

### Local Emulator

```bash
# Start Firebase emulator
firebase emulators:start

# This emulates:
# - Firestore (port 8080)
# - Storage (port 9199)
# - Functions (port 5001)
```

### Environment Variables

Create `.env` file with:

```env
# Firebase
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Payment
WAVE_API_KEY=your_key
WASENDER_API_KEY=your_key
```

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode (reruns on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Tests

Tests go in `src/__tests__/`:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

For component testing, use React Testing Library:

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders button', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

---

## 🐛 Debugging

### Browser DevTools

1. Open DevTools (F12)
2. Use Console tab for logs
3. Use debugger breakpoints in Sources
4. Check Network tab for API calls

### Server Logs

```bash
# Watch server logs
npm run dev

# Filter logs
firebase functions:log --severity ERROR

# Real-time logs
firebase functions:log --tail
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Node Debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "runtimeArgs": ["--loader", "tsx"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## 📚 Architecture Decisions

### Why Vite?
- Fast dev server with HMR
- Optimized builds
- Works great with React

### Why Express?
- Lightweight & flexible
- Good middleware support
- Easy to deploy

### Why Firebase?
- No backend infrastructure needed
- Firestore for realtime data
- Built-in authentication
- Scalable Cloud Functions

### Why Tailwind + Shadcn?
- Utility-first CSS
- Pre-built beautiful components
- Easy to customize

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript config |
| `vite.config.ts` | Vite build config |
| `tailwind.config.ts` | Tailwind styling |
| `.eslintrc.json` | Code linting |
| `.prettierrc.json` | Code formatting |
| `vitest.config.ts` | Test configuration |
| `firebase.json` | Firebase config |

---

## 🚀 Performance Tips

1. **Code Splitting:** Use dynamic imports for large components
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));
   ```

2. **Image Optimization:** Use Next-gen formats
   ```html
   <img src="image.webp" alt="description" />
   ```

3. **Bundle Analysis:** Check what's being bundled
   ```bash
   npm run build -- --analyze
   ```

4. **Lazy Load Routes:**
   ```typescript
   <Route path="/admin" component={lazy(() => import('@/pages/admin'))} />
   ```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use `.env` files
2. **Validate input** - Always validate user input
3. **Use HTTPS** - Always in production
4. **XSS Prevention** - Sanitize HTML content
5. **CSRF Protection** - Use tokens for POST requests
6. **Rate Limiting** - Prevent abuse

---

## 📖 Useful Links

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide)

---

## 😷 Troubleshooting

### Port Already in Use

```bash
# Find process using port 5173
lsof -i :5173

# Or use different port
PORT=3000 npm run dev
```

### Module Not Found

```bash
# Clear node_modules
rm -rf node_modules
npm install
```

### Firebase Connection Error

```bash
# Check credentials in .env
firebase login
firebase projects:list
```

### Tests Failing

```bash
# Clear test cache
npm test -- --clearCache

# Run in verbose mode
npm test -- --reporter=verbose
```

---

## 💬 Need Help?

- Check [README.md](README.md) for quick reference
- Read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for contribution guidelines
- Open an [issue](https://github.com/modousall/livepay.tech/issues)
- Start a [discussion](https://github.com/modousall/livepay.tech/discussions)

---

*Happy coding! 🚀*
