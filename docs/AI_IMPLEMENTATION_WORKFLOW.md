# Smart Trip — AI Implementation Workflow

Use this workflow for each feature. Scale the detail to task size, but do not skip verification.

## Phase A — Understand (Plan)
1. Read `AGENTS.md`, `docs/ENGINEERING_STANDARDS.md`, and `docs/DEFINITION_OF_DONE.md`.
2. Read `PROJECT_CONTEXT.md` if present and inspect relevant original requirements/design assets.
3. Inspect repository state, existing conventions, scripts, package manager, and Git status.
4. Restate the goal, acceptance criteria, out-of-scope work, affected files, dependencies, and risks.
5. List unresolved questions. Do not proceed through an important ambiguity by guessing.
6. Propose the smallest coherent implementation plan and expected verification commands.
7. Wait for approval for architecture changes, dependencies, destructive actions, and any scope beyond the request.

## Phase B — Implement (Act)
1. Implement only the approved slice.
2. Prefer small, logically related changes; avoid generating the entire app at once.
3. Follow the existing conventions and keep UI, domain logic, and data access separated.
4. Use approved design tokens and Stitch assets.
5. Do not silently add backend or integrations during the UI-only phase.
6. Add/update tests for behavior that can be tested, especially money calculations and state transitions when those are implemented.

## Phase C — Verify
1. Run the relevant formatter, lint, typecheck, tests, and build scripts that actually exist.
2. Fix issues caused by the change; do not hide them by disabling checks.
3. For UI work, run the page and inspect desktop/tablet/mobile states when possible.
4. Compare against Stitch and check key states, accessibility, console errors, and regressions.
5. Inspect the final diff for unrelated changes, secrets, debug code, and accidental asset deletions.

## Phase D — Review and report
Report:
- implemented behavior;
- files changed and significant design/architecture choices;
- exact verification commands and results;
- known gaps and what was not verified;
- any questions requiring product-owner decisions.

Wait for user review before starting the next major phase. Passing a build is necessary but does not by itself prove the feature is correct.
