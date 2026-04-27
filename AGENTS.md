# AGENTS.md

This is **sift** -- a tool for surfacing and managing Obsidian Tasks from outside Obsidian.

## Project overview

Sift reads and writes tasks from an Obsidian vault that uses the [Obsidian Tasks](https://publish.obsidian.md/tasks/) plugin with **emoji format**. It provides multiple interfaces (CLI, Raycast, AI agent) on top of a shared core library.

## Architecture

This is a TypeScript monorepo using npm workspaces.

```
sift/
├── packages/
│   ├── core/        # Shared library: parser, scanner, writer, config
│   ├── cli/         # Command-line interface (commander.js)
│   ├── agent-skill/ # MCP server, OpenCode tools, SKILL.md
│   └── raycast/     # Raycast extension (React + @raycast/api)
```

All interfaces depend on `@sift/core`. The core package has zero UI concerns -- it reads/writes markdown files and returns structured data.

### Agent integration

The agent integration files live in `skills/sift/`:

**MCP Server (for Claude Code & Claude Desktop):**
- `skills/sift/mcp-server.ts` -- MCP server providing sift tools
- Tools: `sift_list`, `sift_agenda`, `sift_next`, `sift_summary`, `sift_add`, `sift_find`, `sift_done`, `sift_mark`, `sift_projects`, `sift_project_create`, `sift_project_path`, `sift_project_set`, `sift_note`, `sift_subnote`, `sift_area_create`, `sift_area_path`, `sift_review`, `sift_graph`, `vault_search`, `vault_backlinks`, `vault_read`, `vault_outline`

**OpenCode native tools:**
- `skills/sift/tools/sift.ts` -- Native tool definitions for OpenCode (task management)
- `skills/sift/tools/vault.ts` -- Native tool definitions for OpenCode (vault search/read)

**Agent Skill (all agents):**
- `skills/sift/SKILL.md` -- Skill definition with usage instructions

### Installation

The quickest way to install everything:

```bash
npm install
make install    # builds, links CLI, installs skill, copies OpenCode tools
```

This runs all the steps below. For selective installs or to understand what each step does, read on.

**Step 1: Install the CLI**

Build and link the CLI so it's available on PATH:

```bash
make install-cli    # or: npm run build && cd packages/cli && npm link
```

**Step 2: Initialize config**

```bash
sift init /path/to/your/obsidian/vault
```

**Step 3: Install the agent skill**

```bash
make install-skill  # or: npx skills add . -g -y
```

This installs the SKILL.md, MCP server, and tool files to `~/.agents/skills/sift/`. Agents that read SKILL.md from that location (Codex, Copilot, etc.) get the instructions automatically.

**Step 4: Claude Code MCP server (Claude Code users only)**

The skill installer does not automatically configure MCP servers. Add the sift MCP server to `~/.claude.json` manually:

```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["<path-to-mcp-server>"]
    }
  }
}
```

For `<path-to-mcp-server>`, use either:
- The repo build: `<repo>/skills/sift/dist/mcp-server.js` (rebuild after changes with `npm run build`)
- The installed copy: `~/.agents/skills/sift/dist/mcp-server.js` (re-run `npx skills add` after changes)

**Step 5: Claude Desktop MCP server (Claude Desktop users only)**

Same config format as above, but the file location depends on your OS:

| OS | Config path |
|----|-------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "sift": {
      "command": "node",
      "args": ["<path-to-mcp-server>"]
    }
  }
}
```

On Windows, use forward slashes or escaped backslashes in the path (e.g., `C:/Users/you/Developer/.../mcp-server.js`).

**Step 6: OpenCode native tools (OpenCode users only)**

OpenCode supports native TypeScript tools, which are faster than the MCP server (no subprocess overhead). The skill installer doesn't know about OpenCode's tools directory, so you need to copy the tool files manually.

Note: symlinks don't work here — Node resolves imports relative to the real file path, and `@opencode-ai/plugin` is only installed in OpenCode's `node_modules`, not in the skill install directory.

```bash
make install-opencode   # copies from ~/.agents/skills/sift/tools/ to ~/.config/opencode/tools/
```

Or manually:

**macOS / Linux:**
```bash
cp ~/.agents/skills/sift/tools/sift.ts ~/.config/opencode/tools/sift.ts
cp ~/.agents/skills/sift/tools/vault.ts ~/.config/opencode/tools/vault.ts
```

**Windows (PowerShell):**
```powershell
Copy-Item "$env:USERPROFILE\.agents\skills\sift\tools\sift.ts" "$env:USERPROFILE\.config\opencode\tools\sift.ts"
Copy-Item "$env:USERPROFILE\.agents\skills\sift\tools\vault.ts" "$env:USERPROFILE\.config\opencode\tools\vault.ts"
```

Re-run after `npx skills add` (or just use `make install`).

**During development:** `make install` handles the full cycle — build, skill install, and OpenCode tool copy. Run it after changing any skill files.

Both the MCP server and OpenCode tools resolve the `sift` CLI dynamically (from PATH or `SIFT_CLI_PATH` env var) rather than hardcoding a path.

## Key concepts

### Obsidian Tasks emoji format

Tasks look like this in markdown:

```markdown
- [ ] Task description ⏫ ⏳ 2026-03-07 📅 2026-03-10
- [x] Completed task 🔼 ✅ 2026-03-06
```

Emoji meanings:
- Priority: `⏫` highest, `🔼` high, `🔽` low, `⏬` lowest
- Dates: `⏳` scheduled, `📅` due, `🛫` start, `✅` done
- Recurrence: `🔁` followed by rule text (e.g., "every week")

### Configuration

Sift resolves its config in this order:
1. Explicit overrides passed to functions
2. `SIFT_VAULT_PATH` environment variable
3. `~/.siftrc.json`
4. `./.siftrc.json`

The config file looks like:
```json
{
  "vaultPath": "/path/to/vault",
  "dailyNotesPath": "Daily Notes",
  "dailyNotesFormat": "YYYY-MM-DD",
  "excludeFolders": ["Templates", "Attachments"],
  "projectsPath": "Projects",
  "projectTemplatePath": "Templates/Project.md",
  "areasPath": "Areas",
  "areaTemplatePath": "Templates/Area.md"
}
```

A per-repo `.siftrc.json` can also include a `project` field to associate the working directory with a vault project:
```json
{
  "project": "MP3 Parser"
}
```

### Task scanning

The scanner (`packages/core/src/scanner.ts`) walks all `.md` files in the vault, skipping excluded folders and root-level ALL_CAPS files (setup/reference docs). It parses every line looking for `- [ ]` or `- [x]` patterns and extracts metadata.

`TaskFilter` accepts a `filePatterns?: string[]` field for restricting which files are scanned. When `sift list --project <name>` resolves to an area, it automatically expands to include all projects that declare that area in their `area:` frontmatter — so querying an area returns tasks from the area file and all its linked projects.

### Urgency scoring

Tasks are ranked by an additive urgency score computed in `computeUrgency()` (`packages/core/src/scanner.ts`). The score blends due date proximity, priority, scheduled date, start date, and in-progress status. See [URGENCY.md](URGENCY.md) for the full model, design rationale, and tuning guidance.

Key points:
- Due dates are the strongest signal (0–12 points). A no-priority task due today outranks a highest-priority task with no due date.
- Scheduled dates in the past **decay** over 4 weeks. A stale scheduled date eventually contributes nothing.
- Overdue due dates do **not** decay — they stay visible until acted on.
- `sortByUrgency()` sorts by this score. Both `getNextTasks()` and `getAgendaTasks()` use it.

### Agenda vs Next

Sift has two "what should I work on?" views:

- **`sift agenda`** — "What needs my attention today?" Pre-filters to temporally relevant tasks (due/overdue, scheduled today or past, in-progress, start date is today), then sorts by urgency score.
- **`sift next`** — "What's most important overall?" No date pre-filter; scores all actionable tasks and returns the top N.

Both use the same scoring function. The difference is what they filter before scoring.

### Task writing

New tasks are added under the `## Journal` heading in today's daily note. If the daily note doesn't exist, it's created from a template that matches the user's existing format (frontmatter, tasks query block, journal section, dataview query, navigation links).

