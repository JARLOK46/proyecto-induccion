# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | `C:\Users\ander\.config\opencode\skills\branch-pr\SKILL.md` |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | `C:\Users\ander\.config\opencode\skills\issue-creation\SKILL.md` |
| When user says judgment day / adversarial review variants | judgment-day | `C:\Users\ander\.config\opencode\skills\judgment-day\SKILL.md` |
| When user asks to create a new skill or AI agent instructions | skill-creator | `C:\Users\ander\.config\opencode\skills\skill-creator\SKILL.md` |
| When writing Go tests, using teatest, or adding test coverage | go-testing | `C:\Users\ander\.config\opencode\skills\go-testing\SKILL.md` |
| Interface design for dashboards, admin panels, apps, tools, and interactive products | interface-design | `C:\Users\ander\.agents\skills\interface-design\SKILL.md` |
| When user wants to find/install a skill for a task | find-skills | `C:\Users\ander\.agents\skills\find-skills\SKILL.md` |
| When asked to review UI, accessibility, UX, or design best practices | web-design-guidelines | `C:\Users\ander\.agents\skills\web-design-guidelines\SKILL.md` |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### branch-pr
- Every PR MUST link an approved issue and MUST have exactly one `type:*` label.
- Branch names MUST match `type/description` using lowercase `a-z0-9._-` only.
- Use conventional commits only; no AI attribution trailers.
- Follow the PR template: linked issue, single PR type, summary bullets, files table, test plan.
- Run shellcheck on modified scripts before opening the PR.
- Do not open blank PRs or PRs without issue linkage.

### issue-creation
- Always search for duplicates before creating a new issue.
- Use the correct template; blank issues are disabled.
- New issues get `status:needs-review`; PRs wait for maintainer `status:approved`.
- Questions go to Discussions, not Issues.
- Fill every required field, including reproduction/expected vs actual for bugs.
- Use conventional-commit style titles like `fix(scope): ...` or `feat(scope): ...`.

### judgment-day
- Run two blind reviews in parallel; judges must not know about each other.
- Resolve project skills first and inject the same compact rules into both judges and the fix agent.
- Confirmed findings are issues found by both judges; contradictions and one-sided findings stay suspect.
- Classify warnings as real vs theoretical; theoretical warnings are INFO only.
- After Round 1, ask before fixing confirmed issues.
- Re-judge after fixes only for confirmed CRITICALs; avoid infinite nitpicking loops.

### skill-creator
- Create a skill only for reusable, non-trivial patterns or workflows.
- Use `skills/{skill-name}/SKILL.md` and include complete frontmatter with Trigger text.
- Put the most critical patterns first; keep examples minimal and focused.
- Use `assets/` for templates/schemas and `references/` only for local docs.
- Do not add keyword sections, long explanations, or web URLs in references.
- Register the new skill in the project conventions/index after creation.

### go-testing
- Prefer table-driven tests for Go logic with multiple cases.
- Test Bubbletea model state transitions directly through `Update()`.
- Use `teatest` for end-to-end TUI interaction flows.
- Use golden files for stable visual/output assertions.
- Cover both success and error paths; use `t.TempDir()` for filesystem work.
- Keep tests idiomatic Go and small enough to isolate failures quickly.

### interface-design
- Design from intent first: who the user is, what they must do, and how it should feel.
- Explicitly explore domain concepts, real color world, signature element, and default patterns to avoid.
- Every layout, type, spacing, and palette choice must have a concrete why.
- Typography, navigation, data presentation, and token naming are design decisions, not scaffolding.
- Run swap/squint/signature/token tests before presenting UI work.
- If the output could belong to any generic dashboard, iterate again.

### find-skills
- Use `npx skills find <query>` with specific domain + task keywords.
- Present found skills with what they do, install command, and skills.sh link.
- Offer installation with `npx skills add <owner/repo@skill> -g -y` only after user wants it.
- If no skill exists, say so clearly and offer direct help or suggest `npx skills init`.
- Prefer alternative search terms when the first query is too broad.

### web-design-guidelines
- Fetch the latest guidelines from the upstream source before every review.
- Read the target files/patterns and review against the fetched rules, not memory.
- Output findings in terse `file:line` format exactly as the guidelines require.
- If the user did not specify files, ask for the review scope first.
- Use this skill for UI/UX/accessibility/design audits, not implementation.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-level convention files detected in the repository root. |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
