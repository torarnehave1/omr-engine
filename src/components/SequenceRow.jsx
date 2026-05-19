// Sequence row — port of renderChips() + renderNoteCards() (omr_engine.html lines 1015-1063).
// Renders the "Detected parameters" chip strip and the colored note card sequence.
// Clicking a card dispatches PICKER_SHOWN with the card's screen position so the
// SolPicker shows next to the card (same as the HTML).

import NoteCard from './NoteCard.jsx'

export default function SequenceRow({ omrData, selectedIdx, dispatch }) {
  if (!omrData) return null
  const { staves, mappedNotes, keySig } = omrData

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
        <div className="sec-lbl">Solfège sequence — click any card to correct it</div>
        <div className="note-seq">
          {mappedNotes.map((n, i) => (
            <NoteCard
              key={i}
              note={n}
              idx={i}
              selected={i === selectedIdx}
              onClick={onCardClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
