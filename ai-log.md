# AI Usage Log

Format per entry: **Goal → Prompt & tool → Result (kept / reworked / rejected — why) → What I learned**

---

### 1. Scaffolding the whole project from the PRD

**Goal:** Turn the PRD into a working file structure and first pass of every page.

**Prompt (verbatim) / tool:** "დეტალურად წაიკითხე ეს ფაილი და ყველა მოცემული წესის
დაცვით სექმენი საიტი, დიზაინი უნდა იყოს თანამედროვე და ინტერაქციული." — Claude
(Anthropic), used inside the chat/coding environment.

**Result:** Kept the overall structure (5 HTML pages + `css/` + `js/`), but reworked the
navigation: the AI's first instinct was to paste the sidebar markup into all three
protected pages. I flagged this against the PRD's "don't copy the same logic five
times" rule, so it was refactored into a single `buildSidebar()` function in
`guard.js` that injects the nav into an empty `<div id="sidebar-root">` on each page.

**What I learned:** Shared UI, not just shared logic, should live in one place —
the PRD's "one function, all pages call it" rule applies to markup that repeats
verbatim, not only to auth/storage functions.

---

### 2. Prompt refinement — dedupe validation error UX

**Goal:** Decide how the Login page should show the generic "Invalid email or
password" error without revealing which field is wrong.

**Prompt v1 (vague):** "add an invalid login error message."
**Prompt v2 (refined):** "The PRD says this error must stay generic on purpose —
don't attach it under one specific field like the other 6-rule validations; use a
banner above the submit button instead, and clear it as soon as the user edits
either field."

**Result:** Kept v2's approach — added a `#login-general-error` banner element,
separate from the per-field `.field-error` pattern used everywhere else.

**What I learned:** The first version of a prompt often gets a technically-working
but spec-incorrect answer (attaching the message to the password field would leak
which field was wrong). Being specific about *why* a rule exists produced code that
actually matched the PRD's security rationale (P2.2 note about not revealing which
email is registered).

---

### 3. DummyJSON DELETE / 404 behavior

**Goal:** Handle DELETE requests for clients that were added locally and never
actually exist on DummyJSON's server.

**Prompt / tool:** "DummyJSON's DELETE endpoint may 404 for ids it never really
stored — write the delete handler so it removes the client from local state
regardless of the response status or a network error."

**Result:** Kept the `try / finally` structure suggested — the local state removal
happens in `finally`, so it runs whether the request succeeds, 404s, or the network
fails outright.

**What I learned:** For a mocked API, the *local* source of truth (localStorage)
has to be treated as authoritative, and the network call is best-effort logging —
not a precondition for the UI to update.

---

### 4. Critical evaluation — rejected an AI suggestion

**Goal:** Decide how to generate placeholder deal values for clients pulled from
the API (DummyJSON users don't have a "deal value" field).

**Prompt / tool:** Asked for a way to assign deal values to imported clients.

**AI's first suggestion:** hardcode every imported client's `dealValue` to a fixed
`1000`.

**Why I rejected it:** The PRD explicitly offers two options — fixed *or* random
500–10000 — and a fixed value makes the dashboard's "Won Revenue" stat and the
"Deal value: high → low" sort look fake and identical for 30 clients. I asked for
the random range instead (`Math.round(500 + Math.random() * 9500)`), which makes
the Pipeline/Dashboard numbers look like a real book of business and actually
exercises the sort feature during a live demo.

**What I learned:** AI suggestions default to the simplest branch of an "either/or"
instruction in the spec; it's worth checking both options against how the feature
will actually be demoed before accepting the first answer.

---

### 5. Theme toggle default

**Goal:** Decide the default theme per P0.3, which contains a contradiction (main
text says default dark, a side note says "you can leave it light").

**Prompt / tool:** "The PRD default note is ambiguous — pick one and justify it
against the rest of the document."

**Result:** Went with **dark** as the default, since the main rule text states it
explicitly and the note only offers light as an optional exception, not a
correction. Documented the decision here in case it comes up in the exam Q&A.

**What I learned:** When a spec has a primary rule and a softer "or you could..."
aside, treat the primary rule as binding and the aside as a permitted variant —
worth being able to explain that reasoning out loud during grading.
