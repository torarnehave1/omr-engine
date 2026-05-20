// Magic-link auth via cookie.vegvisr.org — pattern ported from
// /Users/torarnehave/Documents/GitHub/Contacts/src/{lib/auth.ts,App.tsx}.
// The stored user object's `emailVerificationToken` doubles as the
// X-API-Token expected by omr-worker (same D1 column).

export const MAGIC_BASE = 'https://cookie.vegvisr.org'
export const DASHBOARD_BASE = 'https://dashboard.vegvisr.org'
const STORAGE_KEY = 'user'
const COOKIE_NAME = 'vegvisr_token'

// ── localStorage ────────────────────────────────────────────────────────────
export function readStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    const userId = p.user_id || p.oauth_id
    if (!userId || !p.email) return null
    return {
      userId,
      email: p.email,
      role: p.role || null,
      emailVerificationToken: p.emailVerificationToken || null,
    }
  } catch {
    return null
  }
}

export function persistUser(user) {
  const payload = {
    email: user.email,
    role: user.role,
    user_id: user.user_id,
    oauth_id: user.oauth_id || user.user_id || null,
    emailVerificationToken: user.emailVerificationToken,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    sessionStorage.setItem('email_session_verified', '1')
  } catch (_) { /* ignore quota / SSR */ }
  if (payload.emailVerificationToken) setAuthCookie(payload.emailVerificationToken)
  return {
    userId: payload.user_id || payload.oauth_id || '',
    email: payload.email,
    role: payload.role || null,
    emailVerificationToken: payload.emailVerificationToken || null,
  }
}

export function clearUser() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('email_session_verified')
  } catch (_) { /* ignore */ }
  clearAuthCookie()
}

// ── cookies (mirrors Contacts: .vegvisr.org on that domain, else current host) ──
export function setAuthCookie(token) {
  if (!token) return
  const onVegvisr = window.location.hostname.endsWith('vegvisr.org')
  const domain = onVegvisr ? '; Domain=.vegvisr.org' : ''
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure${domain}`
}

export function clearAuthCookie() {
  const base = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax; Secure`
  document.cookie = base
  if (window.location.hostname.endsWith('vegvisr.org')) {
    document.cookie = `${base}; Domain=.vegvisr.org`
  }
}

// ── magic link API ──────────────────────────────────────────────────────────
export async function sendMagicLink(email, redirectUrl) {
  const res = await fetch(`${MAGIC_BASE}/login/magic/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), redirectUrl }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || 'Failed to send magic link.')
  return data
}

export async function verifyMagicToken(token) {
  const res = await fetch(`${MAGIC_BASE}/login/magic/verify?token=${encodeURIComponent(token)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success || !data.email) {
    throw new Error(data.error || 'Invalid or expired magic link.')
  }
  return data
}

export async function fetchUserContext(email) {
  const roleRes = await fetch(`${DASHBOARD_BASE}/get-role?email=${encodeURIComponent(email)}`)
  if (!roleRes.ok) throw new Error(`User role unavailable (status: ${roleRes.status})`)
  const roleData = await roleRes.json()
  if (!roleData?.role) throw new Error('Unable to retrieve user role.')
  const userDataRes = await fetch(`${DASHBOARD_BASE}/userdata?email=${encodeURIComponent(email)}`)
  if (!userDataRes.ok) throw new Error(`Unable to fetch user data (status: ${userDataRes.status})`)
  const userData = await userDataRes.json()
  return {
    email,
    role: roleData.role,
    user_id: userData.user_id,
    emailVerificationToken: userData.emailVerificationToken,
    oauth_id: userData.oauth_id,
  }
}
