# Sift — Makefile
#
# Common targets for building, installing, and developing sift.
# Run `make help` to see available targets.

SHELL := /bin/bash

# Paths
OPENCODE_TOOLS_DIR := $(HOME)/.config/opencode/tools
SKILL_INSTALL_DIR  := $(HOME)/.agents/skills/sift

.PHONY: help build clean install install-skill install-opencode install-cli link unlink dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Build ────────────────────────────────────────────────────

build: ## Build all packages (core, cli, agent skill)
	npm run build

clean: ## Remove all build artifacts
	npm run clean

# ─── Install ──────────────────────────────────────────────────

install: build install-cli install-skill install-opencode ## Build and install everything
	@echo ""
	@echo "  Done. Start a new agent session to pick up changes."

install-cli: build link ## Build and link the CLI globally

link: ## Link the sift CLI globally (npm link)
	cd packages/cli && npm link

unlink: ## Unlink the sift CLI
	cd packages/cli && npm unlink -g

install-skill: build ## Install the agent skill (SKILL.md + MCP server)
	npx skills add . -g -y

install-opencode: install-skill ## Copy OpenCode native tools from the skill install
	@mkdir -p "$(OPENCODE_TOOLS_DIR)"
	cp "$(SKILL_INSTALL_DIR)/tools/sift.ts" "$(OPENCODE_TOOLS_DIR)/sift.ts"
	cp "$(SKILL_INSTALL_DIR)/tools/vault.ts" "$(OPENCODE_TOOLS_DIR)/vault.ts"
	@echo "  Copied tools to $(OPENCODE_TOOLS_DIR)"

# ─── Development ──────────────────────────────────────────────

dev: ## Watch for changes and rebuild (core + cli)
	npm run build --workspace=packages/core && \
	npm run build --workspace=packages/cli & \
	npm run dev --workspace=skills/sift
