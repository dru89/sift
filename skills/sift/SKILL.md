---
name: sift
description: Read, query, prioritize, and add tasks from the user's Obsidian vault using the sift CLI tool. Use this when the user asks about their tasks, wants to know what to work on next, or wants to add a new task.
---

## What I do

I help you interact with the user's Obsidian Tasks via the `sift` CLI tool and custom tools. The user manages their tasks in an Obsidian vault using the Obsidian Tasks plugin with emoji format.

## Available custom tools

The following custom tools are available for interacting with the user's tasks and vault:

**Task management:**
- **`sift_list`** - List open tasks, optionally filtered by search text, priority, due/scheduled/start date, or project/area
- **`sift_next`** - Get the most important tasks to work on right now (sorted by priority + urgency; future-start tasks are deprioritized)
- **`sift_summary`** - Quick overview: open count, overdue, due today, high priority, not yet startable, and up next
- **`sift_add`** - Add a new task to today's daily note, or to a specific project/area
- **`sift_find`** - Search for tasks without modifying them (use before `sift_done` or `sift_mark`; pass `all: true` to include completed/cancelled)
- **`sift_done`** - Mark a task as complete (requires file+line from `sift_find`; confirm with user first; pass `description` for safety)
- **`sift_mark`** - Mark a task with any status: `in_progress`, `on_hold`, `moved`, `cancelled`, `open`, or `done` (use `sift_find` first; pass `description` for safety)

**Projects and areas:**
- **`sift_projects`** - List all projects and areas (with status, tags, kind). Filter by `tag` or `kind` (project/area)
- **`sift_project_create`** - Create a new project from template. Accepts `status`, `area`, `tags`, `content`, `frontmatter`
- **`sift_project_path`** - Get the absolute file path for a project (for reading/editing)
- **`sift_project_set`** - Update project/area frontmatter: `status`, `timeframe`, and/or `tags`
- **`sift_area_create`** - Create a new area from template. Accepts `tags`, `content`, `frontmatter`
- **`sift_area_path`** - Get the absolute file path for an area

**Notes and content:**
- **`sift_note`** - Add a freeform note to a daily note, project, or area
- **`sift_subnote`** - Create a separate note file linked to a project or area. Use for long-form content
- **`sift_review`** - Generate a review summary (completed, created, stale, changelog, upcoming)

**Vault search (requires Obsidian to be running):**
- **`vault_search`** - Full-text search across the vault with line context
- **`vault_backlinks`** - List all files that link to a given file
- **`vault_read`** - Read a vault file by name (wikilink-style resolution) or path
- **`vault_outline`** - Show the heading structure of a vault file

## Areas vs Projects

The vault distinguishes between **areas** and **projects**:

- **Areas** are persistent responsibilities with no finish line — tools you maintain, domains you own. They live in `Areas/` with `type: area` in frontmatter. Examples: Sift, doc-tools, Incident Management. Areas don't have a `status` field.
- **Projects** are finite work with a deliverable that can be completed. They live in `Projects/` with `type: project`. Projects have `status` (active, planning, someday, done) and optionally an `area` field linking to a parent area. Name projects as actions: "Build X", "Write Y", "Evaluate Z".

When creating something new: does it have a finish line? If yes → project (`sift_project_create`). If it's ongoing → area (`sift_area_create`).

## Task statuses

Tasks use Obsidian checkbox characters for status:

| Checkbox | Status | Meaning |
|----------|--------|---------|
| `- [ ]` | `open` | Not yet started |
| `- [/]` | `in_progress` | Actively being worked on |
| `- [x]` | `done` | Completed (gets a `✅` date) |
| `- [-]` | `cancelled` | Cancelled / won't do |
| `- [h]` | `on_hold` | Paused, waiting on something |
| `- [>]` | `moved` | Moved elsewhere or deferred |

The **actionable** statuses are `open` and `in_progress` — these appear in `sift list`, `sift next`, `sift find`, and `sift summary`.

Use `sift_mark` to change a task's status. Use `sift_done` as a shortcut for marking complete.

## Task format

Tasks use the Obsidian Tasks emoji format:
- See status table above for checkbox formats
- `⏫` highest priority, `🔼` high, `🔽` low
- `⏳ YYYY-MM-DD` scheduled date
- `📅 YYYY-MM-DD` due date
- `🛫 YYYY-MM-DD` start date
- `✅ YYYY-MM-DD` completion date
- `🔁 every week` recurrence

## When to use me

