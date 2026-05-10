'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[NyayIQ error boundary]', error)
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div style={styles.layout}>
      <div style={styles.container}>
        <div style={styles.kicker}>◆ SOMETHING BROKE</div>
        <h1 style={styles.title}>
          We hit an <em style={{ color: 'var(--orange-deep)', fontStyle: 'italic' }}>unexpected error.</em>
        </h1>
        <p style={styles.subtitle}>
          {isDev
            ? 'Details below — visible in development only.'
            : 'Our team has been notified. You can try again, or head back to the home page.'}
        </p>

        {isDev && (
          <div style={styles.devBox}>
            {error.digest && (
              <div style={styles.devRow}>
                <span style={styles.devLabel}>Digest</span>
                <code style={styles.devValue}>{error.digest}</code>
              </div>
            )}
            <div style={styles.devRow}>
              <span style={styles.devLabel}>Message</span>
              <code style={styles.devValue}>{error.message || '(no message)'}</code>
            </div>
            {error.stack && (
              <div style={styles.devRow}>
                <span style={styles.devLabel}>Stack</span>
                <pre style={styles.stack}>{error.stack}</pre>
              </div>
            )}
          </div>
        )}

        {!isDev && error.digest && (
          <div style={styles.digestBox}>
            <span style={styles.devLabel}>Reference ID</span>
            <code style={styles.devValue}>{error.digest}</code>
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={() => reset()} style={styles.primaryBtn}>
            Try again →
          </button>
          <a href="/" style={styles.secondaryBtn}>
            Back to home
          </a>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  layout: { minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--cream)', padding: '2rem' },
  container: { maxWidth: 560, width: '100%' },
  kicker: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--orange-deep)', letterSpacing: '0.25em', marginBottom: '1rem' },
  title: { fontFamily: 'Fraunces, serif', fontWeight: 300, fontSize: '2.8rem', lineHeight: 1, letterSpacing: '-0.025em', marginBottom: '0.75rem', color: 'var(--ink)' },
  subtitle: { fontFamily: 'EB Garamond, serif', fontSize: '1.05rem', color: 'var(--ink-2)', fontStyle: 'italic', marginBottom: '2rem' },
  devBox: { background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  devRow: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  devLabel: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-2)' },
  devValue: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', color: 'var(--ink)', wordBreak: 'break-word' },
  stack: { fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(0,0,0,0.03)', padding: '0.85rem', borderRadius: 4, margin: 0, maxHeight: 320, overflow: 'auto' },
  digestBox: { background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 4, padding: '0.85rem 1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  actions: { display: 'flex', gap: '0.85rem', flexWrap: 'wrap' },
  primaryBtn: { padding: '0.85rem 1.5rem', background: 'var(--orange-deep)', color: 'var(--cream)', border: 'none', borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer' },
  secondaryBtn: { padding: '0.85rem 1.5rem', background: 'transparent', color: 'var(--ink)', border: '1px solid var(--line)', borderRadius: 4, fontFamily: 'Inter Tight, sans-serif', fontSize: '0.95rem', fontWeight: 500, textDecoration: 'none', display: 'inline-grid', placeItems: 'center' },
}
