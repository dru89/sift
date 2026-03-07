#!/usr/bin/env bash
set -euo pipefail

# Install sift agent skill and custom tools for OpenCode.
#
# This script:
# 1. Copies SKILL.md to ~/.config/opencode/skills/sift/
# 2. Copies sift.ts tools to ~/.config/opencode/tools/
# 3. Optionally sets SIFT_CLI_PATH if sift isn't on PATH
#
# Run from the repo root:
#   ./scripts/install-agent.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SKILL_SRC="$REPO_ROOT/packages/agent-skill/SKILL.md"
TOOLS_SRC="$REPO_ROOT/packages/agent-skill/tools/sift.ts"

SKILL_DEST="$HOME/.config/opencode/skills/sift/SKILL.md"
TOOLS_DEST="$HOME/.config/opencode/tools/sift.ts"

echo "Installing sift agent skill and tools..."

# Create destination directories
mkdir -p "$(dirname "$SKILL_DEST")"
mkdir -p "$(dirname "$TOOLS_DEST")"

# Copy skill
cp "$SKILL_SRC" "$SKILL_DEST"
echo "  Skill:  $SKILL_DEST"

# Copy tools
cp "$TOOLS_SRC" "$TOOLS_DEST"
echo "  Tools:  $TOOLS_DEST"

# Check if sift is on PATH
if command -v sift &> /dev/null; then
    echo ""
    echo "  sift is on your PATH -- tools will use it directly."
else
    CLI_PATH="$REPO_ROOT/packages/cli/dist/index.js"
    if [ -f "$CLI_PATH" ]; then
        echo ""
        echo "  sift is NOT on your PATH."
        echo "  The tools will need SIFT_CLI_PATH set in your environment."
        echo ""
        echo "  Add this to your shell profile (~/.zshrc, ~/.bashrc, etc.):"
        echo ""
        echo "    export SIFT_CLI_PATH=\"$CLI_PATH\""
        echo ""
        echo "  Or link sift globally:"
        echo ""
        echo "    cd $REPO_ROOT && npm link --workspace=packages/cli"
    else
        echo ""
        echo "  WARNING: CLI not built yet. Run 'npm run build' first, then re-run this script."
    fi
fi

echo ""
echo "Done. Restart OpenCode to pick up the changes."