Tasks can also be added to project or area files using `addTask()` with the `project` option (or `sift add --project`). When targeting a project or area, the task is inserted under the `## Tasks` heading in the file.

### Projects

Projects are markdown files in the configured `projectsPath` folder (default: `Projects/`) that have `type: project` in their YAML frontmatter. The core library provides:

- `listProjects()` -- scans the projects folder and returns metadata for all project files
- `findProject()` -- case-insensitive lookup by name
- `createProject()` -- creates a new project file from the configured template (stripping Templater syntax). Accepts an optional `CreateItemOptions` with content, status, area, tags, and frontmatter.

### Areas

Areas are persistent responsibilities with no finish line -- things like "Incident Management" or "Sift" that you maintain indefinitely. They have `type: area` in their YAML frontmatter and live in the configured `areasPath` folder (default: `Areas/`).

- `listProjects()` scans both the `projectsPath` and `areasPath` folders. It returns `ProjectInfo` objects with a `kind` field (`"project" | "area"`) so callers can distinguish them.
- `createArea()` creates a new area file from the configured area template. Like `createProject()`, it accepts an optional `CreateItemOptions`.
- `findProject()` finds both projects and areas by name (case-insensitive).
- The `area` frontmatter field on projects links a project to its parent area (e.g., `area: Sift`).

