import { tool } from "@opencode-ai/plugin";
import { execFileSync } from "child_process";

/**
 * Resolve the sift CLI command. Checks in order:
 * 1. SIFT_CLI_PATH env var (absolute path to the built CLI entry point)
 * 2. "sift" on PATH (if globally linked via `npm link`)
 *
 * The install script sets SIFT_CLI_PATH, but if sift is on your PATH
 * it will just work without any env var.
 */
function getSiftCommand(): { command: string; prefixArgs: string[] } {
  if (process.env.SIFT_CLI_PATH) {
    return { command: "node", prefixArgs: [process.env.SIFT_CLI_PATH] };
  }
  return { command: "sift", prefixArgs: [] };
}

function runSift(args: string[]): string {
  const { command, prefixArgs } = getSiftCommand();
  try {
    const result = execFileSync(command, [...prefixArgs, ...args], {
      encoding: "utf-8",
      env: {
        ...process.env,
        // Strip color codes for cleaner output in agent context
        NO_COLOR: "1",
        FORCE_COLOR: "0",
      },
      timeout: 15000,
    });
    return result.trim();
  } catch (error: any) {
    return `Error running sift: ${error.message}`;
  }
}

/**
 * Run an Obsidian CLI command. Requires Obsidian to be running.
 */
function runObsidian(args: string[]): string {
  try {
    const result = execFileSync("obsidian", args, {
      encoding: "utf-8",
      timeout: 15000,
    });
    return result.trim();
  } catch (error: any) {
    if (error.message?.includes("ENOENT")) {
      return "Error: Obsidian CLI is not installed. Install it in Obsidian Settings → General → Command line interface.";
    }
    if (error.message?.includes("ETIMEDOUT")) {
      return "Error: Obsidian CLI timed out. Make sure Obsidian is running.";
    }
    const stderr = error.stderr?.toString()?.trim();
    if (stderr) return `Error: ${stderr}`;
    return `Error running obsidian: ${error.message}`;
  }
}

export const list = tool({
  description:
    "List open tasks from the Obsidian vault. Returns tasks sorted by priority and urgency.",
  args: {
    search: tool.schema
      .string()
      .optional()
      .describe("Filter tasks by text in description"),
    priority: tool.schema
      .enum(["highest", "high", "low", "lowest"])
      .optional()
      .describe("Minimum priority level to show"),
    dueBefore: tool.schema
      .string()
      .optional()
      .describe("Only show tasks due on or before this date (YYYY-MM-DD)"),
    scheduledBefore: tool.schema
      .string()
      .optional()
      .describe("Only show tasks scheduled on or before this date (YYYY-MM-DD)"),
    all: tool.schema
      .boolean()
      .optional()
      .describe("Include completed and cancelled tasks"),
    project: tool.schema
      .string()
      .optional()
      .describe("Only show tasks from this project's file (case-insensitive project name)"),
  },
  async execute(args) {
    const cliArgs = ["list", "--show-file", "--absolute"];
    if (args.search) cliArgs.push("--search", args.search);
    if (args.priority) cliArgs.push("--priority", args.priority);
    if (args.dueBefore) cliArgs.push("--due-before", args.dueBefore);
    if (args.scheduledBefore) cliArgs.push("--scheduled-before", args.scheduledBefore);
    if (args.all) cliArgs.push("--all");
    if (args.project) cliArgs.push("--project", args.project);
    return runSift(cliArgs);
  },
});

export const next = tool({
  description:
    "Get the most important tasks to work on right now, sorted by priority and urgency.",
  args: {
    count: tool.schema
      .number()
      .optional()
      .describe("Number of tasks to show (default: 10)"),
  },
  async execute(args) {
    const cliArgs = ["next", "--show-file", "--absolute"];
    if (args.count) cliArgs.push("-n", String(args.count));
    return runSift(cliArgs);
  },
});

export const summary = tool({
  description:
    "Quick overview of task status: open count, overdue, due today, high priority, and what's up next.",
  args: {},
  async execute() {
    return runSift(["summary"]);
  },
});

