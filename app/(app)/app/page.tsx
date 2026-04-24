export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div style={{ padding: '3rem', fontFamily: 'EB Garamond, serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 400, fontSize: '2.5rem', letterSpacing: '-0.02em', color: '#2b1f15' }}>
            Welcome to <em style={{ color: '#8f3615', fontStyle: 'italic' }}>NyayIQ</em>
          </h1>
          <p style={{ color: '#5a4532', fontStyle: 'italic', marginTop: '0.5rem' }}>
            Logged in as: {user.email}
          </p>
        </div>
        <SignOutButton />
      </div>

      {/* Status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Judgements', value: '0', note: 'Pipeline coming soon' },
          { label: 'AI Summaries used', value: '0', note: 'of 5 free this month' },
          { label: 'Bookmarks', value: '0', note: 'Save judgements here' },
        ].map(({ label, value, note }) => (
          <div key={label} style={{ background: '#faf6ee', border: '1px solid #c9b990', borderRadius: 6, padding: '1.5rem' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', color: '#8f3615', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2.5rem', color: '#2b1f15', fontWeight: 400 }}>{value}</div>
            <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.9rem', color: '#8a7560', fontStyle: 'italic', marginTop: '0.25rem' }}>{note}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div style={{ background: '#faf6ee', border: '1px solid #c9b990', borderRadius: 6, padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Fraunces, serif', fontSize: '4rem', color: '#8f3615', fontStyle: 'italic', opacity: 0.4, marginBottom: '1.5rem' }}>§</div>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', fontWeight: 400, color: '#2b1f15', marginBottom: '0.75rem' }}>
          Dashboard is <em style={{ fontStyle: 'italic', color: '#8f3615' }}>live.</em>
        </h3>
        <p style={{ fontFamily: 'EB Garamond, serif', color: '#5a4532', fontStyle: 'italic', maxWidth: 480, margin: '0 auto 1.5rem' }}>
          Auth is working ✅ Next step — Indian Kanoon pipeline will populate judgements here.
        </p>
        <Link href="/app/upload" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#8f3615', color: '#f5ecd9', borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
          Upload a PDF to analyze →
        </Link>
      </div>
    </div>
  )
}
