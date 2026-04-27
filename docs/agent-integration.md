# Agent integration

Sift can be integrated with AI coding agents (Claude Code, Claude Desktop, or OpenCode) so your AI assistant can read and manage your Obsidian tasks.

## Quick setup

### Install the agent skill

The fastest way to install the sift skill for any supported agent:

```bash
npx skills add dru89/sift -g
```

The installer will prompt you to choose which agents to configure. You can also target specific agents with `--agent claude-code opencode`.

### MCP server (Claude Code & Claude Desktop)

For richer tool integration, sift ships an MCP server that exposes sift tools via the Model Context Protocol. This requires building the project locally.

```bash
# 1. Build everything (CLI + MCP server)
npm install
npm run build

# 2. Link sift globally so the MCP server can find it
npm link --workspace=packages/cli

# 3. Configure your vault (if not already done)
sift init "/path/to/your/vault"
```

Then add the MCP server to your agent's config manually (see [Configuration](#configuration) below).

## Integration types

Sift supports two integration approaches:

1. **Agent skill** (all agents) — A SKILL.md that teaches the agent about sift's tools and conventions
2. **MCP Server** (Claude Code & Claude Desktop) — A Model Context Protocol server that provides sift tools directly

All integrations provide these core tools:
- `sift_list` - List and filter tasks. When `project` is an area name, automatically includes tasks from all linked projects. Pass `groupByProject: true` for bucketed output per project.
- `sift_next` - Get priority tasks
- `sift_summary` - Quick status overview (includes project list)
- `sift_add` - Add new tasks (to daily note or project)
- `sift_find` - Search actionable tasks without modifying them
- `sift_done` - Complete tasks (by search or precise file:line)
- `sift_mark` - Mark a task with any status (`in_progress`, `on_hold`, `moved`, `cancelled`, `open`, `done`)
- `sift_projects` - List vault projects (supports `--tag` and `--kind` filters)
- `sift_project_create` - Create a new project
- `sift_project_path` - Get a project's file path
- `sift_project_set` - Update project metadata (status, timeframe, tags)
- `sift_area_create` - Create a new area
- `sift_area_path` - Get an area's file path
- `sift_note` - Add freeform notes
- `sift_subnote` - Create a separate note file linked to a project or area
- `sift_review` - Generate a review summary (completed, created, new notes, stale, changelog, upcoming)
- `sift_graph` - Return the structural context for an area or project (child projects, subnotes, other linked files). Requires Obsidian to be running.

Note: Tool names use underscores in MCP (e.g., `sift_project_set`) and camelCase in OpenCode (e.g., `sift_projectSet`).

## Keeping things up to date

The canonical source files are in `skills/sift/`:

- [`skills/sift/mcp-server.ts`](../skills/sift/mcp-server.ts) -- MCP server for Claude Code/Desktop
- [`skills/sift/SKILL.md`](../skills/sift/SKILL.md) -- Agent skill definition
- [`skills/sift/tools/sift.ts`](../skills/sift/tools/sift.ts) -- OpenCode custom tools

When you make changes:

**For the agent skill:**
```bash
npx skills add dru89/sift -g -y
# Then restart your agent
```

**For MCP server (Claude Code/Desktop):**
```bash
npm run build --workspace=skills/sift
# Then restart Claude Desktop and/or Claude Code
```

## How it works

### MCP Server (Claude Code & Claude Desktop)

The MCP server (`packages/agent-skill/mcp-server.ts`) implements the Model Context Protocol to expose sift tools to Claude.

