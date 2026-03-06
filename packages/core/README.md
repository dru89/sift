# @sift/core

Shared library for reading and writing Obsidian Tasks. This is the foundation that all sift interfaces (CLI, Raycast, agent tools) are built on.

## Install

This package is part of the sift monorepo. If you're working within the repo:

```bash
npm install   # from repo root
npm run build --workspace=packages/core
```

To use it from another package in the monorepo, add `"@sift/core": "*"` to your `dependencies`.

## API

### Configuration

#### `resolveConfig(overrides?): Promise<SiftConfig>`

Resolves the sift configuration by checking (in order):

1. Explicit `overrides` passed as argument
2. `SIFT_VAULT_PATH` environment variable
3. `~/.siftrc.json`
4. `./.siftrc.json`

Throws if no vault path can be determined.

```typescript
import { resolveConfig } from "@sift/core";

const config = await resolveConfig();
// or with overrides:
const config = await resolveConfig({ vaultPath: "/path/to/vault" });
```

#### `writeConfig(config): Promise<string>`

Writes a config file to `~/.siftrc.json`. Returns the path written.

```typescript
import { writeConfig } from "@sift/core";

const path = await writeConfig({
  vaultPath: "/Users/me/Documents/Vault",
  dailyNotesPath: "Daily Notes",
  dailyNotesFormat: "YYYY-MM-DD",
  excludeFolders: ["Templates", "Attachments"],
});
```

### Parsing

#### `parseLine(line, filePath, lineNumber): Task | null`

Parse a single line of markdown into a `Task` object. Returns `null` if the line isn't a valid task (i.e., doesn't match `- [ ]` or `- [x]` pattern, or is an empty checkbox).

```typescript
import { parseLine } from "@sift/core";

const task = parseLine(
  "- [ ] Write the proposal ⏫ 📅 2026-03-10",
  "Daily Notes/2026-03-06.md",
  13
);

// task = {
//   raw: "Write the proposal ⏫ 📅 2026-03-10",
//   description: "Write the proposal",
//   status: "open",
//   priority: "highest",
//   scheduled: null,
//   due: "2026-03-10",
//   start: null,
//   done: null,
//   recurrence: null,
//   filePath: "Daily Notes/2026-03-06.md",
//   line: 13,
// }
```

#### `parseContent(content, filePath): Task[]`

Parse an entire file's content and extract all tasks.

```typescript
import { parseContent } from "@sift/core";

const content = await fs.readFile("path/to/file.md", "utf-8");
const tasks = parseContent(content, "relative/path.md");
```

#### `formatTask(task): string`

Format a task back into the Obsidian Tasks emoji format. The returned string includes the `- [ ]` prefix and all emoji metadata.

```typescript
import { formatTask } from "@sift/core";

const line = formatTask({
  description: "Write the proposal",
  status: "open",
  priority: "highest",
  scheduled: null,
  due: "2026-03-10",
  start: null,
  done: null,
  recurrence: null,
});
// "- [ ] Write the proposal ⏫ 📅 2026-03-10"
```

### Scanning

#### `scanTasks(config, filter?): Promise<Task[]>`

Scan the entire vault for tasks, optionally filtering them. This walks all `.md` files, skipping excluded folders and root-level ALL_CAPS files.

```typescript
import { resolveConfig, scanTasks } from "@sift/core";

const config = await resolveConfig();

// All tasks
const all = await scanTasks(config);

// Open tasks matching a search
const filtered = await scanTasks(config, {
  status: "open",
  search: "proposal",
});

// High priority tasks due soon
const urgent = await scanTasks(config, {
  status: "open",
  minPriority: "high",
  dueBefore: "2026-03-10",
});
```

#### `scanFile(vaultPath, filePath): Promise<Task[]>`

Scan a single file for tasks.

```typescript
import { scanFile } from "@sift/core";

const tasks = await scanFile("/path/to/vault", "Daily Notes/2026-03-06.md");
```

#### `sortByUrgency(tasks): Task[]`

Sort tasks by urgency. Sort order:
1. Priority (highest first)
2. Due date (soonest first; tasks with due dates before tasks without)
3. Scheduled date (soonest first)
4. Alphabetical by description

