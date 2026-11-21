#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${IMPECCABLE_PORT:-8401}"

find_pids() {
  local pid exe
  for pid in $(pgrep -f 'impeccable live-server' 2>/dev/null); do
    [ "$pid" = "$$" ] && continue
    [ "$pid" = "$PPID" ] && continue
    exe="$(readlink "/proc/$pid/exe" 2>/dev/null)" || continue
    [ "${exe##*/}" = "impeccable" ] || continue
    echo "$pid"
  done | sort -u
}

mapfile -t pids < <(find_pids)

if [ "${#pids[@]}" -eq 0 ]; then
  echo "No impeccable live-server process running."
else
  echo "Killing impeccable live-server PIDs: ${pids[*]}"
  kill "${pids[@]}" 2>/dev/null

  for _ in 1 2 3 4 5; do
    sleep 1
    remaining="$(find_pids)"
    [ -z "$remaining" ] && break
  done

  remaining="$(find_pids)"
  if [ -n "$remaining" ]; then
    echo "Still running, sending SIGKILL: $remaining"
    # shellcheck disable=SC2086
    kill -9 $remaining 2>/dev/null
    sleep 1
  fi
fi

echo
if (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep -q ":${PORT} "; then
  echo "FAIL: port ${PORT} is still listening"
  (ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep ":${PORT} "
  exit 1
fi
echo "OK: port ${PORT} is free"

echo
if grep -rn 'impeccable-live\|live\.js?token' "$ROOT/builder/index.html" 2>/dev/null; then
  echo
  echo "WARNING: index.html still injects the live script."
  echo "Remove the block between <!-- impeccable-live-start --> and <!-- impeccable-live-end -->."
  echo "Without that, a private tab will reconnect to impeccable again."
  exit 1
fi
echo "OK: builder/index.html has no live-script injection"
