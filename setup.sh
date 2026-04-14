#!/usr/bin/env bash
# ───────────────────────────────────────────────────────────────────────────────
#  NeuroScan AI — One-Command Setup Script
#  Usage: bash setup.sh
# ───────────────────────────────────────────────────────────────────────────────
set -e

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       NeuroScan AI — Setup Script 🧠         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Python check ──────────────────────────────────────────────────────────
echo -e "${CYAN}[1/4] Checking Python 3.10+...${NC}"
PYTHON=$(command -v python3 || command -v python)
if [ -z "$PYTHON" ]; then
    echo -e "${RED}✗ Python 3 not found. Install Python 3.10+ first.${NC}"; exit 1
fi
PY_VER=$($PYTHON -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo -e "${GREEN}  ✓ Python $PY_VER${NC}"

# ── 2. Python venv + backend deps ─────────────────────────────────────────────
echo -e "${CYAN}[2/4] Installing Python dependencies...${NC}"
cd "$ROOT"
if [ ! -d "venv" ]; then
    $PYTHON -m venv venv
    echo "  Created virtual environment."
fi
source "$ROOT/venv/bin/activate" 2>/dev/null || source "$ROOT/venv/Scripts/activate" 2>/dev/null
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
echo -e "${GREEN}  ✓ Python packages installed${NC}"

# ── 3. Node check + frontend deps ─────────────────────────────────────────────
echo -e "${CYAN}[3/4] Installing Node.js dependencies...${NC}"
NODE=$(command -v node || echo "")
if [ -z "$NODE" ]; then
    echo -e "${YELLOW}  ⚠ Node.js not found. Skipping frontend build.${NC}"
    echo -e "${YELLOW}    Install Node.js 18+ to enable the React frontend.${NC}"
else
    NODE_VER=$(node --version)
    echo "  Node $NODE_VER found."
    cd "$ROOT/client"
    npm install --silent
    echo -e "${GREEN}  ✓ Node modules installed${NC}"

    echo -e "${CYAN}[4/4] Building React frontend...${NC}"
    npm run build
    echo -e "${GREEN}  ✓ React build created → client/build/${NC}"
fi

# ── 4. Upload dirs ────────────────────────────────────────────────────────────
mkdir -p "$ROOT/uploads/mri" "$ROOT/uploads/reports"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Setup Complete! ✓                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Start the full application:${NC}"
echo ""
echo -e "    ${YELLOW}cd $ROOT${NC}"
echo -e "    ${YELLOW}source venv/bin/activate${NC}   # Windows: venv\\Scripts\\activate"
echo -e "    ${YELLOW}python app.py${NC}"
echo -e "    ${GREEN}→ Open http://localhost:5000${NC}"
echo ""
echo -e "  ${CYAN}Or for frontend hot-reload during development:${NC}"
echo ""
echo -e "    Terminal 1: ${YELLOW}source venv/bin/activate && python app.py${NC}"
echo -e "    Terminal 2: ${YELLOW}cd client && npm start${NC}   (port 3000, proxies to 5000)"
echo ""
echo -e "  ${CYAN}First login:${NC}"
echo -e "    Visit http://localhost:5000/register"
echo -e "    Create your patient account to begin."
echo ""
