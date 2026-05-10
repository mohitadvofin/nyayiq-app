@AGENTS.md

# NyayIQ — Project Context

NyayIQ is a legal-tech platform for Indian tax case-law search and AI summarization. Built and run by **Mohit Jain** — founder of MJ Lex Legal Chambers and AdvoFin Consulting, a practicing tax advocate (Delhi HC, ITAT).

## Two distinct projects — do NOT confuse

- **`nyayiq-app`** (this repo, in `nyayiq-next/`) — Next.js 16 app on **Vercel**. The authenticated product (login, dashboard, AI summaries).
- **`nyayiq-v2`** — Static HTML on **GitHub Pages**. The marketing site. Different repo. Different deploy target.

Both surface at `nyayiq.in` (production).

## Stack

- **Framework:** Next.js 16.2.4 (breaking changes vs older Next — see [AGENTS.md](AGENTS.md); middleware is `proxy.ts` at root, not `middleware.ts`)
- **Auth + DB:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **AI:** Anthropic Claude API (`@anthropic-ai/sdk`)
- **Email:** Brevo SMTP — `nyayiq-app` has its OWN Brevo key (separate from `nyayiq-v2`'s key)
- **Hosting:** Vercel

## Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `BREVO_SMTP_KEY` (nyayiq-app specific)

> ⚠️ **Brevo key warning:** NEVER mix the `nyayiq-app` and `nyayiq-v2` Brevo keys. Each project has its own. Copying the wrong key into the wrong env will leak credentials and break email auth.

## Coding preferences

- **Show diffs before applying changes.** Surface the proposed edit and wait for confirmation rather than editing immediately.
- **Ask before deleting any file.** Default is preserve.
- **No unnecessary comments.** Don't narrate what the code does. Only comment when the WHY is non-obvious (a hidden constraint, a workaround, a subtle invariant).
- **Match the existing style.** Inline `style={...}` objects, named function components, terse handlers. Don't refactor existing patterns while making unrelated changes.
- **Diagnose before fix.** For non-trivial issues, write a diagnosis document first and wait for approval before changing code.
