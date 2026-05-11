export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

type Judgement = {
  id: string
  title: string
  parties_appellant: string | null
  parties_respondent: string | null
  court: string
  date_decided: string | null
  tax_type: string | null
  outcome: string | null
  ai_summary: { held?: string } | null
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  let user: User | null = null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    user = data.user
  } catch (e) {
    console.error('[SearchPage] auth check failed', e)
    redirect('/login?error=auth_check_failed')
  }
  if (!user) redirect('/login')

  const params = await searchParams
  const q = (params.q ?? '').trim()

  let results: Judgement[] = []
  let total = 0
  let queryError: string | null = null

  if (q) {
    const escaped = q.replace(/[%\\_]/g, '\\$&')
    const supabase = await createClient()
    const { data, count, error } = await supabase
      .from('judgements')
      .select(
        'id, title, parties_appellant, parties_respondent, court, date_decided, tax_type, outcome, ai_summary',
        { count: 'exact' }
      )
      .ilike('title', `%${escaped}%`)
      .order('date_decided', { ascending: false, nullsFirst: false })
      .limit(20)

    if (error) {
      console.error('[SearchPage] query error', error)
      queryError = 'Search failed. Try again or contact support.'
    } else {
      results = (data ?? []) as Judgement[]
      total = count ?? 0
    }
  }

  return (
    <div style={{ padding: '3rem', fontFamily: 'EB Garamond, serif' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: '2.5rem', letterSpacing: '-0.02em', color: '#2b1f15' }}>
          Search <em style={{ color: '#8f3615', fontStyle: 'italic' }}>judgements</em>
        </h1>
        <p style={{ color: '#5a4532', fontStyle: 'italic', marginTop: '0.5rem' }}>
          Title-keyword search across the judgement library.
        </p>
      </div>

      <form method="get" action="/app/search" style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem' }}>
        <input
          name="q"
          defaultValue={q}
          type="text"
          placeholder="Section 74 GST · ITAT TDS · refund denial..."
          style={{
            flex: 1,
            padding: '0.9rem 1rem',
            background: '#faf6ee',
            border: '1px solid #c9b990',
            borderRadius: 4,
            fontFamily: 'EB Garamond, serif',
            fontSize: '1rem',
            color: '#2b1f15',
            outline: 'none',
          }}
          autoFocus
        />
        <button
          type="submit"
          style={{
            padding: '0.9rem 1.5rem',
            background: '#8f3615',
            color: '#f5ecd9',
            border: 'none',
            borderRadius: 4,
            fontFamily: 'Inter Tight, sans-serif',
            fontSize: '0.95rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Search →
        </button>
      </form>

      {!q && <EmptyPrompt />}
      {q && queryError && <ErrorState message={queryError} />}
      {q && !queryError && results.length === 0 && <NoResults q={q} />}
      {q && !queryError && results.length > 0 && <Results results={results} total={total} />}
    </div>
  )
}

function EmptyPrompt() {
  return (
    <div style={emptyBox}>
      <div style={emptyGlyph}>⌕</div>
      <h3 style={emptyHeading}>
        Type a query to <em style={{ fontStyle: 'italic', color: '#8f3615' }}>begin.</em>
      </h3>
      <p style={emptySubtext}>Search by case title, section reference, or topic.</p>
    </div>
  )
}

function NoResults({ q }: { q: string }) {
  return (
    <div style={emptyBox}>
      <div style={emptyGlyph}>§</div>
      <h3 style={emptyHeading}>
        No judgements match <em style={{ fontStyle: 'italic', color: '#8f3615' }}>&ldquo;{q}&rdquo;</em>
      </h3>
      <p style={emptySubtext}>
        The judgement library is being populated. Once the Indian Kanoon pipeline runs, results will appear here.
      </p>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div style={{ ...emptyBox, borderColor: '#a03e2e', background: 'rgba(160,62,46,0.05)' }}>
      <div style={{ ...emptyGlyph, color: '#a03e2e' }}>⚠</div>
      <h3 style={emptyHeading}>{message}</h3>
    </div>
  )
}

function Results({ results, total }: { results: Judgement[]; total: number }) {
  return (
    <div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#5a4532', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        ◆ {total} {total === 1 ? 'RESULT' : 'RESULTS'}
        {total > results.length && ` · SHOWING FIRST ${results.length}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {results.map((j) => <JudgementCard key={j.id} judgement={j} />)}
      </div>
    </div>
  )
}

function JudgementCard({ judgement: j }: { judgement: Judgement }) {
  const outcomeColor =
    j.outcome === 'assessee_favoured' ? '#3f6b4e' :
    j.outcome === 'revenue_favoured'  ? '#a03e2e' :
                                        '#b88a3e'
  const outcomeLabel =
    j.outcome === 'assessee_favoured' ? 'ASSESSEE FAVOURED' :
    j.outcome === 'revenue_favoured'  ? 'REVENUE FAVOURED' :
    j.outcome === 'mixed'              ? 'MIXED' :
    j.outcome === 'procedural'         ? 'PROCEDURAL' :
                                         null

  return (
    <article style={{ background: '#faf6ee', border: '1px solid #c9b990', borderRadius: 6, padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#8f3615', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
          ◆ {j.court}
        </span>
        {j.date_decided && (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#8a7560' }}>
            {new Date(j.date_decided).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.25, marginBottom: '0.75rem', color: '#2b1f15' }}>
        {j.parties_appellant && j.parties_respondent ? (
          <>{j.parties_appellant} <em style={{ color: '#5a4532', fontStyle: 'italic', fontWeight: 400 }}>v.</em> {j.parties_respondent}</>
        ) : j.title}
      </h3>

      {j.ai_summary?.held && (
        <p style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.95rem', color: '#5a4532', lineHeight: 1.55, marginBottom: '1rem', paddingLeft: '0.75rem', borderLeft: '2px solid #8f3615', fontStyle: 'italic' }}>
          {j.ai_summary.held.length > 200 ? `${j.ai_summary.held.substring(0, 200)}…` : j.ai_summary.held}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {j.tax_type && <span style={tag}>{j.tax_type.replace('_', ' ').toUpperCase()}</span>}
        {outcomeLabel && <span style={{ ...tag, color: outcomeColor }}>◆ {outcomeLabel}</span>}
      </div>
    </article>
  )
}

const emptyBox: React.CSSProperties = {
  background: '#faf6ee', border: '1px solid #c9b990', borderRadius: 6,
  padding: '4rem 2rem', textAlign: 'center',
}
const emptyGlyph: React.CSSProperties = {
  fontFamily: 'Fraunces, serif', fontSize: '4rem', color: '#8f3615',
  fontStyle: 'italic', opacity: 0.4, marginBottom: '1.5rem',
}
const emptyHeading: React.CSSProperties = {
  fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 400,
  color: '#2b1f15', marginBottom: '0.75rem',
}
const emptySubtext: React.CSSProperties = {
  fontFamily: 'EB Garamond, serif', color: '#5a4532', fontStyle: 'italic',
  maxWidth: 480, margin: '0 auto',
}
const tag: React.CSSProperties = {
  padding: '0.2rem 0.55rem', background: 'rgba(143,54,21,0.08)',
  color: '#8f3615', borderRadius: 3,
  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em',
}
