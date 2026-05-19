// One colored solfège card. Port of buildCard() in omr_engine.html (lines 1021-1036).
// Click → tells parent the card's screen coords so the SolPicker can be positioned.
// When `selected` becomes true, the card scrolls itself into view.

import { useEffect, useRef } from 'react'

export default function NoteCard({ note, idx, selected, onClick }) {
  const ref = useRef(null)
  const sol = note.manualSol || note.noteInfo?.solfege || '?'
  const pitch = note.noteInfo?.pitch || ''
  const isSus = sol === 'SUS'
  const isCorrected = !!note.manualSol

  useEffect(() => {
    if (selected && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selected])

  const handleClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    onClick(idx, r.left + r.width / 2, r.top)
  }

  return (
    <div
      ref={ref}
      className={`nc ${sol}${selected ? ' selected' : ''}`}
      id={`nc_${idx}`}
      onClick={handleClick}
    >
      <span
        className="edit-dot"
        style={{ background: isCorrected ? 'var(--gold)' : 'rgba(255,255,255,.2)' }}
      />
      <span className="ns">{isSus ? '𝄽' : sol}</span>
      <span className="np">{isSus ? 'sus' : pitch}</span>
      <span className="ni">{idx + 1}</span>
    </div>
  )
}
