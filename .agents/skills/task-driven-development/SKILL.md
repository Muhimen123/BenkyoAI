---
name: task-driven-development
description: Use this skill at the start of any non-trivial coding task (multi-step features, refactors, bug hunts, migrations) — plan the work, present that plan to the user for review, and only after they approve it persist the plan as a task list file in the repo and keep it updated as you go. Never start editing code or creating files before the plan is approved. Critical for long-running or multi-session work where the agent might run out of context, hit a usage/quota limit, or otherwise get interrupted, since the task list lets work resume exactly where it left off instead of starting over or losing track. Trigger this whenever the user asks for a feature, refactor, migration, multi-file change, or says things like "build me X", "let's tackle Y", or "keep working on the project" — even if they don't explicitly ask for a plan, review, or task list.
---

# Task-List-Driven Development

A workflow for planning before coding and tracking progress in a durable file, so an
interruption (context limit, quota limit, crash, closed session) never means losing
track of what's done, what's in progress, and what's left.

## Core loop

1. **Plan before touching code.** Understand the request, explore the relevant code,
   and break the work into concrete, ordered, independently-checkable steps. Don't
   start editing files until the plan exists.
2. **Present the plan for review — and stop.** Show the proposed task list to the
   user in the chat (not just written to disk) and explicitly ask for approval or
   changes. Do not create `TASKS.md`, do not write or edit any code, and do not run
   any commands that change the repo until the user has confirmed the plan. This
   applies every time a new plan is proposed, not just the first one.
3. **Revise if asked.** If the user requests changes, update the plan and show it
   again. Repeat until they approve. Treat silence or an unrelated reply as "not yet
   approved" — ask again rather than assuming a green light.
4. **Only after approval: write `TASKS.md`** in the project root (see format below)
   and then begin work.
5. **Work one task at a time.** Mark it in-progress, do the work, mark it done, then
   move to the next. Update the file as part of the work, not as an afterthought at
   the end.
6. **On every resume** (new session, after a compaction, after hitting a limit, or
   just "keep going") — **read `TASKS.md` first**, before doing anything else. It is
   the source of truth for where things stand, not memory of the conversation. An
   already-approved `TASKS.md` does not need re-approval to resume — the review gate
   is only for new or materially changed plans.
7. **Never leave two tasks "in progress."** If context is about to run out mid-task,
   stop, write down exactly what's left in that task's notes, and leave it clearly
   marked so the next pass can pick it up mid-stream instead of guessing.
8. **Re-open the review gate for material plan changes.** If work reveals that the
   plan needs a new task, a dropped task, or a significantly different approach,
   pause, show the updated plan, and get approval before continuing — same as step 2.
   Small clarifications within an already-approved task (e.g. a minor implementation
   detail) don't need re-approval.

## Presenting the plan for review

Before any file is written or edited, show the user something like:

```markdown
Here's my plan for <feature/project name>:

1. Set up X module scaffolding
2. Add data model for Y
3. Implement Z endpoint
4. Write tests for Z endpoint
5. Update docs / README

Approach/notes: <1-3 sentences on key decisions, tradeoffs, or assumptions>

Let me know if you'd like anything changed before I start.
```

Keep it short and scannable — numbered list, no prose per item unless a step needs a
sentence of context. Wait for an explicit go-ahead ("looks good", "go", "yes",
specific edits) before creating `TASKS.md` or making any changes to the repo.

## `TASKS.md` format

Keep it plain markdown, checkbox-based, so it's readable by both humans and the agent.

```markdown
# Task List — <feature/project name>

Last updated: <ISO date/time>

## Plan
<1-3 sentence summary of the overall approach and any key decisions/constraints>

## Tasks
- [x] 1. Set up X module scaffolding
- [x] 2. Add data model for Y
- [ ] 3. Implement Z endpoint  <-- IN PROGRESS
      - Notes: request/response shapes done; still need validation + error handling
      - Next step: add input validation in `z_handler.py`, then wire tests
- [ ] 4. Write tests for Z endpoint
- [ ] 5. Update docs / README

## Blockers / open questions
- <anything that needs a human decision before proceeding, if any>
```

Rules for the file itself:
- Every task is a single checkbox line, numbered, in execution order.
- Only ever one `<-- IN PROGRESS` marker at a time.
- The in-progress task always has a `Notes:` and `Next step:` sub-line kept current —
  this is what makes resuming possible without re-reading the whole codebase.
- Don't delete completed tasks; leave them checked off as a record of what's done.
- If the plan changes mid-work (new task discovered, task split, task dropped), edit
  the list immediately rather than remembering the change informally.

## Sizing tasks

- Each task should be small enough to finish in one focused pass, but big enough to
  represent a real unit of value (not "open the file").
- If a task turns out to be bigger than expected, split it into subtasks right in the
  file rather than pushing through a giant, unmarked task.
- Aim for tasks that leave the repo in a working (or at least non-broken) state when
  checked off, so any resume point is a safe one.

## When resuming after an interruption

1. Read `TASKS.md`.
2. Find the `<-- IN PROGRESS` task (or the first unchecked one if none is marked).
3. Read its `Notes:`/`Next step:` line — that's the resume point, not a guess from
   conversation history.
4. Verify the described state against the actual code (quick sanity check) before
   continuing, since the file could be slightly stale.
5. Continue the loop: work → update file → next task.

## Why this matters

Coding agents can lose the thread when a session ends, context gets compacted, or a
usage limit interrupts a long task — anything held only "in the conversation" is at
risk of being lost. A `TASKS.md` file that's updated continuously, not just at the
end, turns that lost context into a five-second read instead of a re-plan or
re-discovery from scratch.
