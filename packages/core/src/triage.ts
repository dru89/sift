import { scanTasks, sortByUrgency, scanChangelog } from "./scanner.js";
import { listProjects } from "./projects.js";
import { localToday, addDays, daysBetween } from "./dates.js";
import { type Task, type SiftConfig, type ProjectInfo, ACTIONABLE_STATUSES } from "./types.js";

// ─── Constants ───────────────────────────────────────────────

/** Default review intervals by project status and kind (in days). */
const DEFAULT_REVIEW_INTERVALS: Record<string, number> = {
  active: 7,
  planning: 14,
  area: 14,
  someday: 30,
};

/** How far back to look for daily-note orphans (days). */
const ORPHAN_LOOKBACK_DAYS = 30;

/** A scheduled date is "stale" if it's this many weeks in the past. */
const STALE_SCHEDULED_WEEKS = 4;

/** A project is "inactive" if it has no activity for this many weeks. */
const INACTIVE_WEEKS = 4;

/**
 * Suppress the undated_tasks signal on projects that had activity within
 * this many days. Active projects with a few undated backlog tasks are
 * being worked on; they'll get cleaned up naturally.
 */
const UNDATED_ACTIVITY_GRACE_DAYS = 14;

/** A project's review is "overdue" (tier 1 escalation) at 2x its interval. */
const OVERDUE_MULTIPLIER = 2;

// ─── Types ───────────────────────────────────────────────────

/**
 * Why a project was placed in tier 1.
 */
export type TriageSignal =
  | { kind: "overdue_review"; lastReviewed: string | null; intervalDays: number }
  | { kind: "stale_tasks"; count: number }
  | { kind: "undated_tasks"; count: number }
  | { kind: "inactive"; lastActivityDate: string | null; weeks: number }
  | { kind: "orphan_mentions"; count: number; tasks: Task[] }
  | { kind: "done_with_open_tasks"; openCount: number };

/**
 * A project/area in the tier 1 bucket (needs attention).
 */
export interface Tier1Project {
  project: ProjectInfo;
  signals: TriageSignal[];
  tasks: Task[];
  lastActivityDate: string | null;
}

/**
 * A project/area in the tier 2 bucket (quick check — due for review, no problems).
 */
export interface Tier2Project {
  project: ProjectInfo;
  openTaskCount: number;
  lastActivityDate: string | null;
  topTasks: Task[];
}

/**
 * Tier 3 projects grouped by status (not due for review).
 */
export interface Tier3Group {
  status: string;
  names: string[];
}

/**
 * A daily-note task that has no dates and doesn't live on a project file.
 */
export interface OrphanTask {
  task: Task;
  /** Project names mentioned via [[wiki links]] in the description, if any. */
  mentionedProjects: string[];
}

/**
 * The full triage summary returned by getTriageSummary().
 */
