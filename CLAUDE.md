# OMR Engine — Claude working notes

## Read these first, every session
1. [`_project/STATUS.md`](_project/STATUS.md) — current state, progress log, locked decisions
2. [`_project/TODO.md`](_project/TODO.md) — remaining slice checklist
3. [`_project/PLAN.md`](_project/PLAN.md) — strategy, file structure
4. [`_project/TEST_PLAN.md`](_project/TEST_PLAN.md) — test regime + pass log

## The basis — non-negotiable
**`omr_engine.html`** (1626 lines, at project root) is the **ground truth**. Every
component, function, constant, and algorithm in the React port derives from that
file. The HTML stays untouched — open it side-by-side and diff behavior whenever
in doubt. Don't guess; if behavior is unclear, read the HTML.

## How to work
- **Incremental slices.** One slice = one TEST_PLAN step. Don't try to land
  multiple slices in one go.
- **Pure logic stays pure.** Algorithms (binarize, line detect, note detect,
  pitch map) live in `src/lib/` as plain JS modules — no React, no DOM.
- **Line-for-line port first.** Refactor only after parity is proven by a test.
- **Tests for pure modules** via Vitest (`npm test`). UI verified visually.
- **Update STATUS.md** as slices complete. Move items from TODO.md to STATUS.md's
  progress log.
- **CSS policy** (PLAN.md §6): `src/index.css` is a complete 1:1 port of the HTML
  `<style>` block. Use existing classes (`.sol-picker`, `.nc`, `.card`, `.btn`, etc.)
  — don't reinvent inline. If a class is missing, port it from the HTML, don't
  bandage with inline styles.

## Commands
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server — pinned to **port 5174** (5173 is held by an unrelated CleanRemotion server) |
| `npm test` | Vitest unit tests (currently 37/37 passing) |
| `npm run build` | Production build |

## Preview workflow
- Use Claude Code's **preview pane**, never an external browser.
- Use `preview_start` to launch, then `preview_screenshot` / `preview_eval` to verify.
- **Do NOT call `preview_stop` without warning** — it disconnects the user's preview
  pane and requires manual reattach.

## Anti-goals
- Don't refactor algorithms while porting. Parity first.
- Don't add features the HTML doesn't have.
- Don't introduce extra dependencies beyond `react`, `react-dom`, `pdfjs-dist`,
  `vite`, `@vitejs/plugin-react`, `vitest`.
- Don't claim a slice is done without recording a test pass in `TEST_PLAN.md`.
- Don't touch port 5173 (other project).

## Known carry-over bugs (HTML, to fix in React port)
- `applySessionToImage` builds `omrData` without `bin` → debug overlay would crash.
- "Use this page" flow after JSON+PDF load — user-reported, needs reproduction.

## AI model upgrade
HTML uses `claude-sonnet-4-20250514` → React port uses `claude-sonnet-4-6`
(current Sonnet as of 2026-05).

## Memory location (auto-loaded across sessions)
`/Users/torarnehave/.claude/projects/-Volumes-T7-omr-engine/memory/`
