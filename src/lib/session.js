// Session load + apply, ported from omr_engine.html (lines 1482-1598).
// applySessionToImage builds the omrData; the React caller dispatches SESSION_APPLIED.

import { KEY_SIGS } from './keySig.js';
import { posToNote } from './pitchMap.js';

// Parse a JSON file → session object. Throws on invalid structure.
export async function readSessionFile(file) {
  const text = await file.text();
  const session = JSON.parse(text);
  if (!session.notes || !session.staves) {
    throw new Error('Invalid session file: missing notes or staves');
  }
  return session;
}

// Given a session + an imgEl, rasterize the image to a canvas and build omrData.
// Mirrors `applySessionToImage` in the HTML (lines 1556-1598).
export function applySessionToImage(session, imgEl) {
  const MAX_W = 950;
  const scale = Math.min(1, MAX_W / imgEl.width);
  const W = Math.round(imgEl.width * scale);
  const H = Math.round(imgEl.height * scale);

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = W;
  rawCanvas.height = H;
  rawCanvas.getContext('2d').drawImage(imgEl, 0, 0, W, H);

  const keySig = session.key || KEY_SIGS.hicaz_a;
  const staves = session.staves;

  // Assign each note to the stave that contains it (by cy), then sort
  // by (staveIdx, cx) so cards render top-staff left→right, then next staff, etc.
  // The original HTML did this in runOMR (line 617); we re-derive it here on load
  // because saved JSON only carries cx/cy, not staveIdx.
  function staveIdxFor(cy) {
    let best = 0, bestD = Infinity;
    staves.forEach((s, i) => {
      const mid = (s.lines[0] + s.lines[s.lines.length - 1]) / 2;
      const d = Math.abs(cy - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  const mappedNotes = session.notes
    .map((n) => {
      const noteInfo = posToNote(n.staffPos, keySig);
      const staveIdx = staveIdxFor(n.cy);
      return {
        cx: n.cx,
        cy: n.cy,
        x1: n.cx - 8, x2: n.cx + 8,
        y1: n.cy - 4, y2: n.cy + 4,
        w: 16, h: 8,
        staffPos: n.staffPos,
        staveIdx,
        noteInfo,
        manualSol: n.manualSol || null,
        manual: n.manual || false,
      };
    })
    .sort((a, b) => a.staveIdx !== b.staveIdx ? a.staveIdx - b.staveIdx : a.cx - b.cx)
    .map((n, i) => ({ ...n, idx: i }));

  return {
    rawCanvas,
    omrData: { staves, mappedNotes, keySig, W, H },
  };
}
