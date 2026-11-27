# Software factory (Sideline)

This is Sideline's installation of the OpenCode software factory. It turns a
GitHub issue labeled `factory` into a draft PR with a spec, a build, a static
gate and independent reviews. **A human always merges** — the factory never
runs `gh pr merge`.

The port and its design are tracked in
[`software-factory-opencode`](https://github.com/micahmount/software-factory-opencode).
Upstream attribution and the GPL-3.0 license for the factory files are in
[`NOTICE`](NOTICE) and [`LICENSE`](LICENSE).

## Run

From the Sideline repo root in OpenCode:

```
/factory run       # process every open `factory` issue, one at a time
/factory run 42    # process issue #42
/factory <anything>  # status, feedback on an escalated job, or a new feature
```

The orchestrator is `.opencode/commands/factory.md`; the eight subagents are in
`.opencode/agents/`. State is in `factory/jobs/` (gitignored); each job works in
`.worktrees/<job-id>/` (also gitignored). `factory/bin/job` is the only writer
of `job.json`.

Dashboard: `cd factory && python3 -m http.server`, then open
<http://localhost:8000/dashboard.html>.

## Pipeline

```
intake → route → spec → build → gate → review → approve → human merges
```

No reviewer runs on a failing build. `gate` re-runs after syncing with `trunk`
before the PR is marked ready. If the approver writes `ESCALATE`, the PR is
still marked ready but the issue gets `factory:needs-human` and the decision
asks for a specific human call.

## The gate

`checks.sh` runs from each job's worktree and checks:

- Node from `.nvmrc` (via nvm when available);
- parse of every tracked JSON and YAML file, plus `bash -n` on tracked shell;
- `npm ci`, `npm run lint`, `npm run test -- --run`, `npm run build`.

It is non-interactive and never rewrites tracked files. Run it by hand with:

```bash
bash factory/checks.sh
```

`factory/bin/gate <job-id>` wraps it, writes `round-N/checks.md` and
`checks.log`, and fails the branch if a `protected_paths` entry in
`config.json` was modified or deleted.

## Configuration

`config.json` holds:

- `base_branch: trunk`, `concurrency: 1` (raise only after reading a few jobs),
  `max_rounds: 3`;
- the three GitHub labels: `factory`, `factory:needs-info`,
  `factory:needs-human`;
- reviewer routing by risk and surface, using free `opencode/*` model IDs;
- protected paths: `factory/**` and `.opencode/**` — no job may change the
  factory tooling itself.

All models are free OpenCode models, mapped tier-for-tier from the original
Anthropic setup:

| Tier | Model | Used by |
| --- | --- | --- |
| Top | `opencode/seaglass-alpha-free` | intake |
| High | `opencode/beam-free` | spec-writer, builder, security review, approver |
| Mid | `opencode/flint-40b-free` | UX review, medium/high routing |
| Fast | `opencode/hy4-flash-free` | code/UI reviews, low routing |

These are free for a limited time and can change; check `/models` in OpenCode
if a model stops working.

Costs in `job summary` come from OpenCode's session DB. A child session is
matched to a job by the `Job folder: <path>/` line at the start of its prompt.

## Dependencies

- OpenCode V2 with the free models above enabled;
- GitHub CLI (`gh`) authenticated with permission to push, comment and manage
  labels on `micahmount/sideline`;
- Python 3.10+ and PyYAML (for the static parse);
- Node from `.nvmrc` (nvm optional) and npm.
