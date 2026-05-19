// Canvas panel — port of mouse handlers from omr_engine.html (lines 855-1013).
//
// Drag behavior (mirrors HTML exactly):
//   - hover over a note → cursor 'grab' (open hand)
//   - mousedown on a note → cursor 'grabbing' (closed hand)
//   - mousemove while dragging → live update note's cx/cy/staffPos/noteInfo,
//     redraw canvas every frame so the user sees the circle move AND the
//     solfège label above it change in real time
//   - mouseup with hasMoved=true → commit NOTE_MOVED to reducer
//   - mouseup with hasMoved=false → open SolPicker

import { useEffect, useRef, useState } from 'react'
import { redrawCanvas } from '../lib/canvasDraw.js'
import { yToPos, posToNote } from '../lib/pitchMap.js'

export default function CanvasPanel({ rawCanvas, omrData, selectedIdx, dispatch }) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null) // { idx, startX, startY, hasMoved }
  const [dragPreview, setDragPreview] = useState(null) // { idx, cx, cy, staffPos, noteInfo }

  // Redraw on data / selection / drag preview changes
  useEffect(() => {
    if (!canvasRef.current) return
    if (dragPreview && omrData) {
      // Synthesize live data: override the dragged note's position + noteInfo
      const liveData = {
        ...omrData,
        mappedNotes: omrData.mappedNotes.map((n, i) =>
          i === dragPreview.idx
            ? { ...n, cx: dragPreview.cx, cy: dragPreview.cy, staffPos: dragPreview.staffPos, noteInfo: dragPreview.noteInfo }
            : n
        ),
      }
      redrawCanvas(canvasRef.current, rawCanvas, liveData, dragPreview.idx)
    } else {
      redrawCanvas(canvasRef.current, rawCanvas, omrData, selectedIdx)
    }
  }, [rawCanvas, omrData, selectedIdx, dragPreview])

  const canvasXY = (e) => {
    const cv = canvasRef.current
    const rect = cv.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (cv.width / rect.width),
      y: (e.clientY - rect.top) * (cv.height / rect.height),
      clientX: e.clientX,
      clientY: e.clientY,
    }
  }

  const nearestNote = (cx, cy) => {
    if (!omrData) return -1
    const step = omrData.staves[0]?.step || 20
    let bestD = Infinity, bestIdx = -1
    omrData.mappedNotes.forEach((n, i) => {
      const d = Math.hypot(n.cx - cx, n.cy - cy)
      if (d < bestD && d < step * 1.6) { bestD = d; bestIdx = i }
    })
    return bestIdx
  }

  // Live snap (called both during drag mousemove and on mouseup)
  const snapToGrid = (x, y) => {
    const stave = omrData.staves.reduce((best, s) => {
      const mid = (s.lines[0] + s.lines[4]) / 2
      const bMid = (best.lines[0] + best.lines[4]) / 2
      return Math.abs(y - mid) < Math.abs(y - bMid) ? s : best
    }, omrData.staves[0])
    const pos = yToPos(y, stave)
    const gridY = stave.lines[4] - pos * (stave.step / 2)
    const noteInfo = posToNote(pos, omrData.keySig)
    return { x, gridY, pos, noteInfo, stave }
  }

  const onMouseDown = (e) => {
    if (!omrData) return
    const { x, y } = canvasXY(e)
    const idx = nearestNote(x, y)
    if (idx >= 0) {
      dragRef.current = { idx, startX: x, startY: y, hasMoved: false }
      canvasRef.current.style.cursor = 'grabbing'
      e.preventDefault()
    }
  }

  const onMouseMove = (e) => {
    if (!omrData || !canvasRef.current) return
    const { x, y } = canvasXY(e)

    if (dragRef.current) {
      const drag = dragRef.current
      const dist = Math.hypot(x - drag.startX, y - drag.startY)
      if (dist > 4) drag.hasMoved = true

      if (drag.hasMoved) {
        const { gridY, pos, noteInfo } = snapToGrid(x, y)
        if (noteInfo) {
          setDragPreview({ idx: drag.idx, cx: x, cy: gridY, staffPos: pos, noteInfo })
        }
        canvasRef.current.style.cursor = 'grabbing'
      }
      return
    }

    // Hover cursor — grab over a note, crosshair otherwise
    const idx = nearestNote(x, y)
    canvasRef.current.style.cursor = idx >= 0 ? 'grab' : 'crosshair'
  }

  const onMouseUp = (e) => {
    if (!omrData || !canvasRef.current) return
    const { clientX, clientY } = canvasXY(e)
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    canvasRef.current.style.cursor = 'crosshair'

    if (drag.hasMoved && dragPreview) {
      dispatch({
        type: 'NOTE_MOVED',
        idx: dragPreview.idx,
        cx: dragPreview.cx,
        cy: dragPreview.cy,
        staffPos: dragPreview.staffPos,
        noteInfo: dragPreview.noteInfo,
      })
      dispatch({ type: 'TOAST', msg: `Moved to ${dragPreview.noteInfo?.solfege} · ${dragPreview.noteInfo?.pitch}` })
      setDragPreview(null)
    } else {
      // Click → show picker
      setDragPreview(null)
      dispatch({ type: 'PICKER_SHOWN', idx: drag.idx, x: clientX, y: clientY })
    }
  }

  // Cancel drag if mouse leaves the canvas
  const onMouseLeave = () => {
    if (dragRef.current) {
      dragRef.current = null
      setDragPreview(null)
      if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair'
    }
  }

  return (
    <div className="panel-wrap visible" style={{ width: '100%', maxWidth: 800 }}>
      <div className="panel-lbl">
        {omrData
          ? (dragPreview
              ? `Dragging note #${dragPreview.idx + 1} → ${dragPreview.noteInfo?.solfege} · ${dragPreview.noteInfo?.pitch}`
              : `${omrData.mappedNotes.length} notes · click a circle to edit, drag to move`)
          : 'No data'}
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    </div>
  )
}