Returns a new array (does not mutate the input).

```typescript
import { scanTasks, sortByUrgency } from "@sift/core";

const tasks = await scanTasks(config, { status: "open" });
const sorted = sortByUrgency(tasks);
```

#### `getNextTasks(config, count?): Promise<Task[]>`

Get the most important open tasks, sorted by urgency. Defaults to 10.

```typescript
import { getNextTasks } from "@sift/core";

const next5 = await getNextTasks(config, 5);
```

#### `getOverdueTasks(config): Promise<Task[]>`

Get open tasks whose due date is before today.

#### `getDueToday(config): Promise<Task[]>`

Get open tasks whose due date is today.

#### `applyFilter(tasks, filter?): Task[]`

Apply a `TaskFilter` to an array of tasks. Useful if you've already loaded tasks and want to filter in memory.

### Writing

#### `addTask(config, options): Promise<string>`

Add a new task to today's daily note under the `## Journal` heading. Creates the daily note from a template if it doesn't exist. Returns the formatted task string.

```typescript
import { resolveConfig, addTask } from "@sift/core";

const config = await resolveConfig();

const taskLine = await addTask(config, {
  description: "Review the architecture doc",
  priority: "high",
  due: "2026-03-10",
  scheduled: "2026-03-07",
});
// "- [ ] Review the architecture doc 🔼 ⏳ 2026-03-07 📅 2026-03-10"
```

#### `addTaskToFile(config, filePath, options, heading?): Promise<string>`

Add a task to a specific file. If `heading` is provided, inserts under that heading. Otherwise appends to the end of the file.

```typescript
import { addTaskToFile } from "@sift/core";

await addTaskToFile(config, "Projects/Website.md", {
  description: "Fix the login bug",
  priority: "highest",
}, "## Goals");
```

#### `completeTask(config, task): Promise<void>`

Mark a task as done by updating the checkbox to `[x]` and appending a `✅ YYYY-MM-DD` done date.

```typescript
import { scanTasks, completeTask } from "@sift/core";

const tasks = await scanTasks(config, { status: "open", search: "proposal" });
if (tasks.length === 1) {
  await completeTask(config, tasks[0]);
}
```

## Types

### `Task`

```typescript
interface Task {
  raw: string;              // Original text including emoji metadata
  description: string;      // Text with metadata stripped
  status: TaskStatus;       // "open" | "done" | "cancelled"
  priority: Priority;       // "highest" | "high" | "medium" | "low" | "lowest" | "none"
  scheduled: string | null; // YYYY-MM-DD or null
  due: string | null;       // YYYY-MM-DD or null
  start: string | null;     // YYYY-MM-DD or null
  done: string | null;      // YYYY-MM-DD or null
  recurrence: string | null;// e.g. "every week"
  filePath: string;         // Relative to vault root
  line: number;             // 1-indexed line number
}
```

### `SiftConfig`

```typescript
interface SiftConfig {
  vaultPath: string;        // Absolute path to vault root
  dailyNotesPath: string;   // Folder for daily notes, relative to vault root
  dailyNotesFormat: string; // Date format for filenames (default: "YYYY-MM-DD")
  excludeFolders: string[]; // Folders to skip when scanning
}
```

### `TaskFilter`

```typescript
interface TaskFilter {
  status?: TaskStatus;      // Filter by status
  minPriority?: Priority;   // Minimum priority level
  dueBefore?: string;       // Due on or before this date
  scheduledBefore?: string; // Scheduled on or before this date
  filePattern?: string;     // Filter by file path substring
  search?: string;          // Free-text search in description
}
```

### `NewTaskOptions`

```typescript
interface NewTaskOptions {
  description: string;
  priority?: Priority;
  due?: string;             // YYYY-MM-DD
  scheduled?: string;       // YYYY-MM-DD
  start?: string;           // YYYY-MM-DD
  recurrence?: string;      // e.g. "every week"
}
```

### `Priority`

```typescript
type Priority = "highest" | "high" | "medium" | "low" | "lowest" | "none";
```

### `TaskStatus`

```typescript
type TaskStatus = "open" | "done" | "cancelled";
```
