// Small inline input for the X-API-Token. Persists to localStorage.

import { useApiToken } from '../hooks/useApiToken.js'

export default function ApiTokenInput() {
  const [token, setToken] = useApiToken()
  const masked = token ? `${token.slice(0, 6)}…${token.slice(-4)}` : ''

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '.6rem',
        background: 'var(--s2)',
        border: '1px solid var(--border2)',
        borderRadius: 8,
        padding: '.5rem .75rem',
        fontSize: '.62rem',
        color: 'var(--muted)',
        width: '100%',
        maxWidth: 800,
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>🔑 API token</span>
      <input
        type="password"
        placeholder="Paste your vegvisr token to enable cloud save/load"
        value={token}
        onChange={(e) => setToken(e.target.value.trim())}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontFamily: '"Space Mono", monospace',
          fontSize: '.68rem',
          outline: 'none',
        }}
        title="Stored only in this browser's localStorage; sent as X-API-Token to omr-worker."
      />
      {token && (
        <span style={{ fontSize: '.55rem', color: 'var(--green)' }}>set ({masked})</span>
      )}
    </div>
  )
}
