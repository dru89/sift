---
name: sift
description: Read, query, prioritize, and add tasks from the user's Obsidian vault using the sift CLI tool. Use this when the user asks about their tasks, wants to know what to work on next, or wants to add a new task.
---

## What I do

I manage the user's tasks, projects, and conversation threads in an Obsidian vault. The vault uses the Obsidian Tasks plugin with emoji format.

## Tools

**Querying tasks:**
- `sift_list` — List open tasks with optional filters (search, priority, due/scheduled date, project/area). Use `groupByProject: true` for area queries.
- `sift_agenda` — Today's work: due/overdue, scheduled, in-progress, plus threads needing attention (active or stale).
- `sift_next` — Top tasks by urgency score across the whole vault.
- `sift_summary` — Counts and quick overview including thread status.
- `sift_find` — Search tasks without modifying. Use before `sift_done`, `sift_mark`, `sift_update`, `sift_move`. Pass `all: true` to include non-open statuses.

**Mutating tasks:**
- `sift_add` — Create a task on today's daily note or on a project/area.
- `sift_done` — Mark complete (file+line). Warns if the task has an unresolved thread.
- `sift_mark` — Set any status: `in_progress`, `on_hold`, `moved`, `cancelled`, `open`, `done`.
- `sift_update` — Change metadata in place: priority, due, scheduled, start. Pass `"none"` to remove a field.
- `sift_move` — Move a task between files. Destructive; always confirm.
- `sift_promote` — Upgrade a task to its own project. Moves the task (and thread, if any) into a new project file.

**Threads:**
- `sift_thread_create` — Start a conversation thread on a task.
- `sift_thread_entry` — Log what happened. Optionally change state and follow-up simultaneously.
- `sift_thread_state` — Change thread metadata (state, counterparts, follow-up, source) without logging an event.
- `sift_thread_list` — Show threads by state. The "waiting for" view.

**Projects and areas:**
- `sift_projects` — List all projects/areas. Filter by `tag` or `kind`.
- `sift_project_create` / `sift_area_create` — Create from template.
- `sift_project_path` / `sift_area_path` — Get absolute file path.
- `sift_project_set` — Update frontmatter (status, timeframe, tags, reviewInterval).
- `sift_project_review` — Stamp `lastReviewed: today`.

**Notes:**
- `sift_note` — Append content to a project, area, or daily note under a heading.
- `sift_subnote` — Create a separate linked note file for long-form content.

**Review and triage:**
- `sift_review` — Period summary: completed, created, stale, changelog, thread activity.
- `sift_triage` — Three-tier project health analysis plus stale threads and loose tasks.

**Vault (requires Obsidian running):**
- `vault_search` — Full-text search with line context.
- `vault_backlinks` — Files that link to a given file.
- `vault_read` — Read a file by name or path. Pass `heading` to extract only one section (e.g., `heading: "Tasks"` returns just that heading and its subheadings).
- `vault_outline` — Heading structure of a file. Use before `vault_read` with `heading` to see what sections exist.
- `sift_graph` — Structural context for a project/area: child projects, subnotes, linked files.

## Data model

**Tasks** are atomic. They're done or they're not. They live inside project files, area files, or daily notes. A task belongs to at most one container. Task names should be actions: "Refactor the login codebase", not "Login Refactoring."

**Projects** have a deliverable and a finish line. They contain tasks, notes, and context. Status can be `active`, `planning`, `someday`, or `done`. A project with zero open tasks might be complete — surface it during review, but let the user decide.

**Areas** are ongoing responsibilities with no end state. They contain tasks and projects the same way a project contains tasks. They never "complete."

**Threads** track async conversations on a task. One thread per task. If you need separate conversations with different people on the same work, split into separate tasks.

**Notes** are static reference material attached to a project or area. Every note should have a home.

## Threads

A thread represents a back-and-forth conversation with another person or team. Use one when:
- A task involves async communication and you need to track whose turn it is
- You need to remember what was sent, what was received, and when to follow up
- The conversation has artifacts (links, docs, messages) worth preserving

Do not use a thread for tasks you're doing alone or one-shot messages where no reply is expected.

### Thread states

| State | Meaning | Shows up in |
|-------|---------|-------------|
| `active` | Ball is in the user's court | Agenda (active threads section) |
| `waiting` | Ball is in someone else's court | Waiting-for views; agenda if stale |
| `paused` | Intentionally idle | Only when explicitly queried |
| `resolved` | Conversation concluded; task may still be open | Nowhere (historical record) |

### Creating a thread

When the user describes an interaction with someone ("I sent Bob the mockup," "I'm waiting on Alice's review"), determine whether this is:
1. A task being completed ("Send Bob the mockup" → mark done)
2. A step in an ongoing conversation (→ create/update a thread)

If it's a conversation, find or create the relevant task, then attach a thread:

```
sift_thread_create(file, line, counterparts: ["Bob Martinez"], state: "waiting", followUp: "2026-05-12", content: "Sent the mockup for review")
```

### Adding entries

When something happens in a thread, log it. State changes almost always accompany an entry:

- "I sent the proposal" → `state: "waiting"`, set a follow-up date
- "Bob replied with concerns" → `state: "active"` (ball back in my court)
- "Resolved over lunch" → `state: "resolved"`

