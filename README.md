# OMR Engine

Optical Music Recognition scanner and editor for sheet music — React + Vite frontend, Cloudflare Workers backend (KV + R2).

Originally a single-file HTML prototype, ported to React for incremental development and cloud-backed session storage.

## What it does

- Load a saved session (`.json`) and its matching PDF — overlays detected note circles on the rasterised PDF page
- Click any note circle to change the solfège (full Hicaz / Uşşak / Segah / C-Major / custom key support)
- Drag any note vertically to snap it to a new staff position — pitch and solfège update live
- Save sessions to Cloudflare KV; PDFs go to R2; one-click reload from a library modal
- Manual overrides (`manualSol`) and rest markers (`SUS`) round-trip cleanly through save/load

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite 5, `pdfjs-dist` 4.10 |
| Tests | Vitest (pure pitch/key modules) |
| Cloud backend | Cloudflare Worker (`omr-worker`) — KV (`omr-sessions`), R2 (`omr-pdfs`), D1 (`vegvisr_org`) |
| Auth | `X-API-Token` header validated against `vegvisr_org.config.emailVerificationToken` |

The worker source lives separately in the [vegvisr-frontend](https://github.com/torarnehave1/vegvisr-frontend) monorepo under `/omr-worker/`.

## Local development

```bash
npm install
npm run dev       # Vite on http://localhost:5174 (5173 is used by another local project)
npm test          # Vitest run (currently 37 cases on keySig + pitchMap)
npm run build     # production build to dist/
```

The dev server config is in `.claude/launch.json` so Claude Code's preview pane can attach automatically.

## Architecture

```
Browser → Vite dev (port 5174)
         │
         └── HTTPS → omr-worker.torarnehave.workers.dev
                     │   (X-API-Token auth)
                     ├── /sessions, /sessions/:id   → KV: omr-sessions
                     └── /pdfs/:id                  → R2: omr-pdfs
```

Frontend talks directly to the worker for now. A Pages Functions wrapper with a service binding will be added when the app deploys to Cloudflare Pages.

## Key files

```
src/
├── main.jsx, App.jsx              # bootstrap + useReducer state owner
├── state/appReducer.js            # state shape + actions
├── components/                    # Header, UploadZone, PdfCard, CanvasPanel,
│                                  # SequenceRow, NoteCard, SolPicker,
│                                  # CloudLibrary, SaveToCloudButton, Toast
├── hooks/useApiToken.js           # localStorage-backed API token
├── lib/
│   ├── keySig.js, pitchMap.js     # KEY_SIGS, STAFF_POS, posToNote, yToPos
│   ├── imageBinary.js (planned)   # toBinary — pixel → 0/1 mask
│   ├── staffDetect.js (planned)   # detectStaffLines, groupIntoStaves
│   ├── noteDetect.js  (planned)   # detectNoteHeads
│   ├── pdfLoader.js               # pdfjs wrappers (worker via Vite ?url)
│   ├── session.js                 # readSessionFile, applySessionToImage
│   ├── canvasDraw.js              # minimal redrawCanvas
│   └── cloudApi.js                # fetch wrappers for omr-worker
└── index.css                      # 1:1 port of the reference HTML <style>
```

## What's not (yet) ported

The full OMR pipeline that **detects** note heads from a fresh PDF (no saved JSON) is still on the roadmap. Once that lands, dropping a new sheet music PDF will auto-find the staff lines and notes.

Also pending: overlay toggles, manual note placement, undo, local JSON download (independent of cloud), and the AI Maqam Education panel.

## License

Personal project — no license declared yet.
