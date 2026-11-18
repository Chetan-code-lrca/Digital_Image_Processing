# DIP Studio — Preparation Workspace

DIP Studio is the interactive learning workspace included with this repository.

## Features

- Five syllabus modules aligned to the CSE2571C Digital Image Processing course.
- Topic-based study notes with key formulas, worked examples, implementation snippets and completion tracking.
- A 20-question multiple-choice practice bank with answer explanations.
- 21 active-recall flashcards.
- A seven-day planner with module-aware sessions and custom tasks.
- Side-by-side comparisons for commonly confused methods.
- Python/OpenCV code examples linked to module topics.
- Browser-local progress storage with JSON export and import.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For a production build:

```bash
npm run typecheck
npm run build
npm start
```

## Progress storage and privacy

The first release stores completion state and planner tasks in the current browser's localStorage. Notes, question banks, flashcards and code examples are bundled with the app.

There is no account system or server-side user database in this release. Progress does not automatically sync between devices or browsers. Use **Export progress backup** to download a JSON file and **Import progress backup** on another browser.

Do not store sensitive personal information in the planner.

## Vercel deployment

The project is a Next.js application at the repository root. Vercel should detect the Next.js framework automatically. The Git-linked project deploys new commits on the connected production branch and creates preview deployments for other branches.

Set `NEXT_PUBLIC_SITE_URL` to the final public site URL after assigning a stable domain so the generated sitemap and robots metadata use the correct host.