export interface TriageSummary {
  /** Projects/areas that need attention — have tier 1 signals. */
  tier1: Tier1Project[];
  /** Projects/areas due for review but look healthy. */
  tier2: Tier2Project[];
  /** Projects/areas not due for review, grouped by status. */
  tier3: Tier3Group[];
  /** Actionable undated tasks from recent daily notes, not on any project file. */
  looseTasks: OrphanTask[];
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate the full triage summary for the vault.
 *
 * Analyzes all projects and areas, buckets them into three tiers based on
 * review cadence and health signals, and identifies orphaned daily-note tasks.
 *
 * @param config - The sift configuration
 * @param options - Optional: `project` to get detail on a single project
 * @returns The tiered triage summary
 */
export async function getTriageSummary(
  config: SiftConfig,
  options?: { project?: string },
): Promise<TriageSummary> {
  const today = localToday();

  // Load everything we need
  const [allProjects, allTasks, changelog] = await Promise.all([
    listProjects(config),
    scanTasks(config),
    scanChangelog(config),
  ]);

  // If targeting a single project, filter to just that one
  const projects = options?.project
    ? allProjects.filter(p => p.name.toLowerCase() === options.project!.toLowerCase())
    : allProjects;

  // Index tasks by file path for fast lookup
  const tasksByFile = new Map<string, Task[]>();
  for (const task of allTasks) {
    const existing = tasksByFile.get(task.filePath) ?? [];
    existing.push(task);
    tasksByFile.set(task.filePath, existing);
  }

  // Find orphan tasks from daily notes
  const orphans = findOrphanTasks(config, allTasks, allProjects, today);

  // Build a lookup of orphans by mentioned project name
  const orphansByProject = new Map<string, OrphanTask[]>();
  for (const orphan of orphans) {
    for (const projName of orphan.mentionedProjects) {
      const existing = orphansByProject.get(projName.toLowerCase()) ?? [];
      existing.push(orphan);
      orphansByProject.set(projName.toLowerCase(), existing);
    }
  }

  // Analyze each project
  const tier1: Tier1Project[] = [];
  const tier2: Tier2Project[] = [];
  const tier3Names: Map<string, string[]> = new Map();

  for (const project of projects) {
    const fileTasks = tasksByFile.get(project.filePath) ?? [];
    const actionableTasks = fileTasks.filter(t => ACTIONABLE_STATUSES.includes(t.status));
    const effectiveStatus = project.status || (project.kind === "area" ? "area" : "active");
    const intervalDays = project.reviewInterval ?? DEFAULT_REVIEW_INTERVALS[effectiveStatus] ?? 14;

    // Check if the project is due for review
    const isDue = isReviewDue(project, intervalDays, today);
    const isOverdue = isReviewOverdue(project, intervalDays, today);

    // Compute activity signals
    const lastActivity = getLastActivityDate(project, fileTasks, changelog, today);
    const inactiveWeeks = lastActivity ? Math.floor(daysBetween(lastActivity, today) / 7) : null;

    // Gather tier 1 signals
    const signals: TriageSignal[] = [];

    // Signal: review is 2x overdue
    if (isOverdue) {
      signals.push({
        kind: "overdue_review",
        lastReviewed: project.lastReviewed ?? null,
        intervalDays,
      });
    }

    // Signal: high-priority tasks with stale scheduled dates
    const staleCutoff = addDays(today, -(STALE_SCHEDULED_WEEKS * 7));
    const staleTasks = actionableTasks.filter(t =>
      (t.priority === "highest" || t.priority === "high") &&
      t.due === null &&
      t.scheduled !== null &&
      t.scheduled < staleCutoff,
    );
    if (staleTasks.length > 0) {
      signals.push({ kind: "stale_tasks", count: staleTasks.length });
    }

    // Signal: undated tasks — projects only, and only when there's been
    // no recent activity. Areas naturally accumulate undated backlog tasks
    // ("someday/maybe" items) and shouldn't be flagged for them.
    if (project.kind === "project") {
      const undatedTasks = actionableTasks.filter(t =>
        t.due === null && t.scheduled === null && t.start === null,
      );
      const hasRecentActivity = lastActivity !== null &&
        daysBetween(lastActivity, today) < UNDATED_ACTIVITY_GRACE_DAYS;
      if (undatedTasks.length > 0 && !hasRecentActivity) {
        signals.push({ kind: "undated_tasks", count: undatedTasks.length });
      }
    }

    // Signal: marked active but no activity in INACTIVE_WEEKS
    if (
      (effectiveStatus === "active" || effectiveStatus === "area") &&
      inactiveWeeks !== null &&
      inactiveWeeks >= INACTIVE_WEEKS
    ) {
      signals.push({
        kind: "inactive",
        lastActivityDate: lastActivity,
        weeks: inactiveWeeks,
      });
    }

    // Signal: daily-note orphans that mention this project
    const mentioningOrphans = orphansByProject.get(project.name.toLowerCase()) ?? [];
    if (mentioningOrphans.length > 0) {
      signals.push({
        kind: "orphan_mentions",
        count: mentioningOrphans.length,
        tasks: mentioningOrphans.map(o => o.task),
      });
    }

    // Signal: project is "done" but still has open tasks
    if (project.status === "done" && actionableTasks.length > 0) {
      signals.push({ kind: "done_with_open_tasks", openCount: actionableTasks.length });
    }

    // Bucket the project
    if (signals.length > 0) {
      tier1.push({
        project,
        signals,
        tasks: sortByUrgency(actionableTasks),
        lastActivityDate: lastActivity,
      });
    } else if (isDue) {
      tier2.push({
        project,
        openTaskCount: actionableTasks.length,
        lastActivityDate: lastActivity,
        topTasks: sortByUrgency(actionableTasks).slice(0, 2),
      });
    } else {
      // Tier 3: group by effective status
      const groupKey = effectiveStatus === "area" ? "Areas" : capitalize(effectiveStatus);
      const names = tier3Names.get(groupKey) ?? [];
      names.push(project.name);
      tier3Names.set(groupKey, names);
    }
  }

  // Convert tier 3 map to sorted array
  const tier3: Tier3Group[] = [];
  const statusOrder = ["Active", "Areas", "Planning", "Someday", "Done"];
  for (const status of statusOrder) {
    const names = tier3Names.get(status);
    if (names && names.length > 0) {
      tier3.push({ status, names: names.sort() });
    }
  }
  // Catch any statuses not in the predefined order
  for (const [status, names] of tier3Names) {
    if (!statusOrder.includes(status) && names.length > 0) {
      tier3.push({ status, names: names.sort() });
    }
  }

  return { tier1, tier2, tier3, looseTasks: orphans };
}

// ─── Internal helpers ────────────────────────────────────────

/**
 * Find actionable tasks from recent daily notes that have no dates
 * and don't physically live on a project/area file.
 */
function findOrphanTasks(
  config: SiftConfig,
  allTasks: Task[],
  allProjects: ProjectInfo[],
  today: string,
): OrphanTask[] {
  const cutoff = addDays(today, -ORPHAN_LOOKBACK_DAYS);
  const dailyNotesPrefix = config.dailyNotesPath + "/";

  // Build a set of project/area file paths for quick exclusion
  const projectFiles = new Set(allProjects.map(p => p.filePath));

  // Build a set of project names (lowercased) for wiki-link matching
  const projectNames = new Set(allProjects.map(p => p.name.toLowerCase()));

  const orphans: OrphanTask[] = [];

  for (const task of allTasks) {
    // Must be actionable
    if (!ACTIONABLE_STATUSES.includes(task.status)) continue;

    // Must have no dates
    if (task.due !== null || task.scheduled !== null || task.start !== null) continue;

    // Must be on a daily note (not on a project/area file)
    if (!task.filePath.startsWith(dailyNotesPrefix)) continue;
    if (projectFiles.has(task.filePath)) continue;

    // Must be from a recent daily note (within ORPHAN_LOOKBACK_DAYS)
    const noteDate = extractDateFromDailyNote(task.filePath, config);
    if (!noteDate || noteDate < cutoff) continue;

    // Extract wiki-link mentions
    const mentionedProjects = extractWikiLinkProjects(task.description, projectNames);

    orphans.push({ task, mentionedProjects });
  }

  // Sort by age (oldest first — these are the most likely to be forgotten)
  return orphans.sort((a, b) => {
    const dateA = extractDateFromDailyNote(a.task.filePath, config) ?? "";
    const dateB = extractDateFromDailyNote(b.task.filePath, config) ?? "";
    return dateA.localeCompare(dateB);
  });
}

/**
 * Extract YYYY-MM-DD from a daily note file path.
 * Assumes format: "<dailyNotesPath>/YYYY-MM-DD.md"
 */
function extractDateFromDailyNote(filePath: string, config: SiftConfig): string | null {
  const basename = filePath.split("/").pop()?.replace(/\.md$/, "");
  if (!basename) return null;
  // Validate it looks like a date
  if (/^\d{4}-\d{2}-\d{2}$/.test(basename)) return basename;
  return null;
}

/**
 * Extract project names referenced via [[wiki links]] in a task description.
 * Returns only names that match known projects/areas (case-insensitive).
 */
function extractWikiLinkProjects(
  description: string,
  projectNames: Set<string>,
): string[] {
  const wikiLinkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const mentioned: string[] = [];

  let match;
  while ((match = wikiLinkPattern.exec(description)) !== null) {
    const linkTarget = match[1].trim().toLowerCase();
    if (projectNames.has(linkTarget)) {
      // Return the original casing from the link, not the lowercased version
      mentioned.push(match[1].trim());
    }
  }

  return mentioned;
}

/**
 * Determine whether a project is due for review.
 * A project is due when `today - lastReviewed >= intervalDays`,
 * or when it has never been reviewed.
 *
 * "Done" projects with no open tasks are never due.
 */
function isReviewDue(project: ProjectInfo, intervalDays: number, today: string): boolean {
  // Done projects without open tasks are never due (checked externally for open tasks)
  if (project.status === "done") return false;

  if (!project.lastReviewed) return true;

  const daysSinceReview = daysBetween(project.lastReviewed, today);
  return daysSinceReview >= intervalDays;
}

/**
 * Determine whether a project's review is seriously overdue (2x interval).
 * This is a tier 1 escalation signal.
 */
function isReviewOverdue(project: ProjectInfo, intervalDays: number, today: string): boolean {
  if (project.status === "done") return false;
  if (!project.lastReviewed) {
    // Never reviewed — overdue if created more than 2x interval ago
    if (project.created) {
      return daysBetween(project.created, today) >= intervalDays * OVERDUE_MULTIPLIER;
    }
    return true; // No created date either — assume overdue
  }

  const daysSinceReview = daysBetween(project.lastReviewed, today);
  return daysSinceReview >= intervalDays * OVERDUE_MULTIPLIER;
}

/**
 * Compute the most recent activity date for a project.
 * Activity = task completion, task creation, or changelog entry.
 */
function getLastActivityDate(
  project: ProjectInfo,
  tasks: Task[],
  allChangelog: Array<{ date: string; project: string }>,
  today: string,
): string | null {
  let latest: string | null = null;

  // Task completions
  for (const task of tasks) {
    if (task.done && (!latest || task.done > latest)) {
      latest = task.done;
    }
  }

  // Task creations
  for (const task of tasks) {
    if (task.created && (!latest || task.created > latest)) {
      latest = task.created;
    }
  }

  // Changelog entries for this project
  for (const entry of allChangelog) {
    if (entry.project === project.name && (!latest || entry.date > latest)) {
      latest = entry.date;
    }
  }

  return latest;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
