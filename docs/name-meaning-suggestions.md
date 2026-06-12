# Community name-meaning suggestions

Lets users propose a meaning for names that don't have one yet. Submissions are
**never shown directly** — a moderator verifies each, and approving publishes it.
Backed by migration `supabase/migrations/20260623_name_meaning_suggestions.sql`.

## Why this design

The app shows any `canonical_name_meanings` row where `review_status <> 'rejected'`.
So unvetted text can't live there, or it would go live instantly. Suggestions
therefore sit in their own table, `name_meaning_suggestions`, which nothing in the
display path reads. On approval they're promoted into `canonical_name_meanings` at
`source_priority 2 / review_status 'approved'` — above Wikidata (3) and AI (6), and
locked from future automated overwrites.

## Client: empty state + submit

When a name has no English meaning (the resolver returns null/empty), show an
**"Meaning unavailable"** state instead of a blank or a guess, with a **"Suggest a
meaning"** action. Gate the action behind sign-in.

Submit form fields:
- **Meaning** (required, 3–280 chars) — one plain sentence, no links/markdown.
- **Origin** (optional, ≤60 chars) — the living tradition the name is used in
  (e.g. `Arabic`, `Irish`), not its deepest etymological ancestor.

Call the RPC (RLS-safe, authenticated only):

```ts
const { data, error } = await supabase.rpc('suggest_name_meaning', {
  p_canonical_name_id: nameId,
  p_meaning: meaningText,
  p_origin: originText || null,   // optional
  p_language: 'en',
});
```

Handle these RPC errors with friendly copy:
- `Not authenticated` → prompt sign-in.
- `Meaning must be 3-280 characters` → inline validation (also enforce client-side).
- `You already have a pending suggestion for this name` → "Thanks — yours is already in review."
- `Too many pending suggestions; please wait for review` → soft cap (25 open per user).

After success, show "Submitted for review — thank you!" and keep the empty state
(don't optimistically show the unverified text). A user can see their own pending
submissions (RLS allows `select` where `submitted_by = auth.uid()`); they cannot see
anyone else's.

## Moderation (you / a trusted reviewer)

Run via the **service role** (SQL editor or a small script using the service key) —
the review RPC is granted to `service_role` only.

List the queue:

```sql
select * from public.name_meaning_suggestion_queue;   -- pending, oldest first, with display_name
```

Approve (optionally editing the text first) or reject:

```sql
-- approve as-is
select public.review_name_meaning_suggestion('<suggestion-id>', 'approve');

-- approve with an edit
select public.review_name_meaning_suggestion(
  '<suggestion-id>', 'approve',
  'Arabic — Uzair (عزير), a figure mentioned in the Qur''an; "one who helps".',
  'Arabic');

-- reject with a note
select public.review_name_meaning_suggestion('<suggestion-id>', 'reject', null, null, 'spam');
```

Approve promotes the meaning into `canonical_name_meanings` automatically (priority 2,
approved) and it goes live. Reject just marks it; nothing publishes.

### Reviewer checklist
- Real meaning, not a description ("a nice name", "popular in X") or a joke/insult.
- **In-tradition origin**: don't label a name by a foreign etymological ancestor
  (e.g. an Arabic/Urdu name as "Hebrew/biblical"). Present it in the tradition it's
  used in; mention deeper roots only as secondary, or omit.
- No copied Behind the Name / Wikipedia text with links or "see X" cross-references.
- One sentence, neutral tone, no religious or political editorializing.

## Abuse guardrails (built in)
- Sign-in required; `submitted_by` is the authenticated user.
- One **pending** suggestion per (name, user) — DB unique index.
- Max 25 open suggestions per user.
- Users can't read others' submissions (RLS).
- Nothing is publicly visible until a moderator approves it.

## Optional next steps (not built)
- Bulk moderation: export the queue to the same Excel/JSONL review flow you use for
  enrichment, approve in batches.
- Rate-limit per time window (e.g. ≤10/day) if volume gets high.
- Notify the submitter when their suggestion is approved (engagement hook).
