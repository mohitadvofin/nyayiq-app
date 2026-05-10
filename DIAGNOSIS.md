# Login Failure — Diagnosis

**Status:** investigation complete · NO CODE CHANGED · awaiting fix-plan approval
**Date:** 2026-05-09
**Symptom:** Signup works. Login submits, but the page errors out with a generic "Something went wrong" instead of redirecting to `/app`.

---

## 1. Architecture overview

### Auth surface
| File | Role |
|---|---|
| `app/(auth)/login/page.tsx` | Client component. Calls `supabase.auth.signInWithPassword` then `router.push('/app')` + `router.refresh()`. |
| `app/(auth)/signup/page.tsx` | Client component. Calls `supabase.auth.signUp` with `emailRedirectTo: ${origin}/auth/callback`. |
| `app/auth/callback/route.ts` | GET handler. Exchanges `?code=` for session, redirects to `/app`. Falls back to `/login?error=auth_callback_failed`. |
| `app/api/auth/signout/route.ts` | POST handler. Signs out and redirects to `/login`. |
| `app/(app)/layout.tsx` | Server component. `force-dynamic`. Calls `getUser()`, `redirect('/login')` if no user. |
| `app/(app)/app/page.tsx` | Server component. `force-dynamic`. Same `getUser()` + `redirect('/login')` guard. |
| `proxy.ts` (root) | Next 16 "middleware-equivalent". Calls `getUser()` and gate-keeps `/app` and `/admin`; bounces logged-in users away from `/login` and `/signup`. |
| `lib/supabase/client.ts` | `createBrowserClient` from `@supabase/ssr`. |
| `lib/supabase/server.ts` | `createServerClient` from `@supabase/ssr`, reading cookies via `await cookies()`. |

### Happy path (intended)
1. Browser submits `/login` → `signInWithPassword` succeeds → `@supabase/ssr` writes session cookies via `document.cookie`.
2. `router.push('/app')` triggers an SSR request to `/app`.
3. `proxy.ts` runs: reads cookies → `getUser()` returns user → falls through.
4. `(app)/layout.tsx` runs: `getUser()` returns user → renders dashboard.

If any step in (3)–(4) throws or returns `null`, the user is redirected back to `/login`, OR the framework shows the generic error page. There is **no `error.tsx`** anywhere in the app, so any uncaught server-side throw shows the framework's default "Something went wrong" page.

---

## 2. Code-level findings

### Finding A — No `error.tsx` boundary
**Files:** `app/`, `app/(auth)/`, `app/(app)/` — none of these contain an `error.tsx`.
**Impact:** Any server-side throw in a server component or route handler renders the framework's default "Something went wrong". You get the symptom you're seeing with **zero browser-visible diagnostics**. Every other finding below is currently invisible because of this.

### Finding B — `proxy.ts` drops cookies on redirect
**File:** `proxy.ts:14-25, 37-43`

`@supabase/ssr` calls `setAll(cookiesToSet)` whenever the access token is refreshed during `getUser()`. The proxy correctly writes those new cookies onto its working `response`. But when the proxy then short-circuits with `NextResponse.redirect(...)`:

```ts
if ((pathname.startsWith('/app') || pathname.startsWith('/admin')) && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}

if (user && (pathname === '/login' || pathname === '/signup')) {
  return NextResponse.redirect(new URL('/app', request.url))
}
```

…it returns a **fresh** response object with no Supabase cookies copied across. Result: the just-refreshed token is silently discarded. Next request shows the user as logged out → bounces to `/login` → token refresh tries again → loop or perma-logged-out state. This is the canonical Supabase SSR middleware bug.

### Finding C — Layout's `getUser()` is unguarded; throws bubble up
**File:** `app/(app)/layout.tsx:9-12`, `app/(app)/app/page.tsx:8-13`

Both call `await supabase.auth.getUser()` with **no try/catch**. If Supabase throws (network blip, invalid token format, auth-helper version skew, or anon-key mismatch), the throw bubbles past `redirect('/login')` and triggers the generic error page. The proxy already swallows this case, but the layout/page do not — so any inconsistency between proxy and layout becomes a server crash.

### Finding D — `redirect()` and `force-dynamic` doubled in layout AND page
**Files:** `app/(app)/layout.tsx:1`, `app/(app)/app/page.tsx:1`

`force-dynamic` and an auth check are declared on both the layout and its child page. Functionally fine (layout runs first), but:
- Auth is checked twice per request — wasted Supabase round-trip.
- If `redirect()` from `next/navigation` is ever caught in error boundary code (it works by throwing), having it in two places multiplies risk surface.

### Finding E — `signOut` redirect points at `localhost:3000` in production
**File:** `app/api/auth/signout/route.ts:7`

```ts
return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
```

`NEXT_PUBLIC_SITE_URL` is **not** in your listed Vercel env vars. In production the fallback fires and signout tries to redirect to `localhost:3000`. Not the cause of the login bug (sign-in failure happens before sign-out is reachable), but it's a latent prod bug worth flagging.

### Finding F — `.env.local.example` points `NEXT_PUBLIC_SITE_URL` at `nyayiq-v2.vercel.app`
**File:** `.env.local.example:14`

The example file has `NEXT_PUBLIC_SITE_URL=https://nyayiq-v2.vercel.app`. That is the wrong project (this is `nyayiq-app`). If anyone copies this verbatim, auth callbacks and signout will redirect into the static marketing site. Worth correcting independently of the login bug.

### Finding G — Login page wraps content in `<Suspense>` for no reason
**File:** `app/(auth)/login/page.tsx:89-91`

