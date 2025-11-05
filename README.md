# Teacher Gradebook

Offline-first gradebook for managing 8th and 9th grade cohorts. Import rosters and timetables straight from PDF files, enter marks with full keyboard support, log PPP lessons, and export CSV/PDF record books locally. All data stays in the browser via IndexedDB until you decide to export it.

## Key Features

- **Group management** – create classes manually or populate them from roster PDFs/CSVs. Duplicate numbers merge automatically.
- **Grades grid** – sticky headers, horizontal scroll on mobile, arrow-key navigation, undo support (browser undo), and instant persistence.
- **Lesson planner** – PPP template with time range, observations, and quick slot prefills straight from the timetable.
- **Timetable view** – weekly grid sourced from timetable PDFs, with one-click lesson creation for any slot.
- **Record book** – filter by date range and export to printable PDF or CSV alongside mark exports.
- **Local storage** – Dexie.js on top of IndexedDB keeps the app offline-capable without a backend.
- **Import/export** – pdf.js (roster/timetable parsing), PapaParse (CSV), html2pdf (PDF generation), File System Access API fallback to classic downloads.
- **Responsive shell** – Tailwind UI with mobile drawer, toasts, and offline indicator.

## Tech Stack

- Vite + React + TypeScript
- TailwindCSS + Headless UI + Heroicons
- Zustand state management backed by Dexie
- pdf.js, PapaParse, html2pdf.js, date-fns
- Vitest for unit tests

## Getting Started

```bash
npm install
npm run dev
```

Navigate to `http://localhost:5173`.

### Tests

```bash
npm run test
```

### Production Build

```bash
npm run build
npm run preview
```

## File Structure Highlights

- `src/components` – UI components (grade grid, lesson planner, timetable, exporters, etc.)
- `src/pages` – top-level routes (Dashboard, Import, Groups, Group detail tabs)
- `src/lib` – shared helpers (Dexie schema, pdf parsing, exports, time utils, toast wrapper)
- `src/store.ts` – Zustand store combining all domain slices
- `public/.nojekyll` – ensures GitHub Pages serves assets without Jekyll interference
- `.github/workflows/deploy.yml` – GitHub Actions workflow to build and deploy to Pages

## Import & Export Workflow

1. **Select a target group** on the Import page (or create one first).
2. Drop/choose a roster PDF – preview rows, confirm, and the students merge by seat number.
3. Drop/choose a timetable PDF – preview slots by day, confirm, and the schedule is saved + linked.
4. CSV fallback accepts columns `number,name,nationalId`.
5. Export CSV/PDF for grades from the Grades tab; export record book PDFs from the Record Book tab.

## Deployment (GitHub Pages)

1. Push to `main`/`master` (or trigger the workflow manually).
2. The `deploy` workflow builds the site and publishes the contents of `dist/` via GitHub Pages.
3. The Vite config uses `base: './'` so the build works for both root and project pages.

If you deploy elsewhere, serve the static `dist/` folder with any static host.

## Accessibility & Offline Notes

- All interactive elements follow accessible labeling; tables include scoped headers.
- Toasts and network banner provide feedback for imports/exports and offline status.
- Key interactions (marks grid, lesson form) are keyboard-first.
- IndexedDB persistence keeps everything available offline; re-open the tab without losing data.
