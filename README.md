# algo.viz

A visual learning platform for data structures and algorithms. Type a concept, such as *"Bubble Sort"* or *"Find middle of linked list"*. algo.viz then plays it as a step-by-step animation, synced with highlighted code and a plain-English caption for every step.

An LLM acts as the **teacher**. It picks the algorithm, chooses example data that teaches well, and writes the explanations. Deterministic TypeScript **simulators** are the engine. They produce every animation frame, so what you see is always what the algorithm actually does.

> **Status: work in progress.** Milestones 1–2 are done: the build, typecheck, lint and tests are green, lesson plans are schema-validated, and the backend is rate-limited. Milestones 3–5 of the [fix plan](docs/fix-plan/00-index.md) fix lesson bugs and add the Pyodide path. See the [audit](docs/audit/00-summary.md) for the full picture.

---

## What works today

| Area | Lessons | Status |
|---|---|---|
| Sorting | Bubble sort | ✅ working |
| | Insertion sort, Selection sort | ⚠️ works, with misleading compare highlights |
| Trees (binary) | BFS (level order) | ✅ working (layout breaks past depth 3) |
| | DFS pre-order, DFS in-order | ⚠️ works, but labelled as a BFS "queue" |
| Linked list | Find middle (slow/fast pointers) | ✅ working |
| | Reverse | ⚠️ works, but the `→ null` tail is drawn on the wrong side |
| | Detect cycle | ❌ always reports "no cycle" |
| Stack | Valid parentheses | ✅ working |
| | Evaluate postfix | ⚠️ the scan arrow points at characters instead of tokens |
| Theory questions | Text-only explanation | ✅ working (plain text) |
| Pasted Python code | Traced execution via Pyodide | ❌ not wired yet (planned in Milestone 4) |

Not yet built: graph algorithms, queue lessons, quick and merge sort, and the planned Phase 8 topics (Dijkstra, Prim, Kruskal, topological sort, BST, two pointers, sliding window, DP tables, hash tables, tries, backtracking). Per-feature detail is in [docs/audit/03-feature-status.md](docs/audit/03-feature-status.md).

---

## How it works

```
 ┌───────────┐  POST /api/teach   ┌──────────────┐  LessonPlan JSON
 │  App.tsx  │ ─────────────────► │ Express API  │ ──────────────────┐
 │ (concept) │                    │ + LLM teacher│                   │
 └───────────┘                    └──────────────┘                   ▼
       ▲                                              ┌──────────────────────────┐
       │  AnimationFrame (per step)                   │ Simulator (TS generator) │
       │                                              │  → SimEvent[]            │
 ┌─────┴───────────────┐   AnimationTimeline          └────────────┬─────────────┘
 │ renderer/v2 scenes  │ ◄──────────────────────────────────────── │
 │ SVG + CSS transitions│   Template mapper: SimEvent[] → frames   ▼
 └─────────────────────┘ ◄──────────────────────── src/templates/*
```

| Step | What happens | Where |
|---|---|---|
| 1 | User enters a concept; a regex heuristic guesses whether it's code | `src/App.tsx`, `src/router/classify.ts` |
| 2 | Backend asks the LLM for a **LessonPlan**: simulator id, visual template, example data, code and explanations | `backend/server.ts` (`/api/teach`), `backend/prompts/teacher.ts` |
| 3 | The chosen simulator runs on the example data and emits typed **SimEvents** | `src/simulator/registry.ts`, `src/simulator/*.ts`, `src/simulator/events.ts` |
| 4 | A template mapper converts the events into full-snapshot **AnimationFrames** | `src/templates/registry.ts`, `src/templates/{sorting,tree,linked-list,stack}.ts` |
| 5 | The player steps through frames on a timer, and the scene renders each one | `src/engine/useAnimationPlayer.ts`, `src/renderer/v2/SceneRenderer.tsx` |

The LLM sits behind a small provider interface (`backend/providers/types.ts`), with Anthropic and OpenAI implementations. API keys stay on the server; the browser only talks to the local backend.

Every lesson plan is validated by one shared zod schema (`src/lesson/schema.ts`), on the server before replying and in the browser before anything runs. Example data is size-capped, and the visual template is derived from the simulator rather than trusted from the LLM. An invalid plan gets one corrective retry, then a friendly error.

---

## Tech stack

- **Frontend:** React 19, TypeScript 5.9, Vite 8 (beta), pure SVG with CSS transitions. There is no animation library.
- **Backend:** Express 5 on Node, run directly from TypeScript with `tsx`.
- **LLM:** `@anthropic-ai/sdk` and `openai`, selected with the `AI_PROVIDER` env var.
- **Planned:** Pyodide (Python in WebAssembly) in a Web Worker, to trace pasted code. A draft is in `src/sandbox/`.

---

## Quick start

