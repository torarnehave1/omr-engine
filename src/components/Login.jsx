// Magic-link login screen — visual style matches OMR's existing CSS
// (Crimson Pro italic title, Space Mono body, --s1/--s2/--accent variables).
// Flow ported from /Users/torarnehave/Documents/GitHub/Contacts/src/components/Login.tsx.

import { useState } from 'react'
import { sendMagicLink } from '../lib/auth.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(''); setLoading(true)
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`
      await sendMagicLink(email, redirectUrl)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send magic link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="card visible"
        style={{ maxWidth: 420, padding: '2rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '.85rem',
            }}
          >
            <img
              src="https://favicons.vegvisr.org/favicons/sdxl-1779256409969-1779256438669-180x180.png"
              alt="OMR Scanner"
              width="72"
              height="72"
              referrerPolicy="no-referrer"
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                boxShadow: '0 8px 28px rgba(106,168,255,.25), 0 2px 8px rgba(0,0,0,.5)',
                border: '1px solid rgba(106,168,255,.2)',
                background: 'var(--s2)',
              }}
            />
          </div>
          <div
            style={{
              fontFamily: '"Crimson Pro", serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '2rem',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '.3rem',
            }}
          >
            OMR Scanner
          </div>
          <div
            style={{
              fontSize: '.62rem',
              color: 'var(--muted)',
              letterSpacing: '.15em',
              textTransform: 'uppercase',
            }}
          >
            Sign in to continue
          </div>
        </div>

        {sent ? (
          <div
            style={{
              background: 'rgba(62,212,160,.1)',
              border: '1px solid rgba(62,212,160,.3)',
              borderRadius: 10,
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '.85rem', color: 'var(--green)', fontWeight: 700, marginBottom: '.4rem' }}>
              ✓ Magic link sent
            </div>
            <div style={{ fontSize: '.65rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Check your inbox at <strong style={{ color: 'var(--green)' }}>{email}</strong> and click the link to sign in.
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail('') }}
              style={{
                marginTop: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: '.6rem',
                cursor: 'pointer',
              }}
            >
              Try another email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            <label
              htmlFor="omr-login-email"
              style={{
                fontSize: '.58rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.12em',
              }}
            >
              Email address
            </label>
            <input
              id="omr-login-email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={loading}
              style={{ width: '100%' }}
            />

            {error && (
              <div
                style={{
                  background: 'rgba(240,112,112,.1)',
                  border: '1px solid rgba(240,112,112,.3)',
                  borderRadius: 8,
                  padding: '.55rem .75rem',
                  fontSize: '.65rem',
                  color: 'var(--red)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !email.trim()}
              style={{ marginTop: '.25rem' }}
            >
              {loading ? '… Sending link' : 'Send magic link'}
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            fontSize: '.55rem',
            color: 'var(--muted)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          A short-lived link will be emailed to you. No password required.<br />
          Powered by <code style={{ color: 'var(--accent)' }}>cookie.vegvisr.org</code>.
        </p>
      </div>
    </div>
  )
}
