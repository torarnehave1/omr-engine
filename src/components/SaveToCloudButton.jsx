// "Save to cloud" — uploads the current omrData (as JSON) + the rasterized PDF page
// (as application/pdf) to omr-worker. The session ID is a slug from the filename
// or a fresh UUID. The saved JSON has meta.pdfFilename / pdfPageNum / pdfScale so
// reloading auto-opens the PDF without a second file picker.

import { useState } from 'react'
import { useApiToken } from '../hooks/useApiToken.js'
import { putSession, putPdf } from '../lib/cloudApi.js'

function randomId() {
  // RFC4122-ish, enough for our purpose
  return 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36)
}

function canvasToPngBlob(canvas) {
  // Fallback path only — used when no original PDF arrayBuffer is in state
  // (e.g. a session loaded from cloud where we never had the local file).
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
}

export default function SaveToCloudButton({ state, dispatch }) {
  const [token] = useApiToken()
  const [busy, setBusy] = useState(false)

  if (!state.omrData) return null

  const onSave = async () => {
    if (!token) {
      dispatch({ type: 'TOAST', msg: 'Set your API token first (top of page)' })
      return
    }
    setBusy(true)
    try {
      const id = state.savedSessionId || randomId()
      const filename = state.omrData?.keySig?.name
        ? `${state.omrData.keySig.name} — ${new Date().toISOString().slice(0, 10)}`
        : `OMR session ${new Date().toISOString().slice(0, 10)}`

      const payload = {
        version: 2,
        filename,
        meta: {
          pdfFilename: state.pdfFilename || null,
          pdfPageNum: state.pdfPageNum,
          pdfScale: state.pdfScale,
        },
        key: state.omrData.keySig,
        staves: state.omrData.staves.map((s) => ({ lines: s.lines, step: s.step })),
        notes: state.omrData.mappedNotes.map((n) => ({
          idx: n.idx,
          cx: Math.round(n.cx),
          cy: Math.round(n.cy),
          staffPos: n.staffPos,
          solfege: n.manualSol || n.noteInfo?.solfege || '?',
          manualSol: n.manualSol || null,
          pitch: n.noteInfo?.pitch || '',
          manual: n.manual || false,
        })),
      }

      // Upload the JSON. Always do this first (small, fast).
      await putSession(token, id, payload)

      // Upload the original PDF if we have it; otherwise fall back to the
      // rasterised canvas as PNG (load side detects format by magic bytes).
      if (state.pdfArrayBuffer) {
        await putPdf(token, id, state.pdfArrayBuffer)
      } else if (state.rawCanvas) {
        const blob = await canvasToPngBlob(state.rawCanvas)
        if (blob) await putPdf(token, id, blob)
      }

      dispatch({ type: 'SAVED_SESSION_ID', id })
      dispatch({ type: 'TOAST', msg: `Saved to cloud as ${filename}` })
    } catch (err) {
      dispatch({ type: 'TOAST', msg: 'Save failed: ' + err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      className="tog"
      onClick={onSave}
      disabled={busy || !token}
      style={{ color: 'var(--accent)', borderColor: 'rgba(106,168,255,.3)' }}
      title={token ? 'Save current session JSON + rasterised PDF to omr-worker' : 'Set your API token at the top of the page first'}
    >
      {busy ? '⏳ Saving…' : '☁ Save to cloud'}
    </button>
  )
}