### Safe task completion

Task completion uses a two-step flow to prevent accidentally marking the wrong task:

1. `findTasks(config, search)` -- searches open tasks by description substring, returns matches with file paths and line numbers
2. `completeTask(config, filePath, lineNumber)` -- marks a specific task as done by precise file+line location

The CLI `sift done` command supports both modes: search-based (`sift done "search term"`) and precise (`sift done --file "path" --line N`). Agent tools follow the same pattern.

### Notes and changelog

Freeform notes (not tasks) can be added with `addNote()` or `sift note`. Notes go under `## Journal` in the daily note by default, or under the target heading (default `## Notes`) in project and area files. Changelog entries are NOT auto-generated -- they are written deliberately during reviews via `sift note --heading '## Changelog'`.

### Review

The review system provides a summary of activity over a time period. `getReviewSummary()` (in the scanner) returns a `ReviewSummary` with:

- **Completed tasks**: tasks with a `✅` date in the review period
- **Created & still open**: tasks with a `➕` date in the period that are still open
- **Stale tasks**: open tasks with no due or scheduled date (may need triage)
- **Changelog entries**: dated summaries aggregated from all project `## Changelog` sections
- **Upcoming tasks**: tasks due in the 7 days after the review period

The default review period is "since last Friday" through today, designed for a weekly review cadence. The CLI `sift review` command accepts `--since <date>`, `--until <date>`, and `--days <N>` flags.

## Building

```bash
npm install
npm run build        # builds all packages
```

The CLI is the primary entry point. After building:
```bash
node packages/cli/dist/index.js summary
```

Or if linked globally:
```bash
sift summary
```

## Package details

### @sift/core (`packages/core/`)

Pure library, no CLI or UI. Key exports:

- **Parser**: `parseLine()`, `parseContent()`, `formatTask()`
- **Scanner**: `scanTasks()`, `scanFile()`, `getNextTasks()`, `getAgendaTasks()`, `getOverdueTasks()`, `getDueToday()`, `sortByUrgency()`, `computeUrgency()`, `isNotYetStartable()`, `getReviewSummary()`, `scanChangelog()`
- **Writer**: `addTask()`, `addTaskToFile()`, `addNote()`, `completeTask()`, `findTasks()`, `createSubnote()`, `markTaskStatus()`, `insertContentUnderHeading()`
- **Projects**: `listProjects()`, `findProject()`, `createProject()`, `createArea()`, `setProjectField()`
- **Config**: `resolveConfig()`, `writeConfig()`
- **Types**: `Task`, `TaskStatus`, `Priority`, `SiftConfig`, `TaskFilter` (includes `filePatterns?: string[]`), `NewTaskOptions`, `AddNoteOptions`, `ProjectInfo`, `ItemKind`, `CreateItemOptions`, `CreateSubnoteOptions`, `SubnoteResult`, `ChangelogEntry`, `ReviewSummary`

### @sift/cli (`packages/cli/`)

Commands: `list`, `next`, `agenda`, `today`, `overdue`, `add`, `done`, `find`, `note`, `subnote`, `mark`, `review`, `projects`, `project create`, `project path`, `project set`, `area create`, `area path`, `summary`, `init`

Uses commander.js for arg parsing and chalk for terminal output.

### Raycast extension (`packages/raycast/`)

Four commands: Task Summary, List Tasks, Up Next, Add Task. Uses `@raycast/api` React components. Vault path is configured via Raycast extension preferences.

## Code style

- TypeScript with strict mode
- ESM (`"type": "module"` in package.json)
- Node16 module resolution
- All imports use `.js` extensions (TypeScript convention for ESM)
- JSDoc comments on all public functions

## Testing

No test framework is set up yet. Tests should be added to each package as `src/__tests__/` directories using vitest or a similar ESM-compatible runner. The parser is the highest priority for unit tests since it handles the most complex logic.