There is no async data being awaited; the `Suspense` boundary is a no-op. Harmless, but worth removing for clarity. Same pattern in signup.

### Finding H — Email confirmation requirement (Supabase project setting)
**Not visible in code.** If the Supabase project still has "Confirm email" enabled (default), users who sign up but never click the confirmation link cannot sign in — Supabase responds with `Email not confirmed`. That should appear as a red error in the form (Finding I), but if Finding A is masking it, you'd see "Something went wrong" instead. Worth verifying in Supabase Dashboard → Authentication → Providers → Email → "Confirm email".

### Finding I — Browser-side error display works correctly
**File:** `app/(auth)/login/page.tsx:21-23`

```ts
if (error) {
  setError(error.message)
  setLoading(false)
}
```

If `signInWithPassword` returned a Supabase error string ("Invalid login credentials", "Email not confirmed"), it would render in the form's `errorBox`. The fact that you see "Something went wrong" instead means **the failure is happening AFTER `signInWithPassword` resolved successfully** — i.e. on the SSR render of `/app` after `router.push('/app')`. This narrows the investigation to Findings B, C, D.

---

## 3. Root-cause hypotheses (ranked)

### H1 — Cookies dropped on proxy redirect, causing perma-redirect / auth desync ⭐ MOST LIKELY
**Evidence:** Finding B is a known and reproducible bug in `@supabase/ssr` middleware patterns. The proxy here exhibits exactly that anti-pattern. Combined with Finding I (the form-level error path works), the failure has to be on the server side after the cookie write — and a dropped-cookie redirect would cause `(app)/layout.tsx` to see no user and `redirect('/login')` → which the proxy then re-bounces if it now does see a user → loop, or if `getUser()` throws mid-loop, "Something went wrong" via Finding A.

**Recommended fix:**
- In `proxy.ts`, before each `NextResponse.redirect(...)`, copy `response.cookies.getAll()` onto the redirect response.
- Equivalently, refactor to the canonical `@supabase/ssr` Next-middleware shape: build the redirect response *with* the same `cookies.setAll` adapter, or use `supabase.auth.getUser()` only after `response` is built and copy cookies forward on every branch.
- Add an explicit early-return for `/auth/callback` so the proxy never gets between the OAuth code-exchange and the cookie set.

### H2 — `getUser()` throws inside `(app)/layout.tsx` with no try/catch ⭐ LIKELY
**Evidence:** Finding C — unguarded throw in a server component renders the framework error page (Finding A). This explains "Something went wrong" verbatim. Could co-occur with H1: dropped cookies → cookie chain becomes malformed → `getUser()` throws on parse.

**Recommended fix:**
- Wrap `getUser()` in try/catch in both `(app)/layout.tsx` and `(app)/app/page.tsx`. Treat any throw as "no user" → `redirect('/login')`.
- Add `app/error.tsx` so future server throws produce a real error message instead of the framework default.

### H3 — Email confirmation still required, masked by missing error.tsx ⭐ POSSIBLE
**Evidence:** Finding H. If Supabase still enforces "Confirm email", login of an unconfirmed user errors with `Email not confirmed`. That *should* show in the form, but if the Supabase client was somehow configured to throw instead of return error, it could surface as the generic page.
**Quick verify:** Check Supabase Dashboard → Auth → Email provider settings. Then test login with a user you know has clicked the confirmation link.

**Recommended fix:** Either disable email confirmation in Supabase, or ensure confirmation emails are actually being delivered (Brevo SMTP wired into Supabase).

### H4 — `proxy.ts` not actually wired up by Next 16 ⭐ LOW BUT VERIFIABLE
**Evidence:** AGENTS.md says Next 16 has breaking changes; the file is named `proxy.ts` and exports `proxy()`. We can't verify the convention without reading `node_modules/next/dist/docs/` (currently uninstalled) or starting the dev server and checking that the proxy logs run. If `proxy.ts` is silently ignored, the auth gate falls entirely to `(app)/layout.tsx`, where Finding C then dominates.

**Recommended fix:** Add a `console.log` to `proxy.ts` and run `npm run dev`. If logs don't appear on requests, the file isn't wired up — switch to whatever Next 16 actually expects (verify against installed Next docs).

### H5 — Env var mismatch between client and server ⭐ LOW
**Evidence:** Both client and server clients read from `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either is mistyped or stale on Vercel, signInWithPassword on the client could write a session valid for project A while the server reads project B's anon key → token decode fails. Less likely because signup works, but the signup HTTP call uses the same env vars, so if these were broken, signup would fail too.
**Quick verify:** Sanity-check the keys in Vercel match the Supabase project's Settings → API.

---

## 4. Recommended order of attack (proposed — not yet executed)

1. **Add `app/error.tsx`** so we stop flying blind (Finding A). This alone won't fix login but will surface the real error message immediately.
2. **Fix `proxy.ts` cookie propagation** (H1, Finding B) — high-confidence, well-known fix.
3. **Wrap `getUser()` calls** in `(app)/layout.tsx` and `(app)/app/page.tsx` with try/catch (H2, Finding C).
4. **Verify** in Supabase Dashboard that the test user's email is confirmed and that "Confirm email" matches your intended flow (H3, Finding H).
5. **Verify** `proxy.ts` is being invoked by Next 16 in dev (H4) — quick `console.log` smoke test.
6. **Sanity-check** Vercel env vars match Supabase project keys (H5).
7. (Separate cleanup) Set `NEXT_PUBLIC_SITE_URL` on Vercel and fix `.env.local.example` (Findings E, F).

I have **not changed any code**. Awaiting your review and approval before implementing any of the fixes above. Tell me which hypotheses you want pursued and in what order.
