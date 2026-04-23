'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/app')
      router.refresh()
    }
  }

  return (
    <div style={styles.layout}>
      <div style={styles.formSide}>
        <div style={styles.formHeader}>
          <Link href="/" style={styles.logo}>
            <div style={styles.logoMark}>N</div>
            Nyay<span style={{ color: 'var(--orange-deep)', fontStyle: 'italic' }}>IQ</span>
          </Link>
          <Link href="/signup" style={styles.switchLink}>
            New here? <strong style={{ color: 'var(--orange-deep)' }}>Sign up</strong>
          </Link>
        </div>
        <div style={styles.formContainer}>
          <div style={styles.kicker}>◆ WELCOME BACK</div>
          <h1 style={styles.title}>Log in to <em style={{ color: 'var(--orange-deep)' }}>NyayIQ.</em></h1>
          <p style={styles.subtitle}>Your research is waiting.</p>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address *</label>
              <input style={styles.input} type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password *</label>
              <input style={styles.input} type="password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Your password" required />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
              <Link href="/forgot-password" style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.92rem', color: 'var(--orange-deep)', fontStyle: 'italic', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in →'}
            </button>
          </form>
        </div>
      </div>
      <div style={styles.visualSide}>
        <div style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '3rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>◆ TODAY IN YOUR FEED</div>
          <blockquote style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '2rem', lineHeight: 1.2, fontStyle: 'italic' }}>
            Fresh judgements from Delhi HC, ITAT, and Supreme Court — <em style={{ color: 'var(--gold)' }}>waiting for you</em> since this morning.
          </blockquote>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(245,236,217,0.15)' }}>
            {[['500+','Judgements'],['27','Courts'],['Daily','Updated']].map(([n,l])=>(
              <div key={l}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: 'var(--gold)', fontWeight: 500 }}>{n}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'rgba(245,236,217,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense fallback={<div>Loading...</div>}><LoginForm /></Suspense>
}

const styles: Record<string, React.CSSProperties> = {
  layout: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.2fr' },
  formSide: { padding: '3rem', display: 'flex', flexDirection: 'column', background: 'var(--cream)' },
  visualSide: { minHeight: '100vh' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' },
  logo: { fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: '1.35rem', textDecoration: 'none', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.6rem' },
  logoMark: { width: 30, height: 30, background: 'var(--orange-deep)', borderRadius: 5, display: 'grid', placeItems: 'center', color: 'var(--cream)', fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 700, fontSize: '0.9rem' },
  switchLink: { fontFamily: 'Inter Tight, sans-serif', fontSize: '0.88rem', color: 'var(--ink-2)', textDecoration: 'none' },
  formContainer: { maxWidth: 420, width: '100%', margin: '2rem auto' },
  kicker: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--orange-deep)', letterSpacing: '0.25em', marginBottom: '1rem' },
  title: { fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '2.8rem', lineHeight: 1, letterSpacing: '-0.025em', marginBottom: '0.75rem' },
  subtitle: { fontFamily: 'EB Garamond, serif', fontSize: '1.05rem', color: 'var(--ink-2)', fontStyle: 'italic', marginBottom: '2rem' },
  formGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--ink-2)', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.85rem 1rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'EB Garamond, serif', fontSize: '1rem', color: 'var(--ink)', outline: 'none' },
  submitBtn: { width: '100%', padding: '1rem 1.5rem', background: 'var(--orange-deep)', color: 'var(--cream)', border: 'none', borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' },
  errorBox: { background: 'rgba(160,62,46,0.1)', border: '1px solid var(--red)', borderRadius: 4, padding: '0.85rem 1rem', fontFamily: 'EB Garamond, serif', color: 'var(--red)', marginBottom: '1.25rem' },
}
