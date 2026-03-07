# Agent integration

Sift can be integrated with [OpenCode](https://opencode.ai) so your AI coding agent can read and manage your Obsidian tasks. This requires two pieces:

1. **An agent skill** (`SKILL.md`) that teaches the agent when and how to interact with tasks
2. **Custom tools** (`sift.ts`) that give the agent direct access to sift commands

Both files live in the repo at `packages/agent-skill/` and get installed to your OpenCode config directory via a script.

## Quick setup

```bash
# 1. Build the CLI (the tools call it under the hood)
npm install
npm run build

# 2. Make sure sift is on your PATH
npm link --workspace=packages/cli

# 3. Configure your vault (if not already done)
sift init "/path/to/your/vault"

# 4. Install the skill and tools
./scripts/install-agent.sh

# 5. Restart OpenCode
```

That's it. The install script copies the skill and tools to the right places:

- `~/.config/opencode/skills/sift/SKILL.md`
- `~/.config/opencode/tools/sift.ts`

## Keeping things up to date

The canonical source files are tracked in the repo:

- [`packages/agent-skill/SKILL.md`](../packages/agent-skill/SKILL.md) -- the skill definition
- [`packages/agent-skill/tools/sift.ts`](../packages/agent-skill/tools/sift.ts) -- the custom tools

When you make changes to either file, re-run the install script to update the global copies:

```bash
./scripts/install-agent.sh
```

## How it works

### The skill

The skill file (`SKILL.md`) is a markdown file with YAML frontmatter that OpenCode discovers on startup. It tells the agent:

- What sift does
- Which custom tools are available (`sift_list`, `sift_next`, `sift_summary`, `sift_add`, `sift_done`)
- The Obsidian Tasks emoji format
- When to activate (e.g., "what should I work on?", "add a task", "remind me to...")
- Guidelines for behavior (how to format output, when to use `due` vs `scheduled`, etc.)

### The custom tools

The tools file (`sift.ts`) defines five OpenCode custom tools that call the `sift` CLI:

| Tool name | Description |
|-----------|-------------|
| `sift_list` | List open tasks, with optional search/priority/date filters |
| `sift_next` | Get the most important tasks sorted by urgency |
| `sift_summary` | Quick overview of task status |
| `sift_add` | Add a new task to today's daily note |
| `sift_done` | Mark a task as complete by searching its description |

The tools resolve the CLI in this order:
1. `SIFT_CLI_PATH` environment variable (absolute path to the built CLI entry point)
2. `sift` on PATH (if globally linked)

If sift is on your PATH (via `npm link`), no env var is needed.

## Usage

Once set up, you can use natural language in OpenCode:

- "What's on my plate?"
- "What should I work on next?"
- "Add a task to review the PR by Friday"
- "Mark the architecture doc task as done"
- "Show me my overdue tasks"

The agent will load the sift skill and use the custom tools to interact with your vault.

## Permissions

You can control access to the sift tools in your `opencode.json`:

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

If you prefer not to use the install script, copy the files yourself:

```bash
mkdir -p ~/.config/opencode/skills/sift
cp packages/agent-skill/SKILL.md ~/.config/opencode/skills/sift/SKILL.md
cp packages/agent-skill/tools/sift.ts ~/.config/opencode/tools/sift.ts
```

If sift isn't on your PATH, set `SIFT_CLI_PATH` to the absolute path of the built CLI:

```bash
export SIFT_CLI_PATH="/path/to/sift/packages/cli/dist/index.js"
```
