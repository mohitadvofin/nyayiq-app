export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const name = user.user_metadata?.full_name || user.email || 'User'
  const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '220px 1fr' }}>
      <aside style={{
        background: '#faf6ee', borderRight: '1px solid #c9b990',
        padding: '1.5rem', display: 'flex', flexDirection: 'column',
        gap: '1.5rem', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
      }}>
        <Link href="/app" style={{
          fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.2rem',
          textDecoration: 'none', color: '#2b1f15',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <div style={{
            width: 26, height: 26, background: '#8f3615', borderRadius: 4,
            display: 'grid', placeItems: 'center', color: '#f5ecd9',
            fontStyle: 'italic', fontWeight: 700, fontSize: '0.8rem'
          }}>N</div>
          Nyay<span style={{ color: '#8f3615', fontStyle: 'italic' }}>IQ</span>
        </Link>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a7560', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            Workspace
          </div>
          {[
            { href: '/app', icon: '◇', label: 'Dashboard' },
            { href: '/app/search', icon: '⌕', label: 'Search' },
            { href: '/app/upload', icon: '↑', label: 'Upload PDF' },
            { href: '/app/bookmarks', icon: '★', label: 'Bookmarks' },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{
              padding: '0.55rem 0.75rem', borderRadius: 4,
              fontFamily: 'Inter Tight, sans-serif', fontSize: '0.88rem',
              color: '#5a4532', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', width: 16 }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a7560', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
            Account
          </div>
          {[
            { href: '/app/settings', icon: '⚙', label: 'Settings' },
            { href: '/app/billing', icon: '₹', label: 'Billing' },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href} style={{
              padding: '0.55rem 0.75rem', borderRadius: 4,
              fontFamily: 'Inter Tight, sans-serif', fontSize: '0.88rem',
              color: '#5a4532', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', width: 16 }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e5d9bc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 34, height: 34, background: '#8f3615', color: '#f5ecd9',
            borderRadius: '50%', display: 'grid', placeItems: 'center',
            fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: '0.85rem'
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Inter Tight, sans-serif', fontSize: '0.82rem', fontWeight: 500, color: '#2b1f15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6rem', color: '#8f3615', letterSpacing: '0.1em' }}>
              FREE PLAN
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main style={{ background: '#f5ecd9', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
