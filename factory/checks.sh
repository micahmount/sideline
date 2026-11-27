#!/usr/bin/env bash
# Sideline's checks, run by the factory gate in each job's worktree.
#
# Exit 0 only when the branch is fit for review. Non-interactive, deterministic,
# and safe to run from a fresh checkout: it installs dependencies before lint,
# test and build. It never runs a formatter or anything else that rewrites
# tracked files.
set -euo pipefail
export CI=1

fail() { printf 'FAIL  %s\n' "$*" >&2; exit 1; }
pass() { printf 'PASS  %s\n' "$*"; }

# Use the Node version the repo pins, from a fresh worktree too.
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use --silent >/dev/null 2>&1 || true
fi
expected_node="$(tr -d 'v[:space:]' < .nvmrc)"
actual_node="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || true)"
[[ "$actual_node" == "$expected_node" ]] || fail "Node v$expected_node required (.nvmrc); found ${actual_node:-none}"
pass "Node v$actual_node"

# Static parse of tracked config files catches malformed YAML/JSON cheaply.
python3 - <<'PY'
import json
import subprocess
import sys

try:
    import yaml
except ImportError:
    print("FAIL  PyYAML is required to parse YAML config", file=sys.stderr)
    sys.exit(1)

tracked = subprocess.check_output(["git", "ls-files", "-z"]).decode().split("\0")
errors = []
counts = {"json": 0, "yaml": 0, "shell": 0}
for path in tracked:
    if not path:
        continue
    if path.endswith(".json"):
        counts["json"] += 1
        try:
            with open(path) as fh:
                json.load(fh)
        except Exception as exc:
            errors.append(f"{path}: {exc}")
    elif path.endswith((".yaml", ".yml")):
        counts["yaml"] += 1
        try:
            with open(path) as fh:
                yaml.safe_load(fh)
        except Exception as exc:
            errors.append(f"{path}: {exc}")
    elif path.endswith(".sh"):
        counts["shell"] += 1

if errors:
    print(f"FAIL  config parse ({len(errors)} error(s))", file=sys.stderr)
    for err in errors[:20]:
        print(f"      {err}", file=sys.stderr)
    if len(errors) > 20:
        print(f"      ... and {len(errors) - 20} more", file=sys.stderr)
    sys.exit(1)
print(f"PASS  config parse ({counts['json']} JSON, {counts['yaml']} YAML files)")
PY

for f in $(git ls-files '*.sh'); do
  bash -n "$f" || fail "shell syntax: $f"
done
pass "shell syntax"

npm ci --prefer-offline --no-audit --no-fund
pass "npm ci"
npm run lint
pass "npm run lint"
npm run test -- --run
pass "npm run test -- --run"
npm run build
pass "npm run build"

echo "OK: all checks passed"
