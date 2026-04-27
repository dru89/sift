# Urgency Model

Sift uses an additive urgency score to rank tasks. Each task's score is the sum of independent components. Higher score = more urgent. The model is inspired by [Obsidian Tasks' urgency](https://publish.obsidian.md/tasks/Advanced/Urgency) (itself derived from [Taskwarrior](https://taskwarrior.org/docs/urgency.html)) but diverges in how it handles scheduled dates.

## Components

### Due date (strongest signal, 0.0–12.0)

Deadlines create real time pressure. The score ramps linearly over a 14-day window:

- **7+ days overdue**: 12.0 (capped — stays high until you act or the review flags it)
- **Due today**: ~8.8
- **14+ days away**: 2.4 (floor — having a deadline at all is worth something)
- **No due date**: 0.0

Overdue tasks cap at 12.0 rather than continuing to climb. A task due yesterday and a task due 6 months ago score the same. This is intentional: the scoring function can't tell whether a missed deadline is genuinely urgent or stale. That's a review-time decision, not a ranking-time one.

### Priority (-2.0–9.0)

Priority sets the baseline importance. A highest-priority task with no due date (9.0) is outranked by a no-priority task due today (~10.8). This is deliberate — deadlines are harder constraints than labels.

| Priority | Score |
|----------|-------|
| Highest  |  9.0  |
| High     |  6.0  |
| None     |  2.0  |
| Low      |  0.0  |
| Lowest   | -2.0  |

### Scheduled date (0.0–5.0, decays)

This is where sift diverges from Obsidian Tasks. Their model gives a flat +5.0 to anything scheduled today or earlier. Ours decays past scheduled dates:

- **Scheduled for today**: 5.0
- **Scheduled in the past**: decays linearly from 5.0 to 0.0 over 4 weeks
- **Scheduled in the future** or no date: 0.0

The rationale: a scheduled date is a self-imposed plan, not a hard constraint. If you scheduled something for 2 months ago and never did it, your behavior is a stronger signal than the date you originally picked. The task doesn't disappear — it still has its priority score — but the stale scheduled date stops inflating its urgency.

### Start date (-3.0 or 0.0)

Start date is purely a penalty for tasks you can't work on yet:

- **Future start**: -3.0 (pushes task down)
- **Today, past, or no date**: 0.0

### In-progress boost (+3.0)

Tasks marked `[/]` (in_progress) get a +3.0 boost. If you've already started something, it should rank higher than equivalent tasks you haven't touched.

## How scores combine

The components are summed. Some examples:

| Task | Due | Priority | Scheduled | Start | In-progress | Total |
|------|-----|----------|-----------|-------|-------------|-------|
| PR follow-up, scheduled today | — | none (2.0) | today (5.0) | — | no | 7.0 |
| WeaponX list, due in 4 days | May 1 (7.0) | high (6.0) | — | — | no | 13.0 |
| Incident doc, scheduled 8 weeks ago | — | high (6.0) | 8 wks ago (0.0) | — | no | 6.0 |
| Bug fix, due yesterday | yesterday (9.3) | none (2.0) | — | — | yes | 14.3 |

## Where scoring is used

Both `agenda` and `next` use the same scoring function but differ in what they filter before scoring:

- **Agenda** pre-filters to temporally relevant tasks (due/scheduled today or past, in-progress, start date is today), then sorts by score. It answers: "what needs my attention today?"
- **Next** scores everything actionable with no pre-filter. It answers: "what's most important overall?"
- **Review** uses scoring for display order within buckets, and separately identifies tasks that **need triage** — high-priority tasks with stale scheduled dates, or tasks with no dates at all.

## Design principles

1. **Due dates are the strongest signal.** A deadline creates external accountability. Priority is an internal label.
2. **Overdue tasks don't decay.** If you missed a deadline, the system keeps it visible until you make a decision. Silent demotion is worse than annoying persistence.
3. **Scheduled dates do decay.** A scheduled date is a plan, not a promise. Stale plans shouldn't permanently occupy the top of your task list.
4. **Priority drift is a review problem.** If a task's stated priority doesn't match your behavior, the review flags it. The scoring function doesn't silently adjust priorities — you make that call.
5. **The function is additive and legible.** You can look at a task's properties and roughly predict its score. No hidden interactions between components.

## Tuning

The exact weights live in `packages/core/src/scanner.ts` in `computeUrgency()` and its helper functions. If you need to adjust the balance — say, make priority matter more relative to due dates — change the constants there. This doc describes the model; the code is the source of truth for the numbers.