```
sift_thread_entry(file, line, content: "Bob flagged concerns about token expiry", state: "active")
```

### Follow-up dates

Always set a follow-up date when moving to `waiting`. This is "when should I nudge if I haven't heard back?" Guidance:
- DMs and simple messages: 2 business days
- Document reviews: 3-5 days
- Cross-team decisions: 1 week

A waiting thread with no follow-up date becomes stale after 2 business days and surfaces in triage.

### Thread vs. task completion

A thread can resolve before the task completes. Bob gives his answer (thread resolved), but you still need to implement based on that answer (task still open). Conversely, completing a task auto-resolves any attached thread.

When the user says "Bob and I figured it out" — that resolves the thread. Ask whether the task itself is also done or if there's remaining work.

### When to promote a task

If a task accumulates multiple threads, spawns sub-tasks, or grows complex enough that it needs its own reference material, suggest promoting it to a project:

```
sift_promote(file, line, area: "Login Service", tags: ["work"])
```

The task moves into the new project file with its thread intact.

## Task placement

When adding a task, decide where it belongs:

**On a project** — it's a step toward a specific deliverable.
**On an area** — it's maintenance or one-off work in an ongoing domain.
**On the daily note** — it's a personal action item with no project context.

Don't over-route. If the connection to a project/area isn't obvious, use the daily note. Always confirm placement with the user.

## Task statuses

| Checkbox | Status | Meaning |
|----------|--------|---------|
| `- [ ]` | `open` | Not started |
| `- [/]` | `in_progress` | Actively working |
| `- [x]` | `done` | Completed |
| `- [-]` | `cancelled` | Won't do |
| `- [h]` | `on_hold` | Paused |
| `- [>]` | `moved` | Deferred elsewhere |

## Date fields

When the user references a future date, choose the right field:
- **`due`** — hard deadline. "This is due Friday."
- **`scheduled`** — self-imposed plan. "I'll do this tomorrow."
- **`start`** — can't begin until. "Blocked until Monday."

Multiple dates are fine. Always add the task to today's daily note (or its project); dates control when it surfaces, not where it lives.

## Areas vs. projects

Does it have a finish line? Project. Is it an ongoing responsibility? Area.

When querying an area, use `sift_list` with `project: "<area name>"` and `groupByProject: true`. This expands to include tasks from all linked projects.

## Confirmation patterns

- **`sift_done` and `sift_mark`**: Find first, show the task, confirm, then act.
- **`sift_move`**: Show source, destination, and the exact task. Get explicit confirmation.
- **`sift_promote`**: Confirm the task and the new project name before creating.
- **`sift_project_review`**: No confirmation needed — it's a timestamp.
- **Bulk operations**: List all targets, confirm once.

### Line stability

Mutating a task shifts line numbers below it in the same file. After each mutation in a file, re-find before acting on the next task in that file. Tasks in different files don't affect each other.

## Review and triage

**`sift_review`** shows what happened in a time window: tasks completed, tasks created, thread activity, changelog entries, stale items.

**`sift_triage`** analyzes project health:
- Tier 1: Problems (overdue review, stale tasks, inactive projects, stale threads)
- Tier 2: Due for review but healthy
- Tier 3: Not due (names only)
- Loose tasks: Undated orphans from daily notes

During triage, present tier 1 first. Help the user resolve issues: reschedule, cancel, move, or close projects. Stamp reviewed projects with `sift_project_review`.

## Writing into Obsidian

Use `[[wiki links]]` for vault references (files, people, projects). Don't nest wiki links inside markdown link display text.

Short notes (a paragraph, a few bullets) → `sift_note`.
Long-form content (design specs, meeting writeups) → `sift_subnote`.

When unsure where content goes, ask. The wrong placement means the user can't find it later.

**Don't put managed tasks in subnotes.** Subnotes are reference material (specs, meeting notes, design docs). If you need a task based on something in a subnote, add it to the parent project's `## Tasks` section and wiki-link the subnote for context. Checkboxes in subnotes that track progress within the document (e.g., "verify X works") should use `[~]` (non-task checkbox) so sift and Obsidian Tasks ignore them.

## Correcting mistakes

If you mark the wrong task done or set the wrong status:
1. `sift_find` with `status: "done"` (or the status you set) to locate it
2. `sift_mark` with `status: "open"` to restore

## Area-scoped queries

When the user asks about work in an area ("what's on my plate for Sift?"), use `sift_list` with `project: "<area name>"` and `groupByProject: true`. This expands to include tasks from all projects that declare that area in their frontmatter.

The `groupByProject` view shows `(no tasks)` for linked projects with nothing pending, which surfaces planned-but-empty projects.

## CWD project context

If the user's working directory contains a `.siftrc.json` with a `project` field, sift is aware of the associated project. Use this to:
- Default suggestions toward the associated project when adding tasks
- Mention the context when relevant ("You're in the MP3 Parser project")
- Filter task lists to the project when the user asks about "my tasks" without specifying scope

## When to use me

- User asks what to work on, what's due, or what their priorities are
- User wants to add, complete, reschedule, or organize tasks
- User describes a conversation with someone (potential thread)
- User says "I'm waiting on X" (create or update a thread)
- User wants to review progress or run project triage
- User mentions a project by name or wants to create one
- User wants to save notes, specs, or meeting content to the vault
