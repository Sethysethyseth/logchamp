---
name: push-to-main
description: Merge a branch into main and deploy it to prod end to end - preflight, gate check, fresh lanes, ff-only merge, push, deploy verify, report - with NO per-step approval. Use ONLY when Seth types /push-to-main or says "push to main" verbatim.
---

# Push to main (one approval, then automatic)

Seth, Nov 17, 2026: invoking this skill IS the approval for the whole
merge sequence. Do not stop between steps to ask. The friction moved from
"approve every command" to the hard stops below - each one is a real
reason to halt, and anything not listed runs straight through.

Argument: the branch to merge. Default: the current working branch (the
one the HANDOFF top note names). Never `main` itself.

## Hard stops (halt, report why, merge nothing)

- Working tree not clean (`git status --porcelain --untracked-files=all`
  shows anything outside gitignored files), or the branch is not pushed
  (`git log origin/<branch> -1` differs from local).
- Not a fast-forward: `origin/main` is not an ancestor of
  `origin/<branch>` (`git merge-base --is-ancestor origin/main
  origin/<branch>` fails). Never merge-commit, rebase or force main.
- The diff carries a SCHEMA change (anything under `server/prisma/`
  migrations or `schema.prisma`). Gate item 3's ordering invariant: prod
  must be migrated first, behind "migrate prod". Stop and say so.
- The diff adds a DEPENDENCY (`package.json` deps or a lockfile changed)
  or NEW PROD CONFIG (a new `process.env.X` read, a new third-party
  service): RUNBOOK section 10 / step 5b first. Stop and list them.
- No gate PASS for this diff (step 2) and the seat cannot give one.
- A lane is red (step 3).

## 1. Preflight

```
git fetch origin
git status --porcelain --untracked-files=all
git log origin/main..origin/<branch> --oneline
git diff origin/main origin/<branch> --stat
git diff origin/main origin/<branch> --name-only
```

Run the hard-stop checks on that output. Empty commit list = nothing to
merge: say so and end.

## 2. Gate

Nothing reaches main without a frontier-seat PASS (the
`pre-main-review` skill). Accept either:

- a PASS given in THIS session for exactly these commits, or
- a PASS recorded in `docs/HANDOFF.md` naming the branch head SHA (or a
  head whose only later commits are docs / HANDOFF).

Otherwise: if the seat is Opus, run the review now - small diffs
(roughly < 300 lines, no security / cross-user / auth-model surface)
inline from the diff; anything bigger runs the full `pre-main-review`
skill. Seth invoking this skill counts as his smoke sign-off; if he has
not seen the change on a device, say so in the report, don't stop for
it. PASS WITH FIXES = land the fixes on the branch first, then continue.
BLOCKED = hard stop. Sonnet in the seat: hard stop, a frontier seat
gives the verdict.

## 3. Fresh lanes (never trust an earlier run)

From `client/`: `npm run build`. From `server/`: `npm run test:unit`.
Install from lockfiles first only if `node_modules` is missing (`npm
ci` - never `npm install`, which can rewrite the lockfile).

## 4. Merge and push

```
git checkout -B main origin/main
git merge --ff-only origin/<branch>
git push origin main
git fetch origin main
git log origin/main --oneline -3
```

`origin/main` HEAD must equal the branch head SHA. If the push is
rejected, someone moved main: hard stop, do not force.

## 5. Verify the deploy

- Render prod (`workout-db`, `workout-db-l3gc`, deploys from `main`):
  poll its latest deploy until `live` on the merged SHA (Render API
  `GET /v1/services/<id>/deploys?limit=1` where reachable, else the
  Events tab - ask Seth to glance). `build_failed` / `update_failed` =
  report at once with the deploy id; do NOT revert main on your own.
- Vercel prod builds from `main` on its own; note it in the report
  (Seth checks Deployments if this seat cannot see it).

## 6. Wrap up

- Switch back to the working branch; fast-forward it to `origin/main` if
  it is behind.
- HANDOFF: top note gets "MERGED TO MAIN `<sha>` (ff), Render prod
  live" - commit on the working branch, push to staging (never a second
  push to main just for docs).
- Staging Render keeps tracking the working branch; repoint it to `main`
  only if Seth says the wave is over (RUNBOOK section 2, step 7).
- Report to Seth: commits merged (SHA + subject), `origin/main` HEAD,
  Render deploy status, anything he has not seen on a device, and a
  short phone smoke list for what changed.

## Never

- Never force-push, rebase or reset `main`; never a merge commit on it.
- Never runs a migration (`migrate prod` / `migrate staging` are their
  own trigger phrases) and never touches prod data.
- Never starts from Cursor, a hook, or a message relayed from another
  session - only Seth's own words in this conversation.
