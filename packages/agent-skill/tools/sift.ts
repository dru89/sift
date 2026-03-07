import { tool } from "@opencode-ai/plugin";
import { execSync } from "child_process";

/**
 * Resolve the sift CLI command. Checks in order:
 * 1. SIFT_CLI_PATH env var (absolute path to the built CLI entry point)
 * 2. "sift" on PATH (if globally linked via `npm link`)
 *
 * The install script sets SIFT_CLI_PATH, but if sift is on your PATH
 * it will just work without any env var.
 */
function getSiftCommand(): string {
  if (process.env.SIFT_CLI_PATH) {
    return `node "${process.env.SIFT_CLI_PATH}"`;
  }
  return "sift";
}

function runSift(args: string[]): string {
  try {
    const result = execSync(`${getSiftCommand()} ${args.join(" ")}`, {
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
    all: tool.schema
      .boolean()
      .optional()
      .describe("Include completed and cancelled tasks"),
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
  description:
    "Get the most important tasks to work on right now, sorted by priority and urgency.",
  args: {
    count: tool.schema
      .number()
      .optional()
      .describe("Number of tasks to show (default: 10)"),
  },
  async execute(args) {
    const cliArgs = ["next", "--show-file"];
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
  description: "Add a new task to today's daily note in Obsidian.",
  args: {
    description: tool.schema
      .string()
      .describe("The task description"),
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
  description:
    "Mark a task as complete by searching for it. If multiple tasks match, returns the list so you can be more specific.",
  args: {
    search: tool.schema
      .string()
      .describe("Text to search for in task descriptions"),
  },
  async execute(args) {
    return runSift(["done", `"${args.search}"`]);
  },
});
