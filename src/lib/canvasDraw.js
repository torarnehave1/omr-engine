// Minimal canvas painter — just the rasterized image + colored note circles.
// Ported subset of redrawCanvas in omr_engine.html (lines 810-853).
// Staff lines / pitch grid / debug binary overlays come in a later slice.

import { SOL_COL } from './pitchMap.js';

export function redrawCanvas(canvas, rawCanvas, omrData, selectedIdx = -1) {
  if (!omrData || !rawCanvas || !canvas) return;
  const { mappedNotes, W, H } = omrData;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(rawCanvas, 0, 0);

  mappedNotes.forEach((n, i) => {
    const sol = n.manualSol || n.noteInfo?.solfege || '?';
    const col = SOL_COL[sol] || '#fff';
    const isSel = i === selectedIdx;
    const r = Math.max(n.w, n.h) / 2 + 3;
    ctx.strokeStyle = isSel ? '#fff' : col;
    ctx.lineWidth = isSel ? 2.5 : 1.8;
    ctx.beginPath();
    ctx.arc(n.cx, n.cy, r, 0, Math.PI * 2);
    ctx.stroke();
    if (isSel) {
      ctx.fillStyle = 'rgba(255,255,255,.1)';
      ctx.beginPath();
      ctx.arc(n.cx, n.cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = col;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sol, n.cx, n.cy - r - 2);
    ctx.textAlign = 'left';
  });
}
