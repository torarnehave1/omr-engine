// AuthGate — three states (checking / authed / anonymous).
// On mount:
//   1. DEV ONLY — if VITE_DEV_USER_EMAIL + VITE_DEV_USER_TOKEN are present in .env.local
//      and no user is stored, auto-persist the dev user and skip the magic-link flow.
//      Production builds (import.meta.env.DEV === false) ignore these env vars entirely.
//   2. Look for ?magic=<token> in URL → verify, persist, strip query, → authed.
//   3. Else read stored user → authed if present, anonymous otherwise.
// While authed, exposes the user via AuthContext for downstream consumers (e.g. useApiToken).

import { createContext, useEffect, useState } from 'react'
import {
  readStoredUser,
  persistUser,
  clearUser,
  verifyMagicToken,
  fetchUserContext,
} from '../lib/auth.js'
import Login from './Login.jsx'

export const AuthContext = createContext(null)

// Dev auto-login — only runs in vite dev mode, gated by env vars from .env.local.
function readDevUserFromEnv() {
  if (!import.meta.env.DEV) return null
  const email = import.meta.env.VITE_DEV_USER_EMAIL
  const token = import.meta.env.VITE_DEV_USER_TOKEN
  if (!email || !token) return null
  return {
    email,
    role: import.meta.env.VITE_DEV_USER_ROLE || 'developer',
    user_id: email,
    oauth_id: email,
    emailVerificationToken: token,
  }
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('checking') // 'checking' | 'authed' | 'anonymous'
  const [error, setError] = useState('')
  const [devAutoLogin, setDevAutoLogin] = useState(false)

  // 1) Magic-link callback (?magic=<token>)
  useEffect(() => {
    const url = new URL(window.location.href)
    const magic = url.searchParams.get('magic')
    if (!magic) return
    setStatus('checking')
    ;(async () => {
      try {
        const { email } = await verifyMagicToken(magic)
        let ctx
        try {
          ctx = await fetchUserContext(email)
        } catch {
          // Dashboard lookup failed — degrade gracefully with minimal user.
          ctx = { email, role: 'user', user_id: email, emailVerificationToken: null }
        }
        const stored = persistUser(ctx)
        url.searchParams.delete('magic')
        window.history.replaceState({}, '', url.toString())
        setUser(stored)
        setStatus('authed')
      } catch (err) {
        setError(err.message || 'Magic link verification failed.')
        setStatus('anonymous')
      }
    })()
  }, [])

  // 2) Restore stored session on mount, or dev-auto-login fallback.
  // Only runs when there's no magic-link in the URL (step 1 owns that case).
  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('magic')) return

    const stored = readStoredUser()
    if (stored) {
      setUser(stored)
      setStatus('authed')
      return
    }

    // No stored user — try dev env fallback (dev mode only).
    const devUser = readDevUserFromEnv()
    if (devUser) {
      const persisted = persistUser(devUser)
      setUser(persisted)
      setDevAutoLogin(true)
      setStatus('authed')
      return
    }

    setStatus('anonymous')
  }, [])

  const handleLogout = () => {
    clearUser()
    setUser(null)
    setStatus('anonymous')
  }

  if (status === 'checking') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: '.7rem',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
        }}
      >
        … Checking session
      </div>
    )
  }

  if (status === 'anonymous') {
    return (
      <>
        <Login />
        {error && (
          <div
            style={{
              position: 'fixed',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(240,112,112,.15)',
              border: '1px solid rgba(240,112,112,.4)',
              color: 'var(--red)',
              padding: '.5rem 1rem',
              borderRadius: 8,
              fontSize: '.65rem',
              maxWidth: 480,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </>
    )
  }

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout, devAutoLogin }}>
      {children}
    </AuthContext.Provider>
  )
}
