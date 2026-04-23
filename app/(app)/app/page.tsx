import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch today's judgements
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: judgements, count } = await supabase
    .from('judgements')
    .select('*', { count: 'exact' })
    .order('date_decided', { ascending: false })
    .limit(10)

  const { data: todayJudgements } = await supabase
    .from('judgements')
    .select('id', { count: 'exact' })
    .gte('created_at', today.toISOString())

  const { data: highImpact } = await supabase
    .from('judgements')
    .select('id', { count: 'exact' })
    .eq('impact', 'high')
    .gte('created_at', today.toISOString())

  const isEmpty = !judgements || judgements.length === 0

  return (
    <div style={{ padding: '2rem 3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: '2.2rem', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.3rem' }}>
            Today&apos;s <em style={{ fontStyle: 'italic', color: 'var(--orange-deep)' }}>feed</em>
          </h1>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.72rem', color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
            {todayJudgements?.length || 0} NEW · {highImpact?.length || 0} HIGH IMPACT · {count || 0} TOTAL
          </div>
        </div>
        <Link href="/app/search" style={{
          padding: '0.65rem 1.35rem', background: 'var(--orange-deep)', color: 'var(--cream)',
          borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.88rem',
          fontWeight: 500, textDecoration: 'none'
        }}>
          ⌕ Search judgements
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontFamily: 'Fraunces, serif', color: 'var(--ink-3)', fontSize: '1.1rem' }}>⌕</span>
        <input
          type="text"
          placeholder="Ask in plain English: 'Section 74 cases where returns were filed'"
          style={{
            width: '100%', padding: '0.9rem 1rem 0.9rem 2.75rem',
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 4, fontFamily: 'EB Garamond, serif', fontSize: '1rem',
            color: 'var(--ink)', outline: 'none'
          }}
          readOnly
          onClick={() => window.location.href = '/app/search'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['All', 'GST', 'Income Tax', 'ITAT', 'Supreme Court', 'High Court', 'Assessee favoured'].map(f => (
          <button key={f} style={{
            padding: '0.45rem 1rem', background: f === 'All' ? 'var(--orange-deep)' : 'var(--paper)',
            color: f === 'All' ? 'var(--cream)' : 'var(--ink-2)',
            border: `1px solid ${f === 'All' ? 'var(--orange-deep)' : 'var(--line)'}`,
            borderRadius: 999, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.82rem',
            fontWeight: 500, cursor: 'pointer'
          }}>{f}</button>
        ))}
      </div>

      {/* Judgement list */}
      {isEmpty ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {judgements.map((j: JudgementRow) => (
            <JudgementCard key={j.id} judgement={j} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6,
      padding: '4rem 2rem', textAlign: 'center'
    }}>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: '4rem', color: 'var(--orange-deep)', fontStyle: 'italic', opacity: 0.4, marginBottom: '1.5rem' }}>§</div>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 400, marginBottom: '0.75rem' }}>
        Judgements are <em style={{ fontStyle: 'italic', color: 'var(--orange-deep)' }}>loading.</em>
      </h3>
      <p style={{ fontFamily: 'EB Garamond, serif', color: 'var(--ink-2)', fontStyle: 'italic', fontSize: '1.05rem', maxWidth: 480, margin: '0 auto 1.5rem' }}>
        The Indian Kanoon pipeline is being set up. Your first batch of judgements will appear here shortly.
      </p>
      <Link href="/app/upload" style={{
        display: 'inline-block', padding: '0.75rem 1.5rem',
        background: 'var(--orange-deep)', color: 'var(--cream)',
        borderRadius: 4, fontFamily: 'Inter Tight, sans-serif',
        fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none'
      }}>
        Upload a PDF to analyze now →
      </Link>
    </div>
  )
}

type JudgementRow = {
  id: string
  title: string
  parties_appellant: string
  parties_respondent: string
  court: string
  date_decided: string
  tax_type: string
  outcome: string
  impact: string
  ai_summary: { held?: string } | null
  sections_invoked: string[]
}

function JudgementCard({ judgement: j }: { judgement: JudgementRow }) {
  const outcomeColor = j.outcome === 'assessee_favoured' ? 'var(--green)' : j.outcome === 'revenue_favoured' ? 'var(--red)' : 'var(--gold-deep)'
  const outcomeLabel = j.outcome === 'assessee_favoured' ? '◆ ASSESSEE FAVOURED' : j.outcome === 'revenue_favoured' ? '◆ REVENUE FAVOURED' : '◆ MIXED'

  return (
    <Link href={`/app/judgement/${j.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article style={{
        background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 6,
        padding: '1.5rem', transition: 'all 0.2s', cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--orange-deep)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
            ◆ {j.court}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: 'var(--ink-3)' }}>
            {j.date_decided ? new Date(j.date_decided).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </span>
        </div>

        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 500, lineHeight: 1.25, marginBottom: '0.75rem' }}>
          {j.parties_appellant} <em style={{ color: 'var(--ink-2)', fontStyle: 'italic', fontWeight: 400 }}>v.</em> {j.parties_respondent}
        </h3>

        {j.ai_summary?.held && (
          <p style={{
            fontFamily: 'EB Garamond, serif', fontSize: '0.95rem', color: 'var(--ink-2)',
            lineHeight: 1.55, marginBottom: '1rem', paddingLeft: '0.75rem',
            borderLeft: '2px solid var(--orange)', fontStyle: 'italic'
          }}>
            {j.ai_summary.held.substring(0, 160)}...
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--line-faint)' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ padding: '0.2rem 0.55rem', background: 'rgba(184,74,30,0.08)', color: 'var(--orange-deep)', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em' }}>
              {j.tax_type?.toUpperCase()}
            </span>
            {j.sections_invoked?.slice(0, 2).map((s: string) => (
              <span key={s} style={{ padding: '0.2rem 0.55rem', background: 'rgba(184,74,30,0.08)', color: 'var(--orange-deep)', borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.12em' }}>
                {s}
              </span>
            ))}
          </div>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.1em', color: outcomeColor }}>
            {outcomeLabel}
          </span>
        </div>
      </article>
    </Link>
  )
}
