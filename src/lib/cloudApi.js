// Fetch wrappers for omr-worker (https://omr-worker.torarnehave.workers.dev).
// Auth: X-API-Token header (validated against vegvisr_org D1 config table).
// All functions throw on non-2xx and parse JSON; binary endpoints return Blob.

const DEFAULT_BASE = 'https://omr-worker.torarnehave.workers.dev'

export function apiBase() {
  return import.meta.env.VITE_OMR_API_BASE || DEFAULT_BASE
}

function headers(token, contentType) {
  const h = { 'X-API-Token': token }
  if (contentType) h['Content-Type'] = contentType
  return h
}

async function asJson(res) {
  let body
  try { body = await res.json() } catch { body = null }
  if (!res.ok) {
    const msg = body?.error || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return body
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export async function listSessions(token) {
  const res = await fetch(`${apiBase()}/sessions`, { headers: headers(token) })
  const body = await asJson(res)
  return body.sessions || []
}

export async function getSession(token, id) {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(id)}`, { headers: headers(token) })
  return asJson(res)
}

export async function putSession(token, id, payload) {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(token, 'application/json'),
    body: JSON.stringify(payload),
  })
  return asJson(res)
}

export async function deleteSession(token, id) {
  const res = await fetch(`${apiBase()}/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headers(token),
  })
  return asJson(res)
}

// ── PDFs ─────────────────────────────────────────────────────────────────────
export async function putPdf(token, id, pdfBlobOrBuffer) {
  const res = await fetch(`${apiBase()}/pdfs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: headers(token, 'application/pdf'),
    body: pdfBlobOrBuffer,
  })
  return asJson(res)
}

export async function getPdfBlob(token, id) {
  const res = await fetch(`${apiBase()}/pdfs/${encodeURIComponent(id)}`, { headers: headers(token) })
  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = null }
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return res.blob()
}

// ── Health (no auth) ─────────────────────────────────────────────────────────
export async function getHealth() {
  const res = await fetch(`${apiBase()}/health`)
  return asJson(res)
}
