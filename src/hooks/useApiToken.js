// API token for omr-worker = the user's emailVerificationToken from magic-link auth.
// Reads from localStorage 'user' (written by lib/auth.js).
// Returns [token, setToken] where setToken is a no-op kept for backward compatibility
// with any callers that used the old paste-in field (which is being removed).

import { useEffect, useState, useCallback } from 'react'
import { readStoredUser } from '../lib/auth.js'

export function useApiToken() {
  const [token, setTokenState] = useState(() => readStoredUser()?.emailVerificationToken || '')

  // Sync if another tab logs in/out (the stored 'user' key is touched).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        setTokenState(readStoredUser()?.emailVerificationToken || '')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // No-op (the manual paste field is removed; token now flows from auth).
  const setToken = useCallback(() => {}, [])

  return [token, setToken]
}
