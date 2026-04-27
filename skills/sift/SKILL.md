---
name: sift
description: Read, query, prioritize, and add tasks from the user's Obsidian vault using the sift CLI tool. Use this when the user asks about their tasks, wants to know what to work on next, or wants to add a new task.
---

## What I do

I help you interact with the user's Obsidian Tasks via the `sift` CLI tool and custom tools. The user manages their tasks in an Obsidian vault using the Obsidian Tasks plugin with emoji format.

## Available custom tools

The following custom tools are available for interacting with the user's tasks and vault:

**Task management:**
- **`sift_list`** - List open tasks, optionally filtered by search text, priority, due/scheduled/start date, or project/area. When `project` is an area name, automatically includes tasks from all projects linked to that area. Use `groupByProject: true` to bucket results by project.
- **`sift_agenda`** - Show tasks relevant to today: due today, overdue, scheduled for today or past, in-progress, and undated tasks from daily notes in the last 7 days. Use when the user asks "what's on my plate today?"
- **`sift_next`** - Get the most important tasks overall, sorted by urgency score (blends due date proximity, priority, scheduled date, and in-progress status)
- **`sift_summary`** - Quick overview: today's agenda, counts, and what's up next
- **`sift_add`** - Add a new task to today's daily note, or to a specific project/area. Auto-reopens "done" projects when a task is added to them.
- **`sift_find`** - Search for tasks without modifying them (use before `sift_done`, `sift_mark`, `sift_update`, or `sift_move`; pass `all: true` to include completed/cancelled)
- **`sift_done`** - Mark a task as complete (requires file+line from `sift_find`; confirm with user first; pass `description` for safety)
- **`sift_mark`** - Mark a task with any status: `in_progress`, `on_hold`, `moved`, `cancelled`, `open`, or `done` (use `sift_find` first; pass `description` for safety)
- **`sift_update`** - Modify a task's metadata in place: priority, due date, scheduled date, start date. Operates by file+line like `sift_done`. Pass "none" for a field to remove it. Use `sift_find` first; confirm with user before calling.
- **`sift_move`** - Move a task from one file to another. Removes it from the source and inserts it under the appropriate heading in the destination (## Tasks for projects/areas, ## Journal for daily notes). **Destructive operation** — always confirm with the user before calling. Auto-reopens "done" destination projects.

**Projects and areas:**
- **`sift_projects`** - List all projects and areas (with status, tags, kind). Filter by `tag` or `kind` (project/area)
- **`sift_project_create`** - Create a new project from template. Accepts `status`, `area`, `tags`, `content`, `frontmatter`
- **`sift_project_path`** - Get the absolute file path for a project (for reading/editing)
- **`sift_project_set`** - Update project/area frontmatter: `status`, `timeframe`, and/or `tags`
- **`sift_project_review`** - Stamp `lastReviewed: today` on a project or area's frontmatter. Call this after reviewing a project during a triage session.
- **`sift_area_create`** - Create a new area from template. Accepts `tags`, `content`, `frontmatter`
- **`sift_area_path`** - Get the absolute file path for an area

**Notes and content:**
- **`sift_note`** - Add a freeform note to a daily note, project, or area
- **`sift_subnote`** - Create a separate note file linked to a project or area. Use for long-form content
- **`sift_review`** - Generate a review summary (completed, created, needs triage, changelog, upcoming)
- **`sift_triage`** - Return a tiered project review summary. Tier 1: projects needing attention. Tier 2: due for review but healthy. Tier 3: not due. Plus loose daily-note orphans. Use for project review sessions.

**Graph and context (requires Obsidian to be running):**
- **`sift_graph`** - Return the structural context for an area or project: child projects, subnotes, and other linked files (emails, weblinks). Excludes daily/weekly notes. Use to orient before working on an area.

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
- User asks to review their projects, clean up tasks, or run a triage
- User wants to reschedule, reprioritize, or move a task

## Guidelines

- When showing tasks, present them in a clean, readable format
- Highlight overdue tasks and high-priority items
- When adding tasks, confirm what was added (description, priority, dates, and which file it was added to)
- If the user mentions wanting to do something, offer to add it as a task
- Use `sift_agenda` when the user asks about today — "what's on my plate?", "what's my agenda?", "what should I focus on today?"
- Use `sift_next` when the user asks about priorities overall — "what's most important?", "what should I work on next?"
- Use `sift_summary` for a quick overview (includes both agenda and next)
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

### Weekly reviews

Weekly notes live in `Weekly Notes/` and are named `YYYY-[W]WW` (e.g., `2026-W17`). Each weekly note has two layers:

1. **Narrative summary** (`## Summary`) -- an LLM-written overview of the week, split into `### Work` and `### Personal & Tooling` subsections. This is the "so what" layer: what moved forward, what decisions were made, what's coming next. Written in prose, not bullets.
2. **Dataview/Tasks queries** -- live-rendered sections (Work Log, Completed Tasks, Project Activity, Tasks Created) that pull raw data from daily notes, project changelogs, and task metadata. These are the backing evidence for the narrative.

**How to write the narrative summary:**

1. Run `sift_review` with the appropriate Mon-Sun date range for the week.
2. Read back any work log entries from the daily notes in that range for additional color.
3. Write the `### Work` section covering Disney deliverables: what progressed, key decisions or findings, who was involved (wiki-linked), and what's coming next. Include links to relevant projects, docs, and people where they add context, but don't over-link.
4. Write the `### Personal & Tooling` section covering side projects, open source, agent skills, and tool development. Same approach: what shipped or progressed, with selective wiki links.
5. Keep it concise. Each section should be 1-3 short paragraphs. The Dataview queries below have the exhaustive lists; the summary shouldn't duplicate them.

**Writing style for the narrative:**
- Write in third person using the user's first name (e.g., "Drew met with...") or use project/team as the subject. This reads better as a record than "I did X."
- Use wiki links for people (`[[Diana Jerman]]`), projects (`[[Evaluate WeaponX pipeline for Sports and News]]`), and areas (`[[Incident Management]]`) when they add navigability. Skip links for things mentioned in passing or already linked nearby.
- Be specific about outcomes, not just activities. "Confirmed SWID support is feasible but insufficient to unblock N&E" is better than "discussed SWID support."
- Don't editorialize or inflate. State what happened and what it means for next steps.

**Creating the weekly note file:**

When Periodic Notes creates the note through Obsidian, Templater resolves the date expressions in the template automatically. When creating a weekly note from an agent session, resolve the Templater expressions manually:
- `week-start` frontmatter: the Monday of that week (YYYY-MM-DD)
- `week-end` frontmatter: the Sunday of that week (YYYY-MM-DD)
- Tasks query date bounds: `done after` = day before Monday, `done before` = day after Sunday
- Prev/next links: `[[YYYY-W(WW-1)]]` and `[[YYYY-W(WW+1)]]`

Write the file to `Weekly Notes/YYYY-[W]WW.md`. The narrative goes under `## Summary`; all Dataview/Tasks code blocks are copied from the template with dates resolved.

### Project changelogs

Project files may have a `## Changelog` section with dated summary entries. These are **not auto-generated** — they are written deliberately during periodic reviews (weekly, milestone, etc.) to summarize meaningful progress.

**Do not append changelog entries when adding notes to projects.** `sift_note` adds content under the target heading and nothing else.

**When to write a changelog entry:** During a weekly review or when a significant milestone is reached, use `sift_note` with `heading: "## Changelog"` to add a summary line like:
```
- **2026-04-22:** Shipped remote access design, added vault search tools, cleaned up dead links
```

The review system (`sift_review`) aggregates existing changelog entries across projects for the review period.

**Self-referential wiki links** (e.g., `[[Project Name]]` in content written to that project's own file) are automatically stripped — you don't need to avoid them manually.

## Project triage

`sift_triage` analyzes every project and area in the vault and returns a structured summary organized into three tiers plus a loose-tasks section. Use it for periodic project reviews or when the user asks to clean up their task backlog.

### Tiers

**Tier 1 — Needs attention.** Projects with concrete problems: review is seriously overdue, high-priority tasks have stale scheduled dates, undated tasks are piling up, no activity in 4+ weeks despite active status, daily-note orphans mention this project by wiki link, or the project is marked done but still has open tasks. Each tier 1 project lists the specific signals and all open tasks sorted by urgency.

**Tier 2 — Quick check.** Projects due for review (past their review interval) but without tier 1 signals. Shows project name, open task count, last activity date, and the top two tasks by urgency. Most of these are fine and just need a `sift_project_review` stamp.

**Tier 3 — Not due.** Recently reviewed or inactive projects. Names only, grouped by status. Scan these for anything the user forgot about.

**Loose tasks.** Actionable undated tasks sitting on daily notes from the last 30 days. These have no due, scheduled, or start date, and don't live on any project or area file. They're the tasks most likely to be forgotten. If a loose task's description contains a `[[wiki link]]` to a project, the triage output notes that, and the project also gets a tier 1 "orphan mentions" signal.

### Review intervals

Each project/area has a review cadence based on its status:
- Active projects: every 7 days
- Planning projects: every 14 days
- Areas: every 14 days
- Someday projects: every 30 days
- Done projects: never (unless they have open tasks)

Projects can override the default with a `reviewInterval` field in frontmatter (value in days). A project is "due" when `today - lastReviewed >= interval`, and escalates to tier 1 at 2x the interval.

### Running a triage session

1. Call `sift_triage` to get the full summary.
2. Present tier 1 first: "These N projects need attention" with the reason for each. Ask which one to start with.
3. For each tier 1 project, show its tasks and the specific signals. Help the user decide what to do: reschedule tasks (`sift_update`), move tasks to the right project (`sift_move`), cancel stale work (`sift_mark`), change project status (`sift_project_set`), or add missing dates.
4. After resolving a project, stamp it with `sift_project_review`.
5. Present tier 2: "These N projects are due for review but look healthy." Show the one-line summaries. The user will wave through most of them. For any they want to dig into, show the full task list. Stamp reviewed projects with `sift_project_review`. Offer to bulk-stamp the rest.
6. Show tier 3 names briefly: "These are recently reviewed or on hold. Anything catch your eye?"
7. Show loose tasks: "You have N orphaned tasks from the last month." For each, suggest whether to move it to a project, schedule it, or cancel it.

Follow the user's lead on pacing. Some reviews take 5 minutes (stamp everything, move two orphans). Others take 30 (major reprioritization, status changes, new projects). Don't run a wizard — present information, make suggestions, and let the user direct the session.

### When to suggest a triage

- During standup prep, if the user hasn't run triage in over a week
- When the user asks "what should I work on?" and the answer depends on stale project context
- When the user explicitly asks for a project review or cleanup
- After a period of heavy task creation (the user just dumped a bunch of tasks and needs to organize them)

Don't suggest triage unprompted every session. Once a week during standup prep is the natural cadence.

### Confirmation patterns

**For `sift_update` and `sift_mark`:** Call `sift_find` first, show the exact task, confirm the change, then execute. One round-trip.

**For `sift_move`:** This is the most destructive operation. Always show: (1) the exact task being moved, (2) the source file, (3) the destination. Get explicit confirmation before calling.

**For `sift_project_review`:** No confirmation needed. It's a read-only status stamp. Call it directly after the user reviews a project.

**For bulk operations:** When the user wants to stamp multiple tier 2 projects as reviewed, list them all and confirm once ("Mark all 8 as reviewed?"), then call `sift_project_review` for each.

## Area-scoped task queries

When the user asks about work in an area ("what's on my plate for Sift?", "what do I have to do on Homelab?"), use `sift_list` with the area name as `project`. It automatically expands to include tasks from all projects that declare that area in their frontmatter — you don't need to enumerate them manually.

**Always use `groupByProject: true`** for area queries. This buckets tasks under their source project with a header per group, and shows `(no tasks)` for linked projects that have nothing pending. That `(no tasks)` signal is useful — it surfaces projects that exist and are planned but have no actionable tasks yet.

```
sift_list(project: "Sift", groupByProject: true)
```

Returns tasks grouped like:
```
Sift
  ○ 🔼 Support extended task statuses
  ○   Implement vault_write and vault_replace tools

Build remote access for sift
  ○ 🔽 Design and implement HTTP/SSE transport

Build triage review mode for sift
  (no tasks)
```

For a flat urgency-sorted list across the whole area, omit `groupByProject`.

## CWD project context

If the user's working directory contains a `.siftrc.json` with a `project` field, sift is aware of the associated project. The `sift_summary` output will mention this. Use this context to:
- Default suggestions toward the associated project when adding tasks
- Filter task lists to show the project's tasks when relevant
- Mention the project context when it's helpful (e.g., "You're in the MP3 Parser project")
