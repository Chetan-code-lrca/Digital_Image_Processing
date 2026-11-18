# DIP Studio — Preparation Workspace

DIP Studio is the interactive learning workspace for the five-module CSE2571C Digital Image Processing syllabus.

## Features

- Five syllabus modules with topic notes, formulas and worked examples.
- 20 multiple-choice questions with explanations.
- 21 active-recall flashcards.
- A weekly planner with custom study sessions.
- Side-by-side comparisons of common methods.
- A searchable code lab containing 23 practical snippets across all five modules.
- Guest mode with browser-local progress and JSON export/import.
- Google sign-in and user-specific cloud progress when Supabase is configured.

## Run locally

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The app works in guest mode without Supabase variables. To enable Google login and cross-device sync, follow [Google account and cloud progress setup](auth-setup.md).

For a production build:

```bash
npm run typecheck
npm run build
npm start
```

## Progress storage and privacy

Guest mode stores progress in the current browser's localStorage. The JSON backup option lets a guest export and import that local progress.

Account mode uses Supabase Auth and Postgres. A learner's progress is stored in a row keyed by the authenticated Supabase user ID. The `user_progress` table has row-level security policies that restrict select, insert and update access to the current user's row. The client uses the Supabase publishable key; the Supabase secret/service-role key must never be exposed in browser code.

Google OAuth does not become active until the Supabase project, environment variables, database migration and Google provider credentials have been configured. See [auth-setup.md](auth-setup.md).

## Vercel deployment

The Next.js application is in the repository root. Use the **Next.js** framework preset and root directory `./`. The connected GitHub project deploys from `main`.

For user accounts, create/connect a Supabase resource to the Vercel project, confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are available in the required environments, run the SQL migration, and configure Google OAuth. The detailed sequence is in [auth-setup.md](auth-setup.md).
