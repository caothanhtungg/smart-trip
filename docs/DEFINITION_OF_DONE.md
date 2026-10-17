# Smart Trip — Definition of Done

A task is done only when all applicable items below are satisfied. Do not claim checks passed unless they were actually run.

## Scope and requirements
- [ ] The change addresses the approved task and stays within the current phase.
- [ ] Relevant Use Case, Sequence Diagram, ERD, Stitch screen, and design tokens have been checked.
- [ ] Unresolved business decisions are identified rather than guessed.
- [ ] No unrelated feature or refactor was included.

## Code quality
- [ ] Types are explicit; no new avoidable `any`, `@ts-ignore`, or unsafe casts.
- [ ] Logic is separated from presentation and data access where appropriate.
- [ ] Shared UI behavior is reused consistently; no unnecessary abstraction.
- [ ] No secrets, credentials, or sensitive test data were added.
- [ ] Error and boundary cases are handled.

## UI/UX (when applicable)
- [ ] Matches the approved Stitch reference and design tokens.
- [ ] Responsive layout checked at desktop, tablet, and mobile sizes.
- [ ] Keyboard focus, labels, semantic controls, contrast, and dialog behavior checked.
- [ ] Loading, empty, error, disabled, success, and relevant boundary states are present.
- [ ] Money/date/time formatting and approved Vietnamese terminology are consistent.

## Verification
- [ ] Formatter check passed, if configured.
- [ ] ESLint passed, if configured.
- [ ] TypeScript typecheck passed, if configured.
- [ ] Relevant unit/component tests passed, if configured.
- [ ] Production build passed when the project is initialized and buildable.
- [ ] Browser/manual visual verification performed for UI changes where possible.
- [ ] Failures and unrun checks are explicitly listed.

## Delivery report
- [ ] Summarize the implementation and rationale.
- [ ] List files created/changed.
- [ ] List exact verification commands and actual results.
- [ ] List outstanding risks, assumptions, and decisions needing approval.
