'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [designation, setDesignation] = useState('Advocate')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name, designation },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false) }
  }

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--cream)', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(184,138,62,0.12)', border: '1px solid var(--gold)', display: 'grid', placeItems: 'center', margin: '0 auto 2rem', fontSize: '2.5rem' }}>✉</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '2.5rem', marginBottom: '1rem' }}>Check your <em style={{ color: 'var(--orange-deep)' }}>inbox.</em></h1>
        <p style={{ fontFamily: 'EB Garamond, serif', color: 'var(--ink-2)', fontStyle: 'italic', fontSize: '1.05rem', marginBottom: '1rem' }}>
          Verification link sent to <strong>{email}</strong>
        </p>
        <Link href="/login" style={{ display: 'inline-block', padding: '0.85rem 2rem', background: 'var(--orange-deep)', color: 'var(--cream)', borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontWeight: 500, textDecoration: 'none' }}>
          Go to login →
        </Link>
      </div>
    </div>
  )

  return (
    <div style={styles.layout}>
      <div style={styles.formSide}>
        <div style={styles.formHeader}>
          <Link href="/" style={styles.logo}><div style={styles.logoMark}>N</div>Nyay<span style={{ color: 'var(--orange-deep)', fontStyle: 'italic' }}>IQ</span></Link>
          <Link href="/login" style={styles.switchLink}>Already have an account? <strong style={{ color: 'var(--orange-deep)' }}>Log in</strong></Link>
        </div>
        <div style={styles.formContainer}>
          <div style={styles.kicker}>◆ GET STARTED</div>
          <h1 style={styles.title}>Create your <em style={{ color: 'var(--orange-deep)' }}>account.</em></h1>
          <p style={styles.subtitle}>5 free AI summaries/month. No credit card required.</p>
          {error && <div style={styles.errorBox}>{error}</div>}
          <form onSubmit={handleSignup}>
            <div style={styles.formGroup}><label style={styles.label}>Full Name *</label><input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Adv. Ramesh Kumar" required /></div>
            <div style={styles.formGroup}><label style={styles.label}>Email *</label><input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            <div style={styles.formGroup}><label style={styles.label}>Password *</label><input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Designation</label>
              <select style={styles.input} value={designation} onChange={e => setDesignation(e.target.value)}>
                <option>Advocate</option><option>Chartered Accountant</option><option>Tax Consultant</option><option>Company Secretary</option><option>Other</option>
              </select>
            </div>
            <button type="submit" style={styles.submitBtn} disabled={loading}>{loading ? 'Creating...' : 'Create account →'}</button>
          </form>
        </div>
      </div>
      <div style={{ background: 'var(--ink)', color: 'var(--cream)', padding: '3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--gold)', textTransform: 'uppercase' }}>◆ BUILT BY A PRACTICING TAX ADVOCATE</div>
        <blockquote style={{ fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '2rem', lineHeight: 1.2, fontStyle: 'italic' }}>
          The law doesn&apos;t lack good judgements. It lacks a good way to <em style={{ color: 'var(--gold)' }}>find them quickly.</em>
          <div style={{ fontFamily: 'EB Garamond, serif', fontSize: '0.95rem', marginTop: '1.5rem', color: 'rgba(245,236,217,0.7)', fontStyle: 'normal' }}>
            <span style={{ fontFamily: 'Fraunces, serif', color: 'var(--gold)', fontStyle: 'italic', display: 'block' }}>Adv. Mohit Jain</span>
            Founder · 10+ years · Delhi HC, ITAT
          </div>
        </blockquote>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(245,236,217,0.15)' }}>
          {[['500+','Judgements'],['27','Courts'],['0.8s','Query']].map(([n,l])=>(
            <div key={l}><div style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', color: 'var(--gold)', fontWeight: 500 }}>{n}</div><div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', color: 'rgba(245,236,217,0.6)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{l}</div></div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return <Suspense fallback={<div>Loading...</div>}><SignupForm /></Suspense>
}

const styles: Record<string, React.CSSProperties> = {
  layout: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1.2fr' },
  formSide: { padding: '3rem', display: 'flex', flexDirection: 'column', background: 'var(--cream)' },
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
