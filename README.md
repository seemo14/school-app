# Skylark Gradebook

Skylark is an offline-first gradebook built for a teacher managing nine middle/high school groups. Phase 1 is a static React + Vite web app that stores everything locally using IndexedDB (Dexie) and the File System Access API. No data leaves the device unless the teacher exports it explicitly.

## Features

- **Imports**: Parse roster and weekly timetable PDFs using pdf.js heuristics, with CSV drag-and-drop as a fallback. Preview and edit parsed data before confirming.
- **Groups**: Create, edit, and delete 8th/9th grade groups. View roster, grades, lessons, timetable, and record-book tabs per group.
- **Roster management**: Inline editing, add/remove students, and smart merge on import (number-based matching).
- **Grades grid**: Touch-friendly, keyboard-navigable marks table covering Quiz1/Quiz2/Homework/Copybook/Discipline/Participation/Final. Auto-saves to IndexedDB with Ctrl+Z undo, CSV/PDF exports.
- **Lessons**: PPP (Presentation–Practice–Production) planner with template defaults, lesson log list, timetable slot shortcuts, and record-book PDF exports.
- **Timetable**: Weekly grid view with “create lesson from slot” shortcuts. Timetable imports automatically attach to matching group codes.
- **Exports**: Grades to CSV/PDF and lesson record books to PDF (select all/this-month/custom range).
- **UI/UX**: TailwindCSS, Headless UI tabs/pickers, mobile-first layout, sticky headers, toasts, dark-ready color palette.
- **Deploy**: GitHub Pages workflow (`.github/workflows/deploy.yml`) publishes the static site with a `.nojekyll` marker for clean URLs.

## Tech Stack

- Vite + React 19 + TypeScript
- TailwindCSS with `@tailwindcss/forms`, Headless UI, Heroicons
- Zustand + Dexie (IndexedDB) for state and persistence
- pdf.js (`pdfjs-dist`) for PDF parsing, PapaParse for CSV, html2pdf.js for PDF exports
- zod for runtime validation, nanoid for IDs, date-fns for date helpers, sonner for toasts

## Local Development

```bash
npm install
npm run dev
```

The dev server runs on <http://localhost:5173>. Dexie uses the browser’s IndexedDB; clear storage via devtools to reset.

## Building & Deploying

```bash
npm run build
npm run preview
```

The output in `dist/` is ready for static hosting. GitHub Pages deployment is automated for the `main` branch via Actions—see `.github/workflows/deploy.yml`.

## Project Structure

```
src/
  components/        UI building blocks (tables, forms, dialogs)
  features/          Zustand selectors/actions per domain
  lib/               Dexie schema, zod models, PDF/CSV helpers
  pages/             Route components (dashboard, import, groups, detail)
  store.ts           Root Zustand store (Dexie-backed)
```

## Phase 2 Ready

The app is designed so that the Dexie persistence layer can be swapped for Firebase/Supabase later without rewriting UI logic—data contracts are defined in `lib/schemas.ts` and consumed through store actions/selectors.
