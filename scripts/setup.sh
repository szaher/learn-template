#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ACADEMY_NAME=""
SKIP_INSTALL=0
SKIP_VALIDATE=0

usage() {
  cat <<'EOF'
Usage: pnpm setup [options]

Initialize a new academy from the learn-template. Run this once after forking
or cloning the template.

What it does:
  1. Initializes a git repository (if not already one)
  2. Scaffolds required content directories
  3. Installs dependencies
  4. Runs validation and build to confirm a working state
  5. Creates an initial commit

Options:
  --name NAME              Academy name (e.g., "Kubernetes Academy")
                           Prompts interactively if omitted.
  --skip-install           Skip pnpm install (if deps are already installed)
  --skip-validate          Skip validation and build checks
  -h, --help               Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      ACADEMY_NAME="${2:-}"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --skip-validate)
      SKIP_VALIDATE=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

cd "$PROJECT_DIR"

# --- Step 1: Git init ---
if [[ -d ".git" ]]; then
  echo "Git repository already initialized."
else
  echo "Initializing git repository..."
  git init
  echo "Git repository initialized."
fi

# --- Step 2: Academy name ---
if [[ -z "$ACADEMY_NAME" ]]; then
  if [[ -t 0 ]]; then
    printf "Academy name (e.g., \"Kubernetes Academy\"): "
    read -r ACADEMY_NAME
  fi
  if [[ -z "$ACADEMY_NAME" ]]; then
    ACADEMY_NAME="My Academy"
    echo "Using default name: $ACADEMY_NAME"
  fi
fi

ACADEMY_SLUG="$(echo "$ACADEMY_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"

echo "Setting up: $ACADEMY_NAME ($ACADEMY_SLUG)"

# --- Step 3: Update academy.config.ts ---
if [[ -f "academy.config.ts" ]]; then
  sed -i.bak "s/name: \"Academy Template\"/name: \"$ACADEMY_NAME\"/" academy.config.ts
  sed -i.bak "s/slug: \"academy-template\"/slug: \"$ACADEMY_SLUG\"/" academy.config.ts
  sed -i.bak "s/header: 'Academy Template'/header: '$ACADEMY_NAME'/" academy.config.ts
  rm -f academy.config.ts.bak
  echo "Updated academy.config.ts"
fi

# --- Step 4: Update package.json name ---
if command -v node >/dev/null 2>&1; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.name = '$ACADEMY_SLUG';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "Updated package.json name to: $ACADEMY_SLUG"
fi

# --- Step 5: Scaffold directories ---
DIRS=(
  "content/module-1"
  "content/tutorials"
  "presentations"
  ".claude/agents"
)

for dir in "${DIRS[@]}"; do
  if [[ ! -d "$dir" ]]; then
    mkdir -p "$dir"
    echo "Created $dir/"
  fi
done

# Ensure meta.json exists for module-1
if [[ ! -f "content/module-1/meta.json" ]]; then
  cat > "content/module-1/meta.json" <<METAJSON
{
  "id": 1,
  "title": "Getting Started",
  "description": "Introduction to the core concepts",
  "color": "#68d391",
  "lessons": []
}
METAJSON
  echo "Created content/module-1/meta.json"
fi

# --- Step 6: Install dependencies ---
if [[ "$SKIP_INSTALL" == "0" ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    echo "Installing dependencies..."
    pnpm install
  else
    echo "Warning: pnpm not found. Install it with: npm install -g pnpm"
    echo "Then run: pnpm install"
  fi
else
  echo "Skipping dependency installation."
fi

# --- Step 7: Validate and build ---
if [[ "$SKIP_VALIDATE" == "0" && "$SKIP_INSTALL" == "0" ]]; then
  echo "Running validation..."
  pnpm validate || echo "Warning: validation had issues (this is expected for a fresh setup)."
  echo "Running build..."
  pnpm build || echo "Warning: build had issues. Check the output above."
else
  echo "Skipping validation and build."
fi

# --- Step 8: Initial commit ---
if [[ -d ".git" ]]; then
  if [[ -z "$(git log --oneline -1 2>/dev/null)" ]]; then
    git add -A
    git commit -m "Initial academy setup: $ACADEMY_NAME"
    echo "Created initial commit."
  else
    echo "Git history already exists, skipping initial commit."
  fi
fi

cat <<EOF

Setup complete!

  Academy:  $ACADEMY_NAME
  Slug:     $ACADEMY_SLUG

Next steps:
  1. Run: pnpm dev
  2. Start authoring with: prompts/01-curriculum-design.md
  3. (Optional) Make agent-ready with: prompts/09-agent-readiness-bootstrap.md

EOF
