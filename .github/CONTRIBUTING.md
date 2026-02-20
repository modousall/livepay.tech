# 🤝 Contributing to LivePay

Thank you for your interest in contributing to LivePay! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

---

## 📖 Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold this code.

**Be respectful, inclusive, and professional in all interactions.**

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- npm v10+
- Git
- Firebase CLI
- Basic TypeScript knowledge

### Fork & Clone

```bash
# 1. Fork the repository on GitHub
# https://github.com/modousall/livepay.tech/fork

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/livepay.tech.git
cd livepay.tech

# 3. Add upstream remote
git remote add upstream https://github.com/modousall/livepay.tech.git

# 4. Verify remotes
git remote -v
```

---

## 💻 Development Setup

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install Cloud Functions dependencies
npm --prefix functions install
```

### Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your Firebase config
# Important: Never commit .env file
```

### Start Development Server

```bash
npm run dev

# Open http://localhost:5173 in your browser
```

---

## 📝 Making Changes

### Create Feature Branch

```bash
# Update main branch
git fetch upstream
git checkout main
git reset --hard upstream/main

# Create feature branch
git checkout -b feature/my-feature
```

### Branch Naming Convention

Use descriptive names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

**Examples:**
```
feature/whatsapp-webhook-retry
fix/order-expiration-bug
docs/api-endpoint-examples
refactor/firestore-queries
```

---

## 💬 Commit Guidelines

### Conventional Commits

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types

- `feat` - A new feature
- `fix` - A bug fix
- `docs` - Documentation only changes
- `style` - Changes that don't affect code meaning (formatting, semicolons)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Code change that improves performance
- `test` - Adding or updating tests
- `chore` - Changes to build system or dependencies

### Commit Examples

```bash
# Feature
git commit -m "feat(orders): add automatic order expiration"

# Fix
git commit -m "fix(auth): prevent null pointer in login handler"

# Documentation
git commit -m "docs(api): add webhook signature verification example"

# Multiple-line commit
git commit -m "refactor(database): optimize firestore queries

- Consolidate product queries
- Add composite indexes
- Reduce reads by 30%"
```

---

## 🔄 Pull Request Process

### Before Submitting

1. **Sync with upstream:**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Check code quality:**
   ```bash
   npm run lint
   npm run format
   npm run check
   ```

4. **Build to verify:**
   ```bash
   npm run build
   ```

### Create Pull Request

1. **Push to your fork:**
   ```bash
   git push origin feature/my-feature
   ```

2. **Open PR on GitHub:**
   - Go to https://github.com/modousall/livepay.tech
   - Click "New Pull Request"
   - Select your branch
   - Fill PR template (auto-populated)

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Related Issue
Fixes #123 (if applicable)

## Testing
Describe testing performed

## Screenshots/Logs
If applicable, add screenshots or logs

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

- Maintainers will review within 2-5 business days
- Address review comments by pushing new commits
- Request re-review when ready
- PRs need 1+ approval before merging

---

## 📐 Coding Standards

### TypeScript

- Always use TypeScript (`.ts` or `.tsx`)
- Define proper types (avoid `any`)
- Use interfaces over types for exports
- Comment complex logic

```typescript
// ✅ Good
interface Order {
  id: string;
  vendorId: string;
  totalAmount: number;
}

// ❌ Bad
const order: any = { id: "123" };
```

### React Components

- Use functional components with hooks
- Proper prop typing
- Meaningful component names
- Extract complex logic to custom hooks

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function CTAButton({ onClick, isLoading }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={isLoading}>
      {isLoading ? "Loading..." : "Click Me"}
    </button>
  );
}
```

### File Organization

```
src/
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utilities, constants, API clients
├── pages/         # Page components
└── types/         # Type definitions
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `OrderCard.tsx` |
| Functions | camelCase | `getOrderStatus()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES = 3` |
| Variables | camelCase | `vendorId` |
| Files | kebab-case | `order-service.ts` |
| Directories | kebab-case | `auth-utils/` |

### Code Style

- Use Prettier for formatting
- Max line length: 100 characters
- Use `const` by default, `let` if needed
- Avoid `var`
- Use template literals for strings

```bash
# Format code
npm run format

# Check formatting
npm run lint
```

---

## ✅ Testing

### Writing Tests

- Test files: `src/__tests__/` or co-located with components
- Use Vitest + React Testing Library
- Aim for >80% coverage

```typescript
// Example test
import { render, screen } from "@testing-library/react";
import { OrderCard } from "./OrderCard";

describe("OrderCard", () => {
  it("displays order information", () => {
    const order = { id: "123", total: 100 };
    render(<OrderCard order={order} />);
    
    expect(screen.getByText("Order 123")).toBeInTheDocument();
    expect(screen.getByText("$100")).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 🐛 Reporting Bugs

1. **Check existing issues:** https://github.com/modousall/livepay.tech/issues
2. **Provide reproduction steps**
3. **Include error messages/logs**
4. **Specify environment** (OS, Node version, etc.)
5. **Add screenshots if UI-related**

---

## 💡 Suggesting Features

1. **Describe the feature clearly**
2. **Explain use case & benefits**
3. **Provide examples/mockups if applicable**
4. **Label as "enhancement"**

---

## ❓ Questions?

- 📧 Email: contact@livepay.tech
- 💬 GitHub Discussions: https://github.com/modousall/livepay.tech/discussions
- 🐛 Issues: https://github.com/modousall/livepay.tech/issues

---

## 🎉 Thank You!

Your contributions make LivePay better for everyone. Thank you for being part of the community! 🙏
