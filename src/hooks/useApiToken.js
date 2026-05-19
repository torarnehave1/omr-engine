import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'omr.apiToken'

export function useApiToken() {
  const [token, setTokenState] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })

  const setToken = useCallback((next) => {
    setTokenState(next)
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next)
      else localStorage.removeItem(STORAGE_KEY)
    } catch (_) {}
  }, [])

  // Sync if another tab changes the token
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setTokenState(e.newValue || '')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return [token, setToken]
}