export const add = tool({
  description:
    "Add a new task to today's daily note or to a specific project in Obsidian. Use the 'project' parameter to add directly to a project file instead of the daily note.",
  args: {
    description: tool.schema.string().describe("The task description"),
    priority: tool.schema
      .enum(["highest", "high", "low", "lowest"])
      .optional()
      .describe("Task priority level"),
    due: tool.schema
      .string()
      .optional()
      .describe("Due date in YYYY-MM-DD format"),
    scheduled: tool.schema
      .string()
      .optional()
      .describe("Scheduled date in YYYY-MM-DD format"),
    start: tool.schema
      .string()
      .optional()
      .describe("Start date in YYYY-MM-DD format"),
    recurrence: tool.schema
      .string()
      .optional()
      .describe("Recurrence rule, e.g. 'every week', 'every month'"),
    project: tool.schema
      .string()
      .optional()
      .describe(
        "Name of the project to add this task to. If omitted, the task goes to today's daily note.",
      ),
    date: tool.schema
      .string()
      .optional()
      .describe(
        "Target daily note date in YYYY-MM-DD format. Defaults to today. Ignored when project is set.",
      ),
  },
  async execute(args) {
    const cliArgs = ["add"];
    if (args.priority) cliArgs.push("--priority", args.priority);
    if (args.due) cliArgs.push("--due", args.due);
    if (args.scheduled) cliArgs.push("--scheduled", args.scheduled);
    if (args.start) cliArgs.push("--start", args.start);
    if (args.recurrence) cliArgs.push("--recurrence", args.recurrence);
    if (args.project) cliArgs.push("--project", args.project);
    if (args.date) cliArgs.push("--date", args.date);
    cliArgs.push("--", args.description);
    return runSift(cliArgs);
  },
});

export const find = tool({
  description:
    "Search for open tasks matching a query without modifying them. Returns matching tasks with file paths and line numbers. Use this before sift_done to preview which task will be completed.",
  args: {
    search: tool.schema
      .string()
      .describe("Text to search for in task descriptions (tokenized: each word matched independently, markdown syntax stripped)"),
    all: tool.schema
      .boolean()
      .optional()
      .describe("Include completed and cancelled tasks (default: only open/in_progress)"),
  },
  async execute(args) {
    const cliArgs = ["find", "--show-file", "--absolute"];
    if (args.all) cliArgs.push("--all");
    cliArgs.push("--", args.search);
    return runSift(cliArgs);
  },
});

export const done = tool({
  description:
    "Mark a task as complete. Supports two modes: (1) search mode — pass 'search' to find and complete by description, or (2) precise mode — pass 'file' and 'line' to complete an exact task. Prefer precise mode after using sift_find to identify the task.",
  args: {
    search: tool.schema
      .string()
      .optional()
      .describe(
        "Text to search for in task descriptions. Use this OR file+line, not both.",
      ),
    file: tool.schema
      .string()
      .optional()
      .describe(
        "Absolute file path for precise completion (also accepts vault-relative). Must be used with 'line'.",
      ),
    line: tool.schema
      .number()
      .optional()
      .describe(
        "Line number (1-indexed) for precise completion. Must be used with 'file'.",
      ),
    description: tool.schema
      .string()
      .optional()
      .describe(
        "Partial task text for safety verification. Pass a few words from the task description to confirm the right task is at this line.",
      ),
  },
  async execute(args) {
    // Precise mode: file + line
    if (args.file && args.line) {
      const cliArgs = [
        "done",
        "--file",
        args.file,
        "--line",
        String(args.line),
      ];
      if (args.description) cliArgs.push("--description", args.description);
      return runSift(cliArgs);
    }

    // Search mode
    if (args.search) {
      return runSift(["done", "--", args.search]);
    }

    return "Error: provide either 'search' or both 'file' and 'line'";
  },
});

export const projects = tool({
  description:
    "List all projects in the vault. Returns project names, statuses, and tags.",
  args: {
    tag: tool.schema
      .string()
      .optional()
      .describe("Filter to only show projects with this tag"),
    kind: tool.schema
      .enum(["project", "area"])
      .optional()
      .describe("Filter by kind: 'project' or 'area'. If omitted, returns both."),
  },
  async execute(args) {
    const cliArgs = ["projects"];
    if (args.tag) cliArgs.push("--tag", args.tag);
    if (args.kind) cliArgs.push("--kind", args.kind);
    return runSift(cliArgs);
  },
});

export const project_create = tool({
  description: "Create a new project from the vault's project template.",
  args: {
    name: tool.schema
      .string()
      .describe("The project name (becomes the filename)"),
  },
  async execute(args) {
    return runSift(["project", "create", "--absolute", "--", args.name]);
  },
});

export const project_path = tool({
  description:
    "Get the absolute file path for a project. Useful when you need to read or edit a project file directly.",
  args: {
    name: tool.schema
      .string()
      .describe("The project name to look up"),
  },
  async execute(args) {
    return runSift(["project", "path", "--absolute", "--", args.name]);
  },
});

export const area_create = tool({
  description: "Create a new area from the vault's area template.",
  args: {
    name: tool.schema
      .string()
      .describe("The area name (becomes the filename)"),
  },
  async execute(args) {
    return runSift(["area", "create", "--absolute", "--", args.name]);
  },
});

