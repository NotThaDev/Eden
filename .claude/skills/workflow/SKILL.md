---
name: workflow
description: >-
  Base Eden working rules for every task: write reviews, comments and
  descriptions in English, offer a "deep check" after finishing a feature, run
  Ponytail plus the standard code review before committing or when the user
  asks for a review, and use Microsoft Learn (C#/.NET) or Context7 (Angular and
  other libraries) for docs and how-to questions. Use whenever implementing a
  feature, committing, opening a PR, reviewing changes, or answering how to do
  something with a library, language, or pattern.
---

# Eden workflow

## 1. Offer a deep check after each feature

When a feature is finished, ask the user: "Run a deep check?" If they agree:

1. **Review** — spawn an agent on a higher model (`model: "opus"`) to review the
   feature's diff and list findings.
2. **Verify** — spawn an agent on a lower model (`model: "sonnet"`) with the
   diff and the findings. It discards findings that are wrong or not worth
   fixing, and keeps the confirmed ones.
3. **Apply** — the same lower-model agent (continue it with `SendMessage`)
   applies the confirmed fixes.

Report what was found, what was dropped and why, and what was changed.

## 2. Reviews run both Ponytail and Claude's standard review

Before every commit, and whenever the user asks for a review, run **both**
reviews on the same target (pending changes, a commit, or the PR diff):

1. `ponytail:ponytail-review` skill.
2. Claude's standard review: the `code-review` skill.

Never run only one of them. The Ponytail plugin is enabled for this repo in
`.claude/settings.json`.

### Report

When both reviews are done, post one merged report **in the chat where the
review was asked**: the findings of both reviews, deduplicated and
ranked most severe first. Say what was fixed, if anything.
Fix or report the findings before committing.

### Reviewing an entire PR

When the review is for the entire PR (the user names a PR or asks to review
"the PR"), also post the report as a comment on the PR, in this format:

```markdown
## Code review results

**🔴 Must fix**
1. `path/to/file.ts:42` — <the problem>: <what breaks, and the fix>

**🟡 Should fix / follow-up**
- `path/to/file.ts:10` — <the suggestion>

---

**<verdict icon> Would I merge?** <Yes / Yes, after the must-fix items / No> — <one sentence why>.
```

- One list per severity with the findings of both reviews. Do not say which
  review found what.
- A point that both reviews report, or that is the same problem in more than
  one place, is listed once.
- Icons: 🔴 for **Must fix**, 🟡 for **Should fix / follow-up**. The verdict
  icon matches the answer: ✅ Yes, ⚠️ Yes, after the must-fix items, ❌ No.
- **Must fix**: bugs, security holes, data loss, broken behavior — anything
  that blocks the merge. **Should fix / follow-up**: everything else (simplification,
  naming, missing tests, performance nice-to-haves).
- Rank each list most severe first. Leave out a list that has no findings,
  heading included.

```
gh pr comment <PR#> --body-file <report.md>
```

Use the scratchpad (or a temp dir) for the file. Use the same text for the chat
report. It follows rule 4 (English).

**In the GitHub Action (`@claude` on a PR):** your tracking comment is the
chat. Put the report there, in the format above, and skip `gh pr comment` so it
is not posted twice. The tracking comment is your own: it does not count as
"Claude already commented on this PR" for the `code-review` skill, so do not stop
because of it.

## 3. Use docs MCPs for library and how-to questions

When building a feature that relies on a library or framework with online docs,
or when the user asks how to do something in a language or pattern, fetch
current docs before answering or writing code. Prefer them over memory for
APIs, config, and version-specific behavior.

- **C# / .NET** (ASP.NET Core, EF Core, Npgsql, anything under `backend/`):
  use the Microsoft Learn MCP — search the docs, then fetch the relevant page
  or code samples.
- **Everything else** (Angular, Angular Material, RxJS, TailwindCSS, Bun,
  other libraries): use the Context7 MCP — resolve the library ID, then query
  its docs for the specific topic.

If the MCP has no match, say so and fall back to the other MCP, then to web
search.

## 4. Reviews, comments and descriptions are in English

Write reviews, review reports, PR/issue comments, PR descriptions and commit
messages in English, even if the user writes to you in another language. Use
another language only when the user explicitly asks for it. (User-visible UI
text in the app is Italian; see the `frontend` skill.)
