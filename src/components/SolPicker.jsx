// Solfège picker popup — ported from omr_engine.html (lines 1066-1140).
// Renders 11 solfège options + revert + delete buttons.

import { useEffect } from 'react'
import { ALL_SOL } from '../lib/pitchMap.js'

export default function SolPicker({ visible, idx, x, y, omrData, dispatch }) {
  // Close on outside click
  useEffect(() => {
    if (!visible) return
    const onDocClick = (e) => {
      if (!e.target.closest('.sol-picker') && !e.target.closest('canvas')) {
        dispatch({ type: 'PICKER_HIDDEN' })
      }
    }
    // Defer so the opening click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('click', onDocClick), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('click', onDocClick)
    }
  }, [visible, dispatch])

  if (!visible || !omrData) return null
  const note = omrData.mappedNotes[idx]
  if (!note) return null

  const currentSol = note.manualSol || note.noteInfo?.solfege || '?'
  const pitchInfo = note.noteInfo?.pitch || ''

  // Position (HTML logic: pw=260, ph=300; clamp to viewport)
  const pw = 260, ph = 300
  const px = Math.max(8, Math.min(x - pw / 2, window.innerWidth - pw - 8))
  const py = y - ph - 8 < 8 ? y + 32 : y - ph - 8

  return (
    <div className="sol-picker visible" style={{ left: px, top: py }}>
      <div className="picker-title">
        Set solfège · detected: {pitchInfo} ({currentSol})
      </div>
      <div className="sol-grid">
        {ALL_SOL.map(sol => (
          <div
            key={sol}
            className={'sol-opt ' + sol}
            style={sol === currentSol ? { outline: '2px solid rgba(255,255,255,0.7)' } : undefined}
            onClick={() => dispatch({ type: 'NOTE_SOLFEGE_CHANGED', idx, solfege: sol })}
          >
            {sol}
          </div>
        ))}
        <div
          className="sol-opt"
          style={{ color: '#94a3b8', fontSize: '.62rem', gridColumn: 'span 2' }}
          onClick={() => dispatch({ type: 'NOTE_REVERTED', idx })}
        >
          ↩ revert to auto
        </div>
        <div
          className="sol-opt DEL"
          style={{ gridColumn: 'span 2', fontSize: '.62rem' }}
          onClick={() => dispatch({ type: 'NOTE_DELETED', idx })}
        >
          ✕ delete this note
        </div>
      </div>
      <button className="picker-close" onClick={() => dispatch({ type: 'PICKER_HIDDEN' })}>✕ close</button>
    </div>
  )
}
