import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, ai_summaries_used_this_month')
    .eq('id', user.id)
    .single()

  const name = profile?.full_name || user.email || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
  const plan = profile?.plan || 'free'
  const used = profile?.ai_summaries_used_this_month || 0

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      {/* Sidebar */}
      <aside style={{
        background: 'var(--paper)', borderRight: '1px solid var(--line)',
        padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
        gap: '2rem', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <Link href="/app" style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--ink)'
        }}>
          <div style={{
            width: 26, height: 26, background: 'var(--orange-deep)', borderRadius: 4,
            display: 'grid', placeItems: 'center', color: 'var(--cream)',
            fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 700, fontSize: '0.8rem'
          }}>N</div>
          Nyay<span style={{ color: 'var(--orange-deep)', fontStyle: 'italic' }}>IQ</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={sectionTitle}>Workspace</div>
          <SidebarLink href="/app" icon="◇" label="Dashboard" />
          <SidebarLink href="/app/search" icon="⌕" label="Search" />
          <SidebarLink href="/app/upload" icon="↑" label="Upload PDF" />
          <SidebarLink href="/app/bookmarks" icon="★" label="Bookmarks" />
        </nav>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={sectionTitle}>Account</div>
          <SidebarLink href="/app/settings" icon="⚙" label="Settings" />
          <SidebarLink href="/app/billing" icon="₹" label="Billing" />
          <SidebarLink href="/app/usage" icon="※" label="Usage" />
        </nav>

        {/* Usage indicator for free users */}
        {plan === 'free' && (
          <div style={{
            background: 'rgba(184,74,30,0.06)', border: '1px solid var(--line)',
            borderRadius: 6, padding: '1rem'
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--orange-deep)', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>
              AI SUMMARIES
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', color: 'var(--ink)', fontWeight: 500 }}>
              {used}<span style={{ fontSize: '1rem', color: 'var(--ink-3)' }}>/5</span>
            </div>
            <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.85rem', color: 'var(--ink-3)', fontStyle: 'italic', margin: '0.5rem 0' }}>
              this month
            </div>
            <Link href="/app/billing" style={{
              display: 'block', textAlign: 'center', padding: '0.5rem',
              background: 'var(--orange-deep)', color: 'var(--cream)',
              borderRadius: 4, fontFamily: 'Inter Tight, sans-serif',
              fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none'
            }}>
              Upgrade to Pro →
            </Link>
          </div>
        )}

        {/* User profile */}
        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--line-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 4 }}>
            <div style={{
              width: 36, height: 36, background: 'var(--orange-deep)', color: 'var(--cream)',
              borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500, fontSize: '0.9rem'
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'Inter Tight, sans-serif', fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', color: 'var(--orange-deep)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {plan} plan
              </div>
            </div>
            <form action="/api/auth/signout" method="post">
              <button type="submit" style={{
                background: 'none', border: 'none', color: 'var(--ink-3)',
                cursor: 'pointer', fontFamily: 'Fraunces, serif', fontSize: '1rem',
                fontStyle: 'italic', padding: '0.2rem'
              }} title="Sign out">↪</button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ minHeight: '100vh', background: 'var(--cream)' }}>
        {children}
      </main>
    </div>
  )
}

function SidebarLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} style={{
      padding: '0.6rem 0.75rem', borderRadius: 4,
      fontFamily: 'Inter Tight, sans-serif', fontSize: '0.88rem',
      color: 'var(--ink-2)', textDecoration: 'none',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      transition: 'all 0.15s'
    }}>
      <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '1rem', width: 18, textAlign: 'center' }}>
        {icon}
      </span>
      {label}
    </Link>
  )
}

const sectionTitle: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
  letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-3)',
  padding: '0 0.75rem', marginBottom: '0.5rem'
}
