import { useEffect, useRef } from 'react'
import { renderPdfPage, rasterizePdfPage } from '../lib/pdfLoader.js'
import { applySessionToImage } from '../lib/session.js'

export default function PdfCard({ pdfDoc, pageNum, scale, pendingSession, dispatch }) {
  const thumbRef = useRef(null)

  useEffect(() => {
    if (!pdfDoc || !thumbRef.current) return
    renderPdfPage(pdfDoc, pageNum, scale, thumbRef.current).catch(err => {
      dispatch({ type: 'LOG', msg: 'PDF render error: ' + err.message, level: 'err' })
    })
  }, [pdfDoc, pageNum, scale, dispatch])

  const onPageNav = (dir) => {
    const next = Math.max(1, Math.min(pdfDoc.numPages, pageNum + dir))
    dispatch({ type: 'PDF_PAGE_CHANGED', pageNum: next })
  }

  const onScaleChange = (e) => {
    dispatch({ type: 'PDF_SCALE_CHANGED', scale: parseFloat(e.target.value) })
  }

  const onUseThisPage = async () => {
    try {
      const { imgEl } = await rasterizePdfPage(pdfDoc, pageNum, scale)
      if (pendingSession) {
        const { rawCanvas, omrData } = applySessionToImage(pendingSession, imgEl)
        dispatch({ type: 'SESSION_APPLIED', omrData })
        dispatch({ type: 'PDF_PAGE_CONFIRMED', imgEl, rawCanvas })
        dispatch({ type: 'TOAST', msg: `Session applied — ${omrData.mappedNotes.length} notes` })
      } else {
        dispatch({ type: 'PDF_PAGE_CONFIRMED', imgEl, rawCanvas: null })
        dispatch({ type: 'TOAST', msg: 'PDF page loaded — OMR pipeline not yet ported' })
      }
    } catch (err) {
      dispatch({ type: 'LOG', msg: 'Use this page failed: ' + err.message, level: 'err' })
    }
  }

  const onCancel = () => dispatch({ type: 'RESET' })

  return (
    <div className="card visible" id="pdfCard" style={{ borderColor: 'rgba(106,168,255,.35)' }}>
      <div className="card-title">PDF loaded — choose page to scan</div>
      <div className="row" style={{ alignItems: 'center', gap: '1rem' }}>
        <label>Page</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <button onClick={() => onPageNav(-1)} style={btnNav}>‹</button>
          <span style={{ fontSize: '.75rem', minWidth: 80, textAlign: 'center', color: 'var(--accent)' }}>
            {pageNum} / {pdfDoc?.numPages || 1}
          </span>
          <button onClick={() => onPageNav(1)} style={btnNav}>›</button>
        </div>
        <label>Render scale</label>
        <div className="slider-wrap">
          <input type="range" min="1" max="4" step="0.5" value={scale} onChange={onScaleChange} />
          <span className="sv">{scale}×</span>
        </div>
        <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>
          Higher scale = bigger step = better accuracy
        </span>
      </div>
      <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border2)', maxHeight: 200 }}>
        <canvas ref={thumbRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', gap: '.75rem' }}>
        <button className="btn btn-primary" style={{ fontSize: '.68rem' }} onClick={onUseThisPage}>✓ Use this page</button>
        <button className="btn btn-ghost" style={{ fontSize: '.68rem' }} onClick={onCancel}>✕ Cancel</button>
      </div>
    </div>
  )
}

const btnNav = {
  background: 'none',
  border: '1px solid var(--border2)',
  borderRadius: 6,
  color: 'var(--text)',
  padding: '.3rem .7rem',
  cursor: 'pointer',
  fontSize: '.9rem',
}
