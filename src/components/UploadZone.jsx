import { useRef } from 'react'
import { loadPdf } from '../lib/pdfLoader.js'
import { readSessionFile } from '../lib/session.js'

export default function UploadZone({ dispatch }) {
  const fileInputRef = useRef(null)   // for PDF / image
  const jsonInputRef = useRef(null)   // for session JSON

  const handleFile = async (file) => {
    if (!file) return
    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
    if (isPdf) {
      try {
        const { pdfDoc, arrayBuffer } = await loadPdf(file)
        dispatch({ type: 'PDF_LOADED', pdfDoc, arrayBuffer, filename: file.name })
        dispatch({ type: 'TOAST', msg: `PDF loaded — ${pdfDoc.numPages} page${pdfDoc.numPages > 1 ? 's' : ''}` })
      } catch (err) {
        dispatch({ type: 'TOAST', msg: 'PDF load failed: ' + err.message })
      }
    } else {
      // Image upload — defer to later slice
      dispatch({ type: 'TOAST', msg: 'Image upload not yet ported (PDF + JSON only for now)' })
    }
  }

  const handleJson = async (file) => {
    if (!file) return
    try {
      const session = await readSessionFile(file)
      dispatch({ type: 'SESSION_PENDING', session })
      dispatch({ type: 'TOAST', msg: `Session ready (${session.notes.length} notes) — now load your PDF` })
    } catch (err) {
      dispatch({ type: 'TOAST', msg: 'Session load failed: ' + err.message })
    }
  }

  const onDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('over') }
  const onDragLeave = (e) => { e.currentTarget.classList.remove('over') }
  const onDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove('over')
    const f = e.dataTransfer.files[0]
    if (!f) return
    if (f.name?.toLowerCase().endsWith('.json')) handleJson(f)
    else handleFile(f)
  }

  return (
    <div
      className="upload-zone"
      id="uploadZone"
      style={{ cursor: 'default', padding: '1.5rem 2rem' }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => handleJson(e.target.files[0])}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: '1rem',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {/* Path A: open score (PDF / image) */}
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1.5px dashed var(--border2)',
            borderRadius: 10,
            padding: '1.25rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '.5rem',
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>𝄞</span>
          <strong style={{ fontSize: '.78rem', color: 'var(--text)' }}>Open score</strong>
          <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>PDF · PNG · JPG</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
          <div style={{ width: 1, flex: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: '.6rem', color: 'var(--muted)' }}>or</span>
          <div style={{ width: 1, flex: 1, background: 'var(--border2)' }} />
        </div>

        {/* Path B: continue session (JSON) */}
        <div
          onClick={() => jsonInputRef.current?.click()}
          style={{
            border: '1.5px dashed rgba(62,212,160,.3)',
            borderRadius: 10,
            padding: '1.25rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '.5rem',
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>📂</span>
          <strong style={{ fontSize: '.78rem', color: 'var(--green)' }}>Continue session</strong>
          <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>Load saved .json</span>
          <span style={{ fontSize: '.58rem', color: 'var(--muted)', marginTop: '.2rem' }}>
            Then open your score to overlay
          </span>
        </div>
      </div>

      <p style={{ fontSize: '.58rem', color: 'var(--muted)', marginTop: '.75rem', textAlign: 'center' }}>
        You can also drag &amp; drop a file anywhere on this zone
      </p>

      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '.85rem', textAlign: 'center' }}>
        <button
          onClick={() => dispatch({ type: 'CLOUD_LIBRARY_TOGGLE' })}
          style={{
            background: 'rgba(168,124,240,.1)',
            border: '1px solid rgba(168,124,240,.4)',
            borderRadius: 8,
            padding: '.5rem 1.2rem',
            color: 'var(--purple)',
            fontFamily: 'inherit',
            fontSize: '.7rem',
            cursor: 'pointer',
          }}
          title="Browse sessions saved to omr-worker (requires API token at top of page)"
        >
          ☁ From cloud — browse saved sessions
        </button>
      </div>
    </div>
  )
}