**Prerequisites:** Node `^20.19` or `>=22.12` (Vite 8's requirement; developed on Node 24), and an Anthropic or OpenAI API key.

```bash
npm ci
```

Copy `.env.example` to `.env` in the **repo root** (`.env` is git-ignored) and add your key:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `AI_PROVIDER` | no | `anthropic` | `anthropic` or `openai` |
| `ANTHROPIC_API_KEY` | if provider is `anthropic` | — | Anthropic API key |
| `ANTHROPIC_MODEL` | no | `claude-opus-5-5` | Model id |
| `OPENAI_API_KEY` | if provider is `openai` | — | OpenAI API key |
| `OPENAI_MODEL` | no | `gpt-4o` | Model id |
| `PORT` | no | `3001` | Backend port |
| `HOST` | no | `127.0.0.1` | Bind address (localhost only by default) |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Allowed frontend origin |
| `RATE_LIMIT_MAX` | no | `20` | `/api/teach` requests per IP per window |
| `RATE_LIMIT_WINDOW_MS` | no | `600000` | Rate-limit window (10 minutes) |

Run the backend and the frontend in two terminals:

```bash
npm run backend   # http://127.0.0.1:3001  (health check: /api/health)
npm run dev       # http://localhost:5173
```

The frontend calls `http://127.0.0.1:3001`, which is hardcoded in `src/api/teach.ts`. The backend finds `.env` relative to its own file, so it can be started from any directory.

---

## Scripts

| Command | What it does | Current state |
|---|---|---|
| `npm run dev` | Vite dev server | works |
| `npm run backend` | Express API via `tsx backend/server.ts` | works (needs `.env`) |
| `npm run build` | `tsc -b && vite build` | ✅ |
| `npm run typecheck` | `tsc -b` (app, Vite config and tests) | ✅ |
| `npm run typecheck:backend` | `tsc -p backend/tsconfig.json` | ✅ |
| `npm run lint` | ESLint | ✅ |
| `npm test` | Vitest (`src/**/*.test.ts`, `backend/**/*.test.ts`) | ✅ 134 tests |
| `npm run preview` | Serve the production build | works after `build` |

---

## Project structure

```
backend/
  server.ts              reads config, creates the provider, starts listening
  app.ts                 Express app: /api/health, /api/teach, rate limit, JSON errors
  teach.ts               prompt → LLM → validated LessonPlan (one corrective retry)
  prompts/teacher.ts     LLM "teacher" prompt → LessonPlan
  providers/             AIProvider interface + Anthropic / OpenAI implementations
src/
  App.tsx                the whole live UI: input, loading, lesson view, code panel
  api/teach.ts           client for /api/teach
  lesson/schema.ts       shared zod validation + size caps for lesson plans
  lesson/catalog.ts      simulator → data type + visual template
  router/types.ts        LessonPlan, VisualTemplate, SimulatorId and example-data types
  router/classify.ts     "is this code?" heuristic
  simulator/             deterministic algorithm generators → SimEvent
  templates/             SimEvent[] → AnimationFrame[] mappers, one per visual template
  engine/                playback reducer + useAnimationPlayer hook
  renderer/v2/           SVG scenes: Sorting, Tree, LinkedList, Stack (+ Bar, Node, Arrow, …)
  sandbox/               Pyodide tracer draft (not wired)
  lib/syntaxHighlighter.ts
  components/            ErrorBoundary (mounted by Root.tsx; reset remounts the app)
docs/
  audit/                 codebase audit (2026-10-18)
  fix-plan/              milestone-based session prompts to fix it
```

---

## Adding a new algorithm

1. **Events.** Reuse the event types in `src/simulator/events.ts`, or add new ones to the `SimEvent` union. Add, never rename.
2. **Simulator.** Write a generator `function* myAlgo(input): Generator<SimEvent>` in `src/simulator/`, and register it in `src/simulator/registry.ts` with a `name` and `dataType`.
3. **Mapper.** Handle the new events in the matching `src/templates/*.ts` mapper. A new visual template needs a new mapper plus a case in `src/templates/registry.ts`.
4. **Scene.** For a new template, add a scene in `src/renderer/v2/` and a case in `renderer/v2/SceneRenderer.tsx`.
5. **Teach the teacher.** Add the simulator id to `SimulatorId` (`src/router/types.ts`) and `SIMULATOR_CATALOG` (`src/lesson/catalog.ts`), extend the schema if it needs a new data type, and add it to the table in `backend/prompts/teacher.ts`.
6. **Test.** Add Vitest specs next to the code (`src/simulator/simulators.test.ts`, `src/templates/templates.test.ts`), and run `npm test`.

---

## Known limitations

- There is no authentication. The backend binds to localhost and is rate-limited, but don't expose it publicly.
- Canvases are a fixed 700 px wide, so large inputs overflow.
- Code highlighting assumes canonical code but displays LLM-written code, so highlighted lines can drift.
- The input box is single-line, so pasted multi-line code loses its newlines.

Every item is tracked, with file and line references, in [docs/audit/04-issues-and-risks.md](docs/audit/04-issues-and-risks.md).

## Roadmap

The fix plan has five milestones, each run as self-contained Claude Code session prompts. See [docs/fix-plan/00-index.md](docs/fix-plan/00-index.md).

1. ✅ **Stable foundation:** commit the baseline, remove legacy code, get the build green, adopt Vitest.
2. ✅ **Trustworthy pipeline:** zod-validated lesson plans, error boundaries, rate limiting, Anthropic as the default provider.
3. **Correct lessons:** fix the simulator and mapper bugs, ship canonical code with exact line maps, auto-fit the canvases.
4. **Second execution path:** Pyodide in a killable Web Worker, a trace template, pasted Python animated through the same renderer.
5. **Release check:** clean-clone verification and refreshed docs.

After that: Phase 8 topics (graphs, BST, DP tables, hash tables, tries, backtracking).
