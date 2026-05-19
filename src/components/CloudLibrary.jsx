// Modal-ish card listing the user's saved sessions from omr-worker KV.
// Click a session row → load JSON + PDF in parallel → apply (no Use this page click).
// Click the ✕ on a row → confirm → DELETE /sessions/:id (also removes the linked PDF in R2).

import { useEffect, useState } from 'react'
import { useApiToken } from '../hooks/useApiToken.js'
import { listSessions, getSession, getPdfBlob, deleteSession } from '../lib/cloudApi.js'
import { applySessionToImage } from '../lib/session.js'
import { loadPdfFromArrayBuffer, rasterizePdfPage } from '../lib/pdfLoader.js'

// Detect format by magic bytes:
//   %PDF → 0x25 0x50 0x44 0x46
//   PNG  → 0x89 0x50 0x4E 0x47
async function blobToImgEl(blob, meta) {
  const arrayBuffer = await blob.arrayBuffer()
  const head = new Uint8Array(arrayBuffer.slice(0, 4))
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46

  if (isPdf) {
    const pdfDoc = await loadPdfFromArrayBuffer(arrayBuffer)
    const pageNum = meta?.pdfPageNum || 1
    const scale = meta?.pdfScale || 2.5
    const { imgEl } = await rasterizePdfPage(pdfDoc, pageNum, scale)
    return { imgEl, arrayBuffer }
  }

  // Image fallback (legacy PNG saves from before the PDF upload fix)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([arrayBuffer]))
    const img = new Image()
    img.onload = () => resolve({ imgEl: img, arrayBuffer: null })
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e) }
    img.src = url
  })
}

export default function CloudLibrary({ onClose, dispatch }) {
  const [token] = useApiToken()
  const [sessions, setSessions] = useState(null) // null = loading, [] = empty, [...] = loaded
  const [error, setError] = useState('')
  const [loadingId, setLoadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!token) { setError('Set your API token first (top of page).'); return }
    let cancelled = false
    listSessions(token)
      .then((s) => { if (!cancelled) setSessions(s) })
      .catch((e) => { if (!cancelled) setError(e.message) })
    return () => { cancelled = true }
  }, [token])

  const onPick = async (s) => {
    if (!token || loadingId || deletingId) return
    setLoadingId(s.id)
    setError('')
    try {
      const [session, pdfBlob] = await Promise.all([
        getSession(token, s.id),
        getPdfBlob(token, s.id),
      ])
      const { imgEl, arrayBuffer } = await blobToImgEl(pdfBlob, session.meta)
      const { rawCanvas, omrData } = applySessionToImage(session, imgEl)
      dispatch({ type: 'SESSION_APPLIED', omrData })
      dispatch({ type: 'PDF_PAGE_CONFIRMED', imgEl, rawCanvas, arrayBuffer: arrayBuffer || undefined })
      dispatch({ type: 'SAVED_SESSION_ID', id: s.id })
      dispatch({ type: 'TOAST', msg: `Loaded: ${s.filename || s.id} (${omrData.mappedNotes.length} notes)` })
      onClose()
    } catch (err) {
      setError(err.message || String(err))
      setLoadingId(null)
    }
  }

  const onDelete = async (s, e) => {
    e.stopPropagation()
    if (!token || loadingId || deletingId) return
    const ok = window.confirm(`Delete "${s.filename || s.id}"?\n\nThis removes the session JSON from KV and its PDF from R2.\nThis cannot be undone.`)
    if (!ok) return
    setDeletingId(s.id)
    setError('')
    try {
      await deleteSession(token, s.id)
      setSessions((prev) => prev.filter((x) => x.id !== s.id))
      dispatch({ type: 'TOAST', msg: `Deleted: ${s.filename || s.id}` })
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--s1)', border: '1px solid var(--border2)', borderRadius: 14,
          width: '100%', maxWidth: 640, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '.85rem', fontFamily: '"Crimson Pro", serif', fontStyle: 'italic', color: 'var(--accent)' }}>
            Saved sessions
          </div>
          <button onClick={onClose} className="picker-close">✕ close</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '.75rem' }}>
          {error && (
            <div style={{ padding: '.75rem', color: 'var(--red)', fontSize: '.68rem' }}>{error}</div>
          )}
          {!error && sessions === null && (
            <div style={{ padding: '.75rem', color: 'var(--muted)', fontSize: '.68rem' }}>Loading…</div>
          )}
          {!error && sessions && sessions.length === 0 && (
            <div style={{ padding: '.75rem', color: 'var(--muted)', fontSize: '.68rem' }}>
              No saved sessions yet. Use "Save to cloud" after editing a score.
            </div>
          )}
          {sessions && sessions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sessions.map((s) => {
                const isLoading = loadingId === s.id
                const isDeleting = deletingId === s.id
                const isBusy = loadingId !== null || deletingId !== null
                const isOtherBusy = isBusy && !isLoading && !isDeleting
                return (
                  <div
                    key={s.id}
                    onClick={() => onPick(s)}
                    role="button"
                    tabIndex={0}
                    style={{
                      background: 'var(--s2)', border: '1px solid var(--border2)', borderRadius: 8,
                      padding: '.6rem .75rem', color: 'var(--text)',
                      cursor: isBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '.5rem',
                      opacity: isOtherBusy ? 0.4 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '.75rem' }}>
                        {isLoading ? '⏳ ' : ''}{isDeleting ? '🗑 ' : ''}{s.filename}
                      </span>
                      <span style={{ fontSize: '.56rem', color: 'var(--muted)' }}>
                        {s.notes} notes · {new Date(s.savedAt).toLocaleString()}
                        {s.meta?.pdfFilename ? ` · ${s.meta.pdfFilename}` : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '.56rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{s.id}</span>
                    <button
                      onClick={(e) => onDelete(s, e)}
                      disabled={isBusy}
                      title="Delete this session (JSON in KV + PDF in R2)"
                      style={{
                        background: 'none', border: '1px solid rgba(240,112,112,.3)',
                        borderRadius: 6, color: 'var(--red)',
                        fontFamily: 'inherit', fontSize: '.62rem',
                        padding: '.25rem .5rem', cursor: isBusy ? 'wait' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
