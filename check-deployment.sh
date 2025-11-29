#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Personal Finance PWA - Pre-Deployment Check  ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found package.json${NC}"

# Check for required files
echo ""
echo -e "${YELLOW}Checking required files...${NC}"

FILES=(
    "index.html"
    "vite.config.ts"
    "src/main.tsx"
    "public/manifest.json"
    "public/service-worker.js"
    "public/offline.html"
    "public/.nojekyll"
    ".github/workflows/deploy.yml"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${RED}(MISSING)${NC}"
    fi
done

# Check for icon files
echo ""
echo -e "${YELLOW}Checking PWA icons...${NC}"

ICONS=(
    "public/icon-180.png"
    "public/icon-192.png"
    "public/icon-512.png"
    "public/icon-1024.png"
)

MISSING_ICONS=0
for icon in "${ICONS[@]}"; do
    if [ -f "$icon" ]; then
        echo -e "${GREEN}✓${NC} $icon"
    else
        echo -e "${RED}✗${NC} $icon ${RED}(MISSING - NEEDS TO BE GENERATED)${NC}"
        MISSING_ICONS=$((MISSING_ICONS + 1))
    fi
done

if [ $MISSING_ICONS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNING: $MISSING_ICONS icon(s) missing!${NC}"
    echo -e "${YELLOW}   Open generate-icons.html in your browser to generate them.${NC}"
fi

# Check if node_modules exists
echo ""
echo -e "${YELLOW}Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules installed"
else
    echo -e "${RED}✗${NC} node_modules not found"
    echo -e "${YELLOW}   Run: npm install${NC}"
fi

# Check if git is initialized
echo ""
echo -e "${YELLOW}Checking Git...${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository initialized"
    
    # Check if remote is set
    if git remote -v | grep -q "origin"; then
        REMOTE=$(git remote get-url origin)
        echo -e "${GREEN}✓${NC} Remote origin set: $REMOTE"
    else
        echo -e "${YELLOW}⚠${NC}  No remote origin set"
        echo -e "${YELLOW}   Run: git remote add origin YOUR_REPO_URL${NC}"
    fi
else
    echo -e "${RED}✗${NC} Git not initialized"
    echo -e "${YELLOW}   Run: git init${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}                    SUMMARY                     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [ $MISSING_ICONS -eq 0 ] && [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "  1. Test locally: ${BLUE}npm run dev${NC}"
    echo -e "  2. Build: ${BLUE}npm run build${NC}"
    echo -e "  3. Push to GitHub: ${BLUE}git push origin main${NC}"
    echo -e "  4. Enable GitHub Pages in repository settings"
else
    echo -e "${YELLOW}⚠️  Some items need attention before deploying:${NC}"
    echo ""
    
    if [ $MISSING_ICONS -gt 0 ]; then
        echo -e "${YELLOW}  • Generate PNG icons using generate-icons.html${NC}"
    fi
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}  • Install dependencies: npm install${NC}"
    fi
fi

echo ""
echo -e "${BLUE}================================================${NC}"