- User asks "what should I work on?" or "what's on my plate?"
- User asks about overdue or upcoming tasks
- User says "add a task" or "remind me to..." or "I need to..."
- User asks about their priorities or task status
- User wants to mark something as done, in progress, or deferred
- User mentions a project or wants to create one

## Guidelines

- When showing tasks, present them in a clean, readable format
- Highlight overdue tasks and high-priority items
- When adding tasks, confirm what was added (description, priority, dates, and which file it was added to)
- If the user mentions wanting to do something, offer to add it as a task
- Use `sift_next` when the user wants to know what to focus on
- Use `sift_summary` for a quick overview
- When the user says something like "I need to remember to X" or "add a task to Y", use `sift_add`

## Writing task descriptions

Task descriptions are written into Obsidian markdown files, so use **Obsidian syntax** when appropriate:

- **Use wiki links for vault references.** When a task references a file, note, or page in the vault, use Obsidian's `[[wiki link]]` syntax instead of backticks or markdown links. For example:
  - "Review the [[Health Tracker/_shortcut-log]] blueprint" -- not `` `Health Tracker/_shortcut-log.md` ``
  - "Update [[Meeting Notes/2026-03-10]]" -- not `Meeting Notes/2026-03-10.md`
  - You can drop the `.md` extension in wiki links; Obsidian resolves them automatically.
- **Use wiki links for people too**, if the user appears to reference people as notes (e.g., `[[John Smith]]`).
- **Don't overuse wiki links.** Only use them when referencing something that is (or could be) a note in the vault. Generic text, code snippets, and external references should stay as-is.

## Task placement

When the user asks you to add a task, decide where it belongs:

**On a project** — when it's part of a defined piece of finite work. "Design the API endpoints" goes on the "Build HTTP API" project. The project represents the effort; the task is a step within it.

**On an area** — when it's maintenance or small work related to an ongoing responsibility but not part of any specific project. "Fix the timezone bug in sift," "update the teams-archive README," "investigate a user-reported issue." These are directly tied to an area but don't warrant a project.

**On the daily note** — when it's a personal action item not tied to any project or area. "Read the AI Architecture doc," "follow up with Rob about the proposal," "schedule a meeting with the commerce team."

**Decision flow:**
1. **Check for project context.** If the current working directory has a `.siftrc.json` with a `project` field, the user is likely working in that project. Mention this context.
2. **Is it clearly part of an active project?** If the task references a project by name or relates to a known project's scope, suggest that project.
3. **Is it related to an area but not a specific project?** Suggest the area. "This sounds like a task for the Sift area — should I add it there?"
4. **Not sure?** Add it to the daily note. Don't over-suggest — only route to a project or area when there's a clear connection.
5. **Always confirm.** Never silently route a task to a project or area. Present your suggestion and let the user confirm:
   - "This sounds like it belongs to **Build HTTP API for remote sift access**. Should I add it there, or to today's daily note?"
   - "This seems like a Sift area task — add it there?"

## Where to put notes and content

When the user asks you to save notes, context, or other content to the vault, the right destination depends on scope and intent:

**Quick notes, observations, decisions** (a paragraph, a few bullets) → `sift_note` appended to the project or area under `## Notes` or a custom heading.

**Long-form or self-contained content** (design specs, API references, meeting writeups — roughly >20 lines) → `sift_subnote` to create a separate linked note file. The return value includes the wiki link name so you can reference it in tasks or other notes.

**When the scope is ambiguous — ask.** If the user says "save these notes about the HTTP API" and you're not sure whether it should be:
- A note appended to the Sift area (capturing an idea)
- A subnote (documenting a design)
- A new project (planning a significant effort)

Then ask: "Should I add this as a note on the Sift area, create a separate design doc linked from Sift, or start a new project for this?" Don't guess when the user's intent isn't clear — the wrong choice means content ends up in a place they wouldn't look for it.

**Default when truly unsure:** Append to the relevant area or project with `sift_note`. It's the lowest-commitment option — content can always be extracted to a subnote or promoted to a project later.

**Specific content types:**
- **Meeting notes**: Always create a separate file in `Meetings/` using `sift_subnote` with `folder: "Meetings"` and `type: "meeting"`. Link it from the relevant project or area. Do not inline full meeting notes.
- **Reference material**: Use the `reference/` subdirectory pattern (e.g., `Projects/reference/project-name/`) for fetched documents, imported files, and other external reference material.

The goal is to keep project and area files readable — an overview, goals, tasks, short notes, and links to related content. If a section grows past ~30 lines of prose, it probably wants to be its own subnote.

