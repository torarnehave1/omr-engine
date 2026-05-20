// Sequence row — port of renderChips() + renderNoteCards() (omr_engine.html lines 1015-1063).
// Renders the "Detected parameters" chip strip and the colored note card sequence.
// Clicking a card dispatches PICKER_SHOWN with the card's screen position so the
// SolPicker shows next to the card (same as the HTML).

import NoteCard from './NoteCard.jsx'

export default function SequenceRow({ omrData, selectedIdx, dispatch }) {
  if (!omrData) return null
  const { staves, mappedNotes, keySig } = omrData

  // Group cards by staveIdx so each stave (line of music on the sheet)
  // gets its own row of cards. Notes are already sorted (staveIdx, cx)
  // by applySessionToImage, so we just need to bucket them.
  const byStave = staves.map(() => [])
  mappedNotes.forEach((n) => {
    const si = n.staveIdx ?? 0
    if (byStave[si]) byStave[si].push(n)
    else if (byStave[0]) byStave[0].push(n)
  })

  const onCardClick = (idx, clientX, clientY) => {
    dispatch({ type: 'PICKER_SHOWN', idx, x: clientX, y: clientY })
  }

  return (
    <div className="seq-wrap visible">
      <div>
        <div className="sec-lbl">Detected parameters</div>
        <div className="chips">
          <div className="chip"><span>Key</span><span>{keySig.name}</span></div>
          {keySig.tonicNote && (
            <div className="chip"><span>Tonic</span><span>{keySig.tonicNote} = {keySig.tonicSol}</span></div>
          )}
          <div className="chip"><span>Systems</span><span>{staves.length}</span></div>
          <div className="chip"><span>Notes</span><span>{mappedNotes.length}</span></div>
          {staves[0]?.step != null && (
            <div className="chip"><span>Step</span><span>{staves[0].step.toFixed(1)}px</span></div>
          )}
        </div>
      </div>

      <div>
        <div className="sec-lbl">Solfège sequence — one row per stave, click any card to correct it</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {byStave.map((notes, si) => (
            <div
              key={si}
              className="note-seq"
              style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 4 }}
            >
              {notes.map((n) => (
                <NoteCard
                  key={n.idx}
                  note={n}
                  idx={n.idx}
                  selected={n.idx === selectedIdx}
                  onClick={onCardClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
