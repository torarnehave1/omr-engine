// PDF helpers, ported from omr_engine.html (lines 449-510).
// Uses npm pdfjs-dist instead of CDN. Worker resolved via Vite ?url import.

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  // pdfjs.getDocument transfers the ArrayBuffer to its worker, which detaches
  // it on the main thread (byteLength becomes 0). Give pdfjs a clone so we
  // can still use the original for cloud upload later.
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
  return { pdfDoc, arrayBuffer };
}

// Load a pdfDoc from an existing ArrayBuffer (used when fetching from R2).
// pdfjs consumes the buffer, so callers that need it twice should clone first.
export async function loadPdfFromArrayBuffer(arrayBuffer) {
  return pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
}

// Render a page to a given canvas at the given scale.
export async function renderPdfPage(pdfDoc, pageNum, scale, canvas) {
  const page = await pdfDoc.getPage(pageNum);
  const vp = page.getViewport({ scale });
  canvas.width = vp.width;
  canvas.height = vp.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
  return { width: vp.width, height: vp.height };
}

// Confirm: rasterize the chosen page to an Image element (so the rest of the
// pipeline can work with imgEl just like image uploads).
export async function rasterizePdfPage(pdfDoc, pageNum, scale) {
  const page = await pdfDoc.getPage(pageNum);
  const vp = page.getViewport({ scale });
  const offscreen = document.createElement('canvas');
  offscreen.width = vp.width;
  offscreen.height = vp.height;
  await page.render({ canvasContext: offscreen.getContext('2d'), viewport: vp }).promise;
  const dataUrl = offscreen.toDataURL('image/png');
  const imgEl = await loadImageFromDataUrl(dataUrl);
  return { imgEl, width: vp.width, height: vp.height };
}

function loadImageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