## Reading and editing project and area files

When the user asks you to "check out" a project, look at project notes, or references a specific project by name, use the sift tools to find and read it:

1. Use `sift_projects` to list all projects (to confirm the project name if needed)
2. Use `sift_project_path` to get the absolute file path for the project
3. Read or edit the file directly using the path from `sift_project_path`

This lets you:
- Read the project file to understand its current state, goals, and notes
- Make direct edits to any section of the project
- Check what tasks, notes, or goals already exist

All paths returned by sift tools (including `sift_find`, `sift_list`, `sift_next`, `sift_review`) are **absolute paths** that can be used directly for file operations. These same absolute paths are accepted by `sift_done` and `sift_mark` when targeting tasks.

## Date handling for new tasks

Tasks should **always be added to today's daily note** using `sift_add` (unless they belong to a project). When the user refers to a future date (e.g. "add a task for tomorrow", "add a task for Friday", "I need to do this next week"), do NOT try to add it to that day's note. Instead:

1. **Always add to today's note** (this is what `sift_add` does by default).
2. **Choose the right date field** based on the user's intent:
   - **`start`** — the earliest date the task *can* be worked on. Use when the user says things like "I can't start this until Monday", "this is blocked until next week", "not available until after the 15th", or "don't worry about this until Friday." Tasks with a future start date are deprioritized in `sift next` — they still appear, but below tasks that are ready now.
   - **`scheduled`** — when you *plan* to work on it. Use for "add a task for tomorrow", "I'll do this Friday", "schedule this for next week." This is a self-imposed intention, not a hard constraint.
   - **`due`** — when the task *must* be done by. Use for hard deadlines: "this is due Friday", "I need to finish this by next Tuesday", "deadline is March 10th."
3. **Multiple dates are fine.** A task can have both a start date and a due date (e.g., "I can't start this until Monday but it's due Wednesday" → `start: Monday, due: Wednesday`). Or a start and a scheduled date.
4. **When in doubt between start and scheduled:** If the constraint is external (blocked by someone else, waiting on a dependency, calendar-driven), use `start`. If it's the user's own plan for when to tackle it, use `scheduled`.

## Review

Use `sift_review` to generate a review summary for any time period. It defaults to since last Friday through today, but the period is fully flexible.

**What the review shows:**
- **Completed tasks** -- tasks with a `✅` date in the review period
- **Created & still open** -- tasks with a `➕` date in the period that are still actionable
- **Project notes** -- changelog entries from project files during the period
- **New notes** -- non-task vault files (meetings, weblinks, etc.) dated within the period
- **Deferred** -- tasks marked `on_hold` or `moved` that were created during the period
- **Stale tasks** -- actionable tasks with no due, scheduled, or start date (may need triage)
- **Upcoming** -- tasks due in the 7 days after the review period

**Parameters:**
- `since` -- start date (YYYY-MM-DD), defaults to last Friday
- `until` -- end date (YYYY-MM-DD), defaults to today
- `days` -- review the last N days (alternative to `since`)

**When to use:**
- User asks "what did I do this week?" or "weekly review" -- use defaults
- User asks "what's happened the last 3 days?" -- use `days: 3`
- User asks "what's happened since Monday?" -- use `since` with Monday's date
- User asks "review March" -- use `since` and `until` for the month range
- User wants to reflect on recent progress across projects

### Project changelogs

Project files may have a `## Changelog` section with dated summary entries. These are **not auto-generated** — they are written deliberately during periodic reviews (weekly, milestone, etc.) to summarize meaningful progress.

**Do not append changelog entries when adding notes to projects.** `sift_note` adds content under the target heading and nothing else.

**When to write a changelog entry:** During a weekly review or when a significant milestone is reached, use `sift_note` with `heading: "## Changelog"` to add a summary line like:
```
- **2026-04-22:** Shipped remote access design, added vault search tools, cleaned up dead links
```

The review system (`sift_review`) aggregates existing changelog entries across projects for the review period.

**Self-referential wiki links** (e.g., `[[Project Name]]` in content written to that project's own file) are automatically stripped — you don't need to avoid them manually.

## CWD project context

If the user's working directory contains a `.siftrc.json` with a `project` field, sift is aware of the associated project. The `sift_summary` output will mention this. Use this context to:
- Default suggestions toward the associated project when adding tasks
- Filter task lists to show the project's tasks when relevant
- Mention the project context when it's helpful (e.g., "You're in the MP3 Parser project")
