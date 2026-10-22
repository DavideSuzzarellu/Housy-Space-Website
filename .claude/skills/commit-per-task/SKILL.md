---
name: commit-per-task
description: "Trigger: task done, commit, finished, tests green, next task. Close every completed and tested task with one conventional commit that explains what changed and why."
when_to_use: "At the end of every task (feature, fix, refactor, docs, tooling) once its checks pass, before starting the next task."
metadata:
  author: "housyspace"
  version: "1.0"
---

# Commit per task

## Activation Contract

Load when a task is finished. A task is not done until it is committed; the next task never starts on top of uncommitted work. Works with `testing-tdd` (tests ship with the code, AGENTS.md §13).

## Hard Rules

- One task → one commit. Never mix two tasks in a commit; never split one task into commits that leave the tree broken.
- Commit ONLY after the gate passes (Execution Step 2). A red gate means fix first, never commit "to fix later". Never `--no-verify`.
- Chain the gate and the commit with `&&` so a failing check stops the commit. Never run checks and `git commit` as independent commands.
- Conventional Commits, English (AGENTS.md §9): `type(scope): summary` in the imperative, ≤ 72 chars. Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`. Scope = feature folder (`properties`, `i18n`, `ui`, `agency`...).
- The body explains WHAT changed and WHY (the problem, the decision, gotchas), wrapped at 72 chars. Not a file list: the diff already shows that.
- No AI attribution: no `Co-Authored-By`, no "Generated with" lines (AGENTS.md §9).
- Stage explicit paths. Never `git add -A`/`git add .` without reviewing `git status` first.
- Never commit: `.env` / `.env.*` (except a values-free `.env.example`), credentials, `dist/`, `.astro/`, client documents (`/*.pdf`), local agent state (`.claude/settings.local.json`, `.atl/`), raw Mobilia recordings or real personal/location data (fixtures must be sanitized, §5).
- `ROADMAP.md` checkboxes and decisions log are updated in the SAME commit as the task (§13).
- Do not push, amend pushed commits, or rewrite history unless the user asks. Amending the last local, unpushed commit of the same task is fine.

## Decision Gates

| Situation | Action |
|-----------|--------|
| Gate green | Stage the task's files → commit |
| Gate red | Fix, re-run the gate; do not commit |
| E2E cannot run (no build allowed, Chromium missing, external input 🔒) | Commit if the rest of the gate is green; say in the body which e2e were NOT run and why |
| The diff contains unrelated changes | Commit only the task's paths; report the leftovers to the user |
| A secret or real personal data shows up in the diff | Stop, unstage, tell the user; never commit it |
| Several tasks were done without commits | One commit per task, staged by path, in the order they were done |

## Execution Steps

1. Review: `git status --porcelain` and `git diff` — only this task's changes, nothing from the "never commit" list.
2. Gate (from AGENTS.md §10; `bun run test`, never `bun test`, which is Bun's own runner):
   ```bash
   bun run test && bun run typecheck && bun run lint && bun run format:check && bun run check
   ```
   Add `bun run test:e2e` for UI, route or navigation changes when a build is allowed.
3. Update `ROADMAP.md` (checkbox, decisions log) if the task changes status or makes a decision.
4. Stage explicit paths and commit in the same command as the gate:
   ```bash
   bun run test && bun run typecheck && bun run lint && bun run format:check && bun run check \
     && git add -- <task paths> \
     && git commit -m "feat(properties): add QR code to the property sheet" \
                   -m "Why it was needed and what was decided, wrapped at 72 chars."
   ```
5. Verify: `git log -1 --stat` and `git status --porcelain` (only expected leftovers).

## Output Contract

Return: commit hash and subject, gate commands with pass/fail, e2e run or the reason it was skipped, and any files left uncommitted on purpose.

## References

- `../../../AGENTS.md` §9, §10, §13
- Skills: `testing-tdd`
