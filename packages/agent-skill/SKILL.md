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
- User wants to mark something as done

## Guidelines

- When showing tasks, present them in a clean, readable format
- Highlight overdue tasks and high-priority items
- When adding tasks, confirm what was added (description, priority, dates)
- If the user mentions wanting to do something, offer to add it as a task
- Use `sift_next` when the user wants to know what to focus on
- Use `sift_summary` for a quick overview
- When the user says something like "I need to remember to X" or "add a task to Y", use `sift_add`

## Date handling for new tasks

Tasks should **always be added to today's daily note** using `sift_add`. When the user refers to a future date (e.g. "add a task for tomorrow", "add a task for Friday", "I need to do this next week"), do NOT try to add it to that day's note. Instead:

1. **Always add to today's note** (this is what `sift_add` does by default).
2. **Set the `scheduled` parameter** to the date the user mentioned. For example:
   - "add a task for tomorrow" -> `scheduled: <tomorrow's date>`
   - "add a task for Friday" -> `scheduled: <next Friday's date>`
   - "add a task for next week" -> `scheduled: <next Monday's date>`
3. **Use `due` instead of `scheduled`** if the task sounds high-priority or has a hard deadline (e.g. "I need to do X by Friday", "this is due next Tuesday"). Use your judgment — `due` implies a deadline, `scheduled` implies "plan to work on this that day."
