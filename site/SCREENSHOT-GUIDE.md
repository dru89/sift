# Screenshot & Recording Guide

This guide describes every visual asset needed for the sift website. All screenshots should use **sample data** (not real work tasks) so nothing sensitive ends up on the public site.

## Prep: Create sample data

Before capturing anything, set up a clean demo vault (or a temporary daily note with sample tasks). Something like:

```markdown
## Journal
- [ ] Write the quarterly report ⏫ ⏳ 2026-03-07 📅 2026-03-10
- [ ] Review the architecture doc 🔼 📅 2026-03-12
- [ ] Book travel for the team offsite 🔼 ⏳ 2026-03-08 📅 2026-03-14
- [ ] Read the API design proposal 📅 2026-03-15
- [ ] Weekly standup notes 🔁 every week 📅 2026-03-10
- [x] Set up CI pipeline ✅ 2026-03-06
- [x] Draft the project kickoff doc 🔼 ✅ 2026-03-05
```

And a project file or two so `sift projects` has something to show.

## Terminal settings

- Use a clean terminal profile (no custom prompts with timestamps, git branch, etc.)
- Font size: 14-16px (large enough to read in screenshots)
- Window width: ~90-100 columns (wide enough for output, not too wide)
- Light terminal theme for light screenshots, dark for dark screenshots -- or just pick one and be consistent

---

## CLI Screenshots

All captured in the terminal. Save as PNG.

### 1. `cli-summary.png`

```bash
sift summary
```

The hero screenshot for the landing page. Should show a full summary output with:
- Open/done count line
- At least 1 overdue task
- A few high-priority tasks
- 3-5 "Up Next" tasks

**Dimensions:** Full terminal width, cropped tight around the output (no extra blank lines above/below).

### 2. `cli-list.png`

```bash
sift list --show-file
```

Shows 8-12 tasks with priorities, dates, and file paths. This demonstrates the core "see all your tasks" workflow.

### 3. `cli-next.png`

```bash
sift next -n 5
```

A shorter, focused view. Good for showing the "what should I work on?" use case.

### 4. `cli-add.png`

```bash
sift add "Prepare the demo slides" --priority high --due 2026-03-14
```

Show the confirmation output ("Added task to today's daily note: ..."). If possible, also show a second add with `--project`:

```bash
sift add "Design the new API endpoint" --project "Website Redesign" --priority highest
```

### 5. `cli-add-project.png` (optional, can combine with above)

```bash
sift add "Design the new API endpoint" --project "Website Redesign" --priority highest
```

Shows the "Added task to project..." confirmation.

### 6. `cli-done.png`

```bash
sift done "quarterly report"
```

Shows the "Completed: ..." confirmation line.

### 7. `cli-note.png`

```bash
sift note "Decided to go with the event-driven approach after reviewing the trade-offs"
```

And optionally:

```bash
sift note --project "Website Redesign" "Finalized the color palette with the design team"
```

### 8. `cli-projects.png`

```bash
sift projects
```

Show 3-5 projects with statuses and tags.

### 9. `cli-find.png`

```bash
sift find "report"
```

Shows 2-3 matching tasks with file paths and line numbers.

---

## Raycast Screenshots

Capture from Raycast using Cmd+Shift+5 (or your preferred screenshot tool). Crop to the Raycast window only.

### 10. `raycast-summary.png`

The Task Summary command showing the overview: open count, overdue, due today, up next.

### 11. `raycast-list.png`

The List Tasks command showing a searchable list with task details.

### 12. `raycast-add.png`

The Add Task form showing fields: description, priority picker, due date, scheduled date.

### 13. `raycast-next.png` (optional)

The Up Next command showing prioritized tasks.

---

## Agent Demo Recording

A short screen recording (30-60 seconds) showing a conversational interaction with an AI agent using sift. This is the most compelling asset for the agent integration story.

### Recording setup
- Use OpenCode or Claude Code in a terminal
- Same clean terminal profile as screenshots
- Recording tool: QuickTime screen recording, OBS, or a terminal recorder like `vhs` (https://github.com/charmbracelet/vhs)
- Output format: MP4 (or GIF if keeping it simple)
- Resolution: 1920x1080 or 1280x720

### Script

The demo should tell a story in three acts: (1) see what's up, (2) manage tasks, (3) work with projects. Covers task management, project routing, and note-taking.

```
--- Act 1: What's going on? ---

YOU:   What's on my plate today?

AGENT: [calls sift_summary]
       You have 8 open tasks, 1 overdue, and 2 due today. Here's your summary:
       - Overdue: "Write the quarterly report" (highest priority, was due yesterday)
       - Due today: "Review the architecture doc" and "Weekly standup notes"
       I'd start with the quarterly report since it's overdue.

--- Act 2: Task management (complete + add) ---

YOU:   I actually finished that report this morning. Can you mark it done?

AGENT: [calls sift_find for "quarterly report", shows the match]
       Found it: "Write the quarterly report" in Daily Notes/2026-03-10.md, line 13.
       Mark it as done?

YOU:   Yes

AGENT: [calls sift_done with file and line]
       Done! Marked "Write the quarterly report" as complete.

--- Act 3: Project management (add task to project, add note, list projects) ---

YOU:   I need to add a task to the Website Redesign project to design the new
       API endpoint. Make it high priority, due next Friday.

AGENT: [calls sift_add with project, priority, and due date]
       Added to project "Website Redesign":
       - [ ] Design the new API endpoint 🔼 📅 2026-03-14 ➕ 2026-03-10

YOU:   Can you add a note to that project that we decided to go with REST over
       GraphQL after the team discussion?

AGENT: [calls sift_addNote with project]
       Added note to project "Website Redesign" under ## Notes:
       "Decided to go with REST over GraphQL after the team discussion."

YOU:   What projects do I have right now?

AGENT: [calls sift_projects]
       You have 3 projects:
       - Website Redesign (active, Q1)
       - Health Tracker (planning)
       - Blog Post (active, March)
```

### Tips
- Keep the interaction tight -- no long pauses or scrolling
- If using OpenCode, the sift tools will show as tool calls which is visually clear
- The key moments to highlight: seeing tasks, completing one, adding a task to a project, adding a note, listing projects
- If the recording is too long, speed it up 1.5-2x for the website
- The three-act structure (overview, task management, project management) tells a complete story

---

## Favicon / Logo

### 14. `favicon.png` (32x32)
### 15. `favicon.ico` (multi-size ICO)
### 16. `apple-touch-icon.png` (180x180)
### 17. `icon-192.png` (192x192)
### 18. `sift-icon.png` (256x256 or larger, for hero/nav)

These should all use the same sift logo/icon. If you don't have one yet, a simple wordmark or abstract icon works. The existing `images/sift.png` in the repo root might be a starting point.

---

## File naming convention

All assets go in `site/public/`. Use kebab-case:

```
site/public/
  cli-summary.png
  cli-list.png
  cli-next.png
  cli-add.png
  cli-done.png
  cli-note.png
  cli-projects.png
  cli-find.png
  raycast-summary.png
  raycast-list.png
  raycast-add.png
  raycast-next.png        (optional)
  agent-demo.mp4          (or .gif)
  sift-icon.png
  favicon.png
  favicon.ico
  apple-touch-icon.png
  icon-192.png
```