export const area_path = tool({
  description:
    "Get the absolute file path for an area. Useful when you need to read or edit an area file directly.",
  args: {
    name: tool.schema
      .string()
      .describe("The area name to look up"),
  },
  async execute(args) {
    return runSift(["area", "path", "--absolute", "--", args.name]);
  },
});

export const note = tool({
  description:
    "Add a freeform note to today's daily note or to a project. Use this for non-task content like observations, decisions, meeting notes, or project updates.",
  args: {
    content: tool.schema
      .string()
      .describe("The note content (can be multi-line)"),
    project: tool.schema
      .string()
      .optional()
      .describe(
        "Name of the project to add the note to. If omitted, the note goes to today's daily note.",
      ),
    heading: tool.schema
      .string()
      .optional()
      .describe(
        "The heading to insert the note under. Defaults to '## Notes' for projects, '## Journal' for daily notes. Use this to target any heading in the file (e.g., '## Work Log', '## Meeting Notes', '## Goals'). If the heading doesn't exist, it will be created.",
      ),
    date: tool.schema
      .string()
      .optional()
      .describe(
        "Target daily note date in YYYY-MM-DD format. Defaults to today. Ignored when project is set.",
      ),
  },
  async execute(args) {
    const cliArgs = ["note"];
    if (args.project) cliArgs.push("--project", args.project);
    if (args.heading) cliArgs.push("--heading", args.heading);
    if (args.date) cliArgs.push("--date", args.date);
    cliArgs.push("--", args.content);
    return runSift(cliArgs);
  },
});

export const subnote = tool({
  description:
    "Create a new note file linked to a project. Use this instead of sift_note when the content is long (>20 lines), self-contained (design spec, meeting notes, API reference), or has a different lifecycle than the project file itself. Creates the file and inserts a wiki link in the project. To also create a trackable task, call sift_add separately with a wiki link to the subnote in the description. The return value includes the wiki link name for easy reference.",
  args: {
    project: tool.schema
      .string()
      .describe("Name of the project to link this note to."),
    title: tool.schema
      .string()
      .describe(
        "Title for the subnote. Used in the filename (YYYY-MM-DD - <title>.md) and as a heading.",
      ),
    content: tool.schema
      .string()
      .optional()
      .describe("The content of the subnote (can be multi-line markdown)."),
    folder: tool.schema
      .string()
      .optional()
      .describe(
        "Folder to create the note in, relative to vault root. Defaults to 'Notes'. Use 'Meetings' for meeting notes.",
      ),
    type: tool.schema
      .string()
      .optional()
      .describe(
        "Frontmatter type field. Defaults to 'note'. Use 'meeting' for meeting notes.",
      ),
    tags: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("Tags to add to the subnote frontmatter."),
    heading: tool.schema
      .string()
      .optional()
      .describe(
        "Heading in the project file to insert the backlink under. Defaults to '## Notes'.",
      ),
  },
  async execute(args) {
    const cliArgs = ["subnote", "--absolute"];
    cliArgs.push("--project", args.project);
    if (args.content) cliArgs.push("--content", args.content);
    if (args.folder) cliArgs.push("--folder", args.folder);
    if (args.type) cliArgs.push("--type", args.type);
    if (args.tags && args.tags.length > 0) cliArgs.push("--tags", ...args.tags);
    if (args.heading) cliArgs.push("--heading", args.heading);
    cliArgs.push("--", args.title);
    return runSift(cliArgs);
  },
});

export const project_set = tool({
  description:
    "Update frontmatter fields on a project or area (status, timeframe, tags). Use this to change a project's or area's status (active, planning, someday, done), timeframe, or tags.",
  args: {
    name: tool.schema.string().describe("The project name"),
    status: tool.schema
      .enum(["active", "planning", "someday", "done"])
      .optional()
      .describe("New project status"),
    timeframe: tool.schema
      .string()
      .optional()
      .describe("New project timeframe (e.g. 'Q2 2026')"),
    tags: tool.schema
      .array(tool.schema.string())
      .optional()
      .describe("New tag list (replaces existing tags)"),
  },
  async execute(args) {
    const cliArgs = ["project", "set"];
    if (args.status) cliArgs.push("--status", args.status);
    if (args.timeframe) cliArgs.push("--timeframe", args.timeframe);
    if (args.tags && args.tags.length > 0) cliArgs.push("--tags", ...args.tags);
    cliArgs.push("--", args.name);
    return runSift(cliArgs);
  },
});

