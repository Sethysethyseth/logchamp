#!/usr/bin/env bash
# Headless Cursor run for the dispatch-unit skill - CLOUD variant (Linux
# container, "logchamp" Claude Code cloud environment). Mirrors
# scripts/run-lane.ps1 (the Windows lane). Run it as a BACKGROUND task:
#   bash scripts/run-lane.sh <lane> <unit> [model] [timeout-min] [resume-id] [note]
#   e.g. bash scripts/run-lane.sh cursor-lane ar1-stage-v2 auto 40
# The lane worktree (/home/user/worktrees/<lane>) must already be on the
# right branch (git checkout -B cursor/<unit> <wave-branch>).
#
# Needs: the cursor-agent CLI in ~/.local/bin (the environment's setup
# script installs it) and CURSOR_API_KEY as an environment VARIABLE on the
# environment. NOT a network secret: the CLI swaps the key for an access
# token, and a proxy-injected secret overwrites that token on every call
# ("not logged in"). Found Nov 11, 2026.
#
# Same shape as the .ps1: stream-json to a log FILE (stalls show early),
# hard kill of the whole process group on timeout, and print the PID so a
# monitor can kill THIS run once DELIVERY.md lands (print mode can hang
# after writing it). Never kill cursor processes by name or pattern.
set -euo pipefail
lane="${1:?lane, e.g. cursor-lane}"
unit="${2:?unit = task file name under docs/tasks, without .md}"
model="${3:-auto}"          # ALWAYS explicit - the CLI remembers the last model
timeout_min="${4:-40}"
resume="${5:-}"
note="${6:-}"
wt="/home/user/worktrees/$lane"
logdir="${LANE_LOG_DIR:-/tmp/cursor-lanes}"
mkdir -p "$logdir"
log="$logdir/$unit.stream.log"
err="$logdir/$unit.stderr.log"
cli="$HOME/.local/bin/cursor-agent"

[ -x "$cli" ] || { echo "NO CLI at $cli - install: curl -fsSL https://cursor.com/install | bash"; exit 2; }
[ -n "${CURSOR_API_KEY:-}" ] || { echo "NO CURSOR_API_KEY - session is not on the logchamp environment (or it is unset there)"; exit 2; }
[ -d "$wt" ] || { echo "NO worktree $wt - git worktree add $wt -b cursor/<unit> <wave-branch>"; exit 2; }

prompt="Read docs/tasks/$unit.md and execute it exactly. It is the complete task; do not ask for the task in chat. Write the delivery report to DELIVERY.md in this directory and make NO git operations."
[ -n "$note" ] && prompt="$prompt ${note//\"/\'}"
args=(-p "$prompt" --force --model "$model" --output-format stream-json)
[ -n "$resume" ] && args+=(--resume "$resume")

cd "$wt"
setsid "$cli" "${args[@]}" >"$log" 2>"$err" </dev/null &
pid=$!
echo "started pid=$pid unit=$unit lane=$lane model=$model log=$log at $(date -Is)"
( sleep $((timeout_min * 60)); if kill -0 "$pid" 2>/dev/null; then
    echo "TIMEOUT after $timeout_min min - killing group pid=$pid"; kill -TERM -- "-$pid" 2>/dev/null; sleep 5; kill -KILL -- "-$pid" 2>/dev/null; fi ) &
watchdog=$!
set +e
wait "$pid"; code=$?
set -e
kill "$watchdog" 2>/dev/null || true
echo "exit code $code at $(date -Is)"
if [ -f "$wt/DELIVERY.md" ]; then echo "DELIVERY.md $(date -Is -r "$wt/DELIVERY.md")"; else echo "NO DELIVERY.md"; fi
