# Sift Raycast Extension

A [Raycast](https://raycast.com) extension for managing Obsidian Tasks.

## Setup

### Prerequisites

- [Raycast](https://raycast.com) installed
- The sift monorepo built (`npm install && npm run build` from root)

### Install the extension

From the repo root:

```bash
cd packages/raycast
npm install
```

Then open Raycast and run the "Import Extension" command, pointing it at the `packages/raycast` directory. Alternatively, use `ray develop` during development:

```bash
npx ray develop
```

### Configure

When you first use any sift command in Raycast, it will prompt you for your vault path in the extension preferences:

- **Vault Path** (required) -- absolute path to your Obsidian vault
- **Daily Notes Folder** -- folder for daily notes, relative to vault root (default: `Daily Notes`)
- **Excluded Folders** -- comma-separated list of folders to skip (default: `Templates,Attachments`)

## Commands

### Task Summary

Quick dashboard showing how many tasks are open, overdue, and high priority. Lists overdue tasks and your top 5 next tasks.

### List Tasks

Searchable list of all open tasks, sorted by priority and urgency. For each task you can:

- **Mark as Done** -- completes the task and adds a done date
- **Copy Task** -- copies the description to clipboard
- **Open in Obsidian** -- opens the file in Obsidian via `obsidian://` URL

### Up Next

Shows your most important tasks right now, sorted by priority, due date, and scheduled date.

### Add Task

A form for adding a new task to today's daily note. Fields:

- **Task** -- the description (required)
- **Priority** -- dropdown: None, Highest, High, Low, Lowest
- **Due Date** -- date picker
- **Scheduled Date** -- date picker

## Development

```bash
npx ray develop    # load in Raycast with hot reload
npx ray build      # production build
npx ray lint       # lint
```