export const mark = tool({
  description:
    "Mark a task with any status (in_progress, on_hold, moved, cancelled, open, done). Supports two modes: (1) search mode — pass 'search' to find and mark by description, or (2) precise mode — pass 'file' and 'line'. Prefer precise mode after using sift_find.",
  args: {
    status: tool.schema
      .enum(["open", "in_progress", "on_hold", "moved", "cancelled", "done"])
      .describe("The new status to set on the task"),
    search: tool.schema
      .string()
      .optional()
      .describe("Text to search for in task descriptions. Use this OR file+line, not both."),
    file: tool.schema
      .string()
      .optional()
      .describe("Absolute file path for precise targeting (also accepts vault-relative). Must be used with 'line'."),
    line: tool.schema
      .number()
      .optional()
      .describe("Line number (1-indexed) for precise targeting. Must be used with 'file'."),
    description: tool.schema
      .string()
      .optional()
      .describe("Partial task text for safety verification. Pass a few words from the task description to confirm the right task is at this line."),
  },
  async execute(args) {
    const cliArgs = ["mark", "--status", args.status];
    if (args.file && args.line) {
      cliArgs.push("--file", args.file, "--line", String(args.line));
      if (args.description) cliArgs.push("--description", args.description);
    } else if (args.search) {
      cliArgs.push("--", args.search);
    } else {
      return "Error: provide either 'search' or both 'file' and 'line'";
    }
    return runSift(cliArgs);
  },
});

export const review = tool({
  description:
    "Generate a review summary for a time period. Shows tasks completed, tasks created (still open), stale tasks (no dates), project changelog entries, and upcoming tasks. Defaults to since last Friday.",
  args: {
    since: tool.schema
      .string()
      .optional()
      .describe("Start of review period (YYYY-MM-DD). Defaults to last Friday."),
    until: tool.schema
      .string()
      .optional()
      .describe("End of review period (YYYY-MM-DD). Defaults to today."),
    days: tool.schema
      .number()
      .optional()
      .describe("Review the last N days (alternative to --since)"),
  },
  async execute(args) {
    const cliArgs = ["review", "--absolute"];
    if (args.days) cliArgs.push("--days", String(args.days));
    else if (args.since) cliArgs.push("--since", args.since);
    if (args.until) cliArgs.push("--until", args.until);
    return runSift(cliArgs);
  },
});

// ─── Obsidian CLI tools ──────────────────────────────────────

export const vault_search = tool({
  description:
    "Full-text search across the entire Obsidian vault. Returns matching file paths with line numbers and surrounding context. Requires Obsidian to be running.",
  args: {
    query: tool.schema.string().describe("Search query text."),
    path: tool.schema
      .string()
      .optional()
      .describe(
        "Optional folder path to limit search scope (e.g., 'Projects', 'Daily Notes').",
      ),
    limit: tool.schema
      .number()
      .optional()
      .describe("Maximum number of files to return."),
  },
  async execute(args) {
    const cliArgs = ["search:context", `query=${args.query}`, "format=json"];
    if (args.path) cliArgs.push(`path=${args.path}`);
    if (args.limit) cliArgs.push(`limit=${String(args.limit)}`);
    return runObsidian(cliArgs);
  },
});

export const vault_backlinks = tool({
  description:
    "List all files that link to a given file. Useful for finding related daily notes, meetings, and project references. Requires Obsidian to be running.",
  args: {
    file: tool.schema
      .string()
      .describe(
        "File name to find backlinks for. Uses wikilink-style resolution (e.g., 'Sift' finds 'Projects/Sift.md').",
      ),
    counts: tool.schema
      .boolean()
      .optional()
      .describe("Include link counts per file."),
  },
  async execute(args) {
    const cliArgs = ["backlinks", `file=${args.file}`, "format=json"];
    if (args.counts) cliArgs.push("counts");
    return runObsidian(cliArgs);
  },
});

export const vault_read = tool({
  description:
    "Read the contents of a vault file by name (wikilink-style resolution) or exact path. Requires Obsidian to be running.",
  args: {
    file: tool.schema
      .string()
      .describe(
        "File name (wikilink-style resolution, e.g., 'Sift' finds 'Projects/Sift.md') or exact path.",
      ),
  },
  async execute(args) {
    const paramName = args.file.includes("/") ? "path" : "file";
    return runObsidian(["read", `${paramName}=${args.file}`]);
  },
});

export const vault_outline = tool({
  description:
    "Show the heading structure of a vault file. Returns a tree of headings with their levels. Useful for understanding file structure before reading specific sections. Requires Obsidian to be running.",
  args: {
    file: tool.schema
      .string()
      .describe("File name (wikilink-style resolution) or exact path."),
  },
  async execute(args) {
    const paramName = args.file.includes("/") ? "path" : "file";
    return runObsidian(["outline", `${paramName}=${args.file}`, "format=json"]);
  },
});
