// Ported from omr_engine.html (lines 372-381, 784-807).
// 2026-05-20: TIB renamed to SI per user request. Natural B still maps to TI.
// HTML reference stays untouched (PLAN §6 / lessons_learned.md #3 — HTML is template only).

// Treble clef: pos 0 = E4 (bottom line), each +1 = one staff step up.
export const STAFF_POS = [
  { l: 'A', o: 3 }, { l: 'B', o: 3 }, { l: 'C', o: 4 }, { l: 'D', o: 4 },
  { l: 'E', o: 4 }, { l: 'F', o: 4 }, { l: 'G', o: 4 }, { l: 'A', o: 4 }, { l: 'B', o: 4 },
  { l: 'C', o: 5 }, { l: 'D', o: 5 }, { l: 'E', o: 5 }, { l: 'F', o: 5 }, { l: 'G', o: 5 },
];

export const BASE_SOL = { C: 'DO', D: 'RE', E: 'MI', F: 'FA', G: 'SOL', A: 'LA', B: 'TI' };

export const ALL_SOL = ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'TI', 'SI', 'FI', 'MIB', 'SUS'];

export const SOL_COL = {
  DO: '#f87171', RE: '#fb923c', MI: '#fbbf24', FA: '#84cc16',
  SOL: '#34d399', LA: '#38bdf8', TI: '#a78bfa', SI: '#c084fc',
  FI: '#4ade80', MIB: '#fde68a', SUS: '#64748b',
};

// Snap a pixel y-coordinate to the nearest staff grid position (range [-4, 12]).
export function yToPos(y, stave) {
  const { lines, step } = stave;
  const halfStep = step / 2;
  let bestPos = 0, bestDist = Infinity;
  for (let pos = -4; pos <= 12; pos++) {
    const gridY = lines[4] - pos * halfStep;
    const dist = Math.abs(y - gridY);
    if (dist < bestDist) { bestDist = dist; bestPos = pos; }
  }
  return bestPos;
}

// Map a staff position + key signature → {letter, accidental, octave, solfege, pitch} or null.
export function posToNote(pos, keySig) {
  const idx = pos + 4;
  if (idx < 0 || idx >= STAFF_POS.length) return null;
  const { l, o } = STAFF_POS[idx];
  let solfege = BASE_SOL[l] || l, pitch = l + o, accidental = '';
  if (keySig.flats.includes(l))  { accidental = 'b'; pitch = l + 'b' + o; solfege = solfege + 'B'; }
  if (keySig.sharps.includes(l)) { accidental = '#'; pitch = l + '#' + o; solfege = l === 'F' ? 'FI' : solfege + 'SHARP'; }
  if (solfege === 'TISHARP') solfege = 'TI';
  if (solfege === 'TIB') solfege = 'SI'; // user rename 2026-05-20
  return { letter: l, accidental, octave: o, solfege, pitch };
}