When built and configured:
- **Claude Desktop**: Runs as a local stdio server defined in `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code**: Runs as a local stdio server defined in `~/.claude.json`

The server provides tools that call the `sift` CLI under the hood. It resolves the CLI in this order:
1. `SIFT_CLI_PATH` environment variable (absolute path to built CLI)
2. `sift` on PATH (if globally linked)

The install script (`./scripts/install-agent-claude.sh`) helps set up the configuration with the correct paths.

### OpenCode Skill

#### The skill

The skill file (`SKILL.md`) is a markdown file with YAML frontmatter that OpenCode discovers on startup. It tells the agent:

- What sift does
- Which custom tools are available
- The Obsidian Tasks emoji format
- When to activate (e.g., "what should I work on?", "add a task", "remind me to...")
- Guidelines for behavior (how to format output, project-aware task placement, safe task completion, etc.)

### The custom tools

The tools file (`sift.ts`) defines OpenCode custom tools that call the `sift` CLI:

| Tool name | Description |
|-----------|-------------|
| `sift_list` | List open tasks, with optional search/priority/date filters. Area names expand to include linked projects; use `groupByProject: true` for bucketed output. |
| `sift_next` | Get the most important tasks sorted by urgency |
| `sift_summary` | Quick overview of task status + active projects |
| `sift_add` | Add a new task to today's daily note or a project |
| `sift_find` | Search actionable tasks without modifying them |
| `sift_done` | Mark a task as complete (by search or by file:line) |
| `sift_mark` | Mark a task with any status: open, in_progress, on_hold, moved, cancelled, done |
| `sift_projects` | List all projects and areas in the vault (optional `tag` and `kind` filters) |
| `sift_project_create` | Create a new project from template |
| `sift_project_path` | Get the file path for a project |
| `sift_project_set` | Update project metadata: status, timeframe, tags |
| `sift_area_create` | Create a new area from template |
| `sift_area_path` | Get the file path for an area |
| `sift_note` | Add a freeform note to daily note, project, or area |
| `sift_subnote` | Create a separate note file linked to a project or area |
| `sift_review` | Generate a review summary (completed, created, new notes, stale, changelog, upcoming) |
| `sift_graph` | Structural context for an area/project via backlinks: child projects, subnotes, other linked files. Requires Obsidian. |

The tools resolve the CLI in this order:
1. `SIFT_CLI_PATH` environment variable (absolute path to the built CLI entry point)
2. `sift` on PATH (if globally linked)

If sift is on your PATH (via `npm link`), no env var is needed.

## Usage

Once set up, you can use natural language with your AI assistant:

- "What's on my plate?"
- "What should I work on next?"
- "Add a task to review the PR by Friday"
- "Add a task to the MP3 Parser project to design the API"
- "Mark the architecture doc task as done"
- "I'm starting work on the auth refactor" (agent marks it in_progress)
- "Show me my overdue tasks"
- "What projects do I have?"
- "Add a note to MP3 Parser that we decided to use ID3v2.4"
- "Give me a weekly review"
- "What did I accomplish this week?"
- "Review the last 30 days"

The agent will use the sift tools to interact with your Obsidian vault.

## Configuration

### Claude Desktop

MCP servers are configured in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["/path/to/sift/skills/sift/dist/mcp-server.js"],
      "env": {
        "SIFT_CLI_PATH": "/path/to/sift/packages/cli/dist/index.js"
      }
    }
  }
}
```

The `SIFT_CLI_PATH` env var is optional if `sift` is on your PATH.

### Claude Code

MCP servers are configured globally in `~/.claude.json`:

```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["/path/to/sift/skills/sift/dist/mcp-server.js"]
    }
  }
}
```

See the [Manual setup](#manual-setup) section for the full JSON format.

### OpenCode

You can control access to the sift skill in your `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "sift": "allow"
    }
  }
}
```

## Manual setup

### Agent skill (all agents)

If you prefer to set things up manually instead of using `npx skills add`:

```bash
# Claude Code
mkdir -p ~/.claude/skills/sift
cp skills/sift/SKILL.md ~/.claude/skills/sift/SKILL.md

# OpenCode
mkdir -p ~/.config/opencode/skills/sift
cp skills/sift/SKILL.md ~/.config/opencode/skills/sift/SKILL.md
cp skills/sift/tools/sift.ts ~/.config/opencode/tools/sift.ts
```

### MCP server (Claude Code & Claude Desktop)

Build the MCP server:
```bash
npm run build --workspace=skills/sift
```

For Claude Desktop, add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["/absolute/path/to/sift/skills/sift/dist/mcp-server.js"]
    }
  }
}
```

For Claude Code, add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["/absolute/path/to/sift/skills/sift/dist/mcp-server.js"]
    }
  }
}
```

### Setting SIFT_CLI_PATH

If sift isn't on your PATH, set `SIFT_CLI_PATH` to the absolute path of the built CLI:

```bash
export SIFT_CLI_PATH="/path/to/sift/packages/cli/dist/index.js"
```

For Claude Desktop, add it to the `env` section of the MCP server config (see Configuration section above).
