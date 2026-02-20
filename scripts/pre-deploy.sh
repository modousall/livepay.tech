#!/bin/bash
# Pre-deployment verification script
# Run this before deploying to production

set -e

echo "🔍 Running pre-deployment checks..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Node version
echo "📌 Checking Node.js version..."
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v20* ]]; then
  echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
else
  echo -e "${YELLOW}⚠ Node.js ${NODE_VERSION} (recommended: v20.x)${NC}"
fi

# 2. Check npm version
echo "📌 Checking npm version..."
npm_version=$(npm -v)
echo -e "${GREEN}✓ npm v${npm_version}${NC}"

# 3. Check dependencies
echo "📌 Checking dependencies..."
if npm list > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Dependencies valid${NC}"
else
  echo -e "${RED}✗ Dependency issues found${NC}"
  exit 1
fi

# 4. Type checking
echo "📌 Running TypeScript checks..."
if npm run check > /dev/null 2>&1; then
  echo -e "${GREEN}✓ TypeScript checks passed${NC}"
else
  echo -e "${RED}✗ TypeScript errors found${NC}"
  exit 1
fi

# 5. Linting
echo "📌 Running ESLint..."
if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Linting passed${NC}"
else
  echo -e "${RED}✗ Linting errors found${NC}"
  exit 1
fi

# 6. Build
echo "📌 Building frontend..."
if npm run build:firebase > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend build successful${NC}"
else
  echo -e "${RED}✗ Frontend build failed${NC}"
  exit 1
fi

# 7. Firebase CLI check
echo "📌 Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
  firebase_version=$(firebase --version)
  echo -e "${GREEN}✓ Firebase CLI ${firebase_version}${NC}"
else
  echo -e "${RED}✗ Firebase CLI not installed${NC}"
  exit 1
fi

# 8. Git status
echo "📌 Checking Git status..."
if git diff-index --quiet HEAD --; then
  echo -e "${GREEN}✓ Working tree clean${NC}"
else
  echo -e "${YELLOW}⚠ Uncommitted changes${NC}"
fi

# 9. Check .env
if [ -f ".env" ]; then
  echo -e "${GREEN}✓ .env file configured${NC}"
else
  echo -e "${YELLOW}⚠ .env file missing (may be OK if using secrets)${NC}"
fi

echo -e "\n${GREEN}✅ All pre-deployment checks passed!${NC}"
echo -e "${YELLOW}Next: Run 'npm run deploy:all' when ready${NC}"
