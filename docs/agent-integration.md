# Agent integration

Sift can be integrated with [OpenCode](https://opencode.ai) so your AI coding agent can read and manage your Obsidian tasks. This requires two pieces:

1. **An agent skill** that teaches the agent when and how to interact with tasks
2. **Custom tools** that give the agent direct access to sift commands

## Setup

### 1. Build the CLI

The custom tools call the sift CLI under the hood, so it needs to be built first:

```bash
cd /path/to/sift
npm install
npm run build
```

### 2. Install the skill

Create the skill directory and file:

```bash
mkdir -p ~/.config/opencode/skills/sift
```

Copy the skill definition into `~/.config/opencode/skills/sift/SKILL.md`:

```yaml
---
name: sift
description: Read, query, prioritize, and add tasks from the user's Obsidian vault using the sift CLI tool. Use this when the user asks about their tasks, wants to know what to work on next, or wants to add a new task.
---
```

Below the frontmatter, include instructions about what the skill does, which custom tools are available, the task format, when to use it, and any guidelines. See the full example in the [Reference section](#reference-skill-definition) below.

### 3. Install the custom tools

Create the tools file at `~/.config/opencode/tools/sift.ts`.

The key thing to update is the `SIFT_CLI` path constant at the top of the file. It should point to your built CLI entry point:

```typescript
const SIFT_CLI = "/path/to/sift/packages/cli/dist/index.js";
```

The file exports five tools:

| Tool name | Description |
|-----------|-------------|
| `sift_list` | List open tasks, with optional search/priority/date filters |
| `sift_next` | Get the most important tasks sorted by urgency |
| `sift_summary` | Quick overview of task status |
| `sift_add` | Add a new task to today's daily note |
| `sift_done` | Mark a task as complete by searching its description |

See the full example in the [Reference section](#reference-custom-tools) below.

### 4. Configure sift

Make sure sift knows where your vault is:

```bash
sift init "/path/to/your/vault"
# or
export SIFT_VAULT_PATH="/path/to/your/vault"
```

### 5. Restart OpenCode

OpenCode discovers skills and tools on startup. Restart it to pick up the new files.

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

## Reference

### Reference: Skill definition

Full `SKILL.md` for `~/.config/opencode/skills/sift/SKILL.md`:

```markdown
---
name: sift
description: Read, query, prioritize, and add tasks from the user's Obsidian vault using the sift CLI tool. Use this when the user asks about their tasks, wants to know what to work on next, or wants to add a new task.
---

## What I do

I help you interact with the user's Obsidian Tasks via the `sift` CLI tool and custom tools. The user manages their tasks in an Obsidian vault using the Obsidian Tasks plugin with emoji format.

## Available custom tools

The following custom tools are available for interacting with the user's tasks:

- **`sift_list`** - List open tasks, optionally filtered by search text, priority, or due date
- **`sift_next`** - Get the most important tasks to work on right now (sorted by priority + urgency)
- **`sift_summary`** - Quick overview: open count, overdue, due today, high priority, and up next
- **`sift_add`** - Add a new task to today's daily note
- **`sift_done`** - Mark a task as complete by searching for it

## Task format

Tasks use the Obsidian Tasks emoji format:
- `- [ ]` / `- [x]` for open/done
- Priority: highest, high, low, lowest
- Dates: scheduled, due, start, done (all YYYY-MM-DD)
- Recurrence: e.g. "every week"

## When to use me

- User asks "what should I work on?" or "what's on my plate?"
- User asks about overdue or upcoming tasks
- User says "add a task" or "remind me to..." or "I need to..."
- User asks about their priorities or task status
- User wants to mark something as done

## Guidelines

- When showing tasks, present them in a clean, readable format
- Highlight overdue tasks and high-priority items
- When adding tasks, confirm what was added (description, priority, dates)
- If the user mentions wanting to do something, offer to add it as a task
- Use `sift_next` when the user wants to know what to focus on
- Use `sift_summary` for a quick overview
```

### Reference: Custom tools

Full `sift.ts` for `~/.config/opencode/tools/sift.ts`:

```typescript
import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

// UPDATE THIS PATH to point to your built sift CLI
const SIFT_CLI = "/path/to/sift/packages/cli/dist/index.js";

function runSift(args: string[]): string {
  try {
    const result = execSync(`node ${SIFT_CLI} ${args.join(" ")}`, {
      encoding: "utf-8",
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
      timeout: 15000,
    });
    return result.trim();
  } catch (error: any) {
    return `Error running sift: ${error.message}`;
  }
}

export const list = tool({
  description: "List open tasks from the Obsidian vault.",
  args: {
    search: tool.schema.string().optional().describe("Filter by description text"),
    priority: tool.schema.enum(["highest", "high", "low", "lowest"]).optional().describe("Minimum priority"),
    dueBefore: tool.schema.string().optional().describe("Due on or before (YYYY-MM-DD)"),
    all: tool.schema.boolean().optional().describe("Include completed tasks"),
  },
  async execute(args) {
    const cliArgs = ["list", "--show-file"];
    if (args.search) cliArgs.push("--search", `"${args.search}"`);
    if (args.priority) cliArgs.push("--priority", args.priority);
    if (args.dueBefore) cliArgs.push("--due-before", args.dueBefore);
    if (args.all) cliArgs.push("--all");
    return runSift(cliArgs);
  },
});

export const next = tool({
  description: "Get the most important tasks right now.",
  args: {
    count: tool.schema.number().optional().describe("Number of tasks (default: 10)"),
  },
  async execute(args) {
    const cliArgs = ["next", "--show-file"];
    if (args.count) cliArgs.push("-n", String(args.count));
    return runSift(cliArgs);
  },
});

export const summary = tool({
  description: "Quick overview of task status.",
  args: {},
  async execute() { return runSift(["summary"]); },
});

export const add = tool({
  description: "Add a new task to today's daily note.",
  args: {
    description: tool.schema.string().describe("Task description"),
    priority: tool.schema.enum(["highest", "high", "low", "lowest"]).optional().describe("Priority"),
    due: tool.schema.string().optional().describe("Due date (YYYY-MM-DD)"),
    scheduled: tool.schema.string().optional().describe("Scheduled date (YYYY-MM-DD)"),
    start: tool.schema.string().optional().describe("Start date (YYYY-MM-DD)"),
    recurrence: tool.schema.string().optional().describe("Recurrence rule"),
  },
  async execute(args) {
    const cliArgs = ["add", `"${args.description}"`];
    if (args.priority) cliArgs.push("--priority", args.priority);
    if (args.due) cliArgs.push("--due", args.due);
    if (args.scheduled) cliArgs.push("--scheduled", args.scheduled);
    if (args.start) cliArgs.push("--start", args.start);
    if (args.recurrence) cliArgs.push("--recurrence", args.recurrence);
    return runSift(cliArgs);
  },
});

export const done = tool({
  description: "Mark a task as complete by searching for it.",
  args: {
    search: tool.schema.string().describe("Text to match in task description"),
  },
  async execute(args) { return runSift(["done", `"${args.search}"`]); },
});
```
