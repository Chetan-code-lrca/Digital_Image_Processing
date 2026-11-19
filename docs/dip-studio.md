# DIP Studio — Preparation Workspace

DIP Studio is the interactive learning workspace for the five-module CSE2571C Digital Image Processing syllabus.

## Learning and practice

- Five syllabus modules with lesson notes, formulas and worked examples.
- **Dynamic practice sessions** generated from each lesson's summary, key points, takeaway, formulas and worked examples. Choose module, question style, difficulty and session length.
- Multiple-choice and written-recall questions. MCQs are automatically checked; written answers are compared by the learner against the lesson guide.
- Questions from weak and overdue topics are prioritised in later sessions. Recent question IDs are deprioritised to increase variation.
- A generated active-recall deck built from lesson concepts, formulas and examples.
- Per-card spaced repetition with Again / Hard / Good / Easy ratings and calculated next-review intervals.
- Topic-level attempts, accuracy, review state and session history are saved as learning progress.
- A weekly planner with custom study sessions.
- Side-by-side comparisons of common methods.
- A searchable code lab containing 23 practical snippets across all five modules.
- Guest mode with browser-local progress and JSON export/import.
- Google sign-in and user-specific cloud progress when Supabase is configured.

### How dynamic practice works

The question bank is assembled at session time from the course's actual lesson data. The same topic can produce different question styles: match a description to a topic, identify its key takeaway, recognise its formula or worked example, or write a free-response explanation. Answer options are shuffled each time. Question difficulty can be filtered, and the scheduler gives more attention to topics with lower accuracy or overdue reviews.

The review deck is also derived from lesson content rather than a hand-maintained fixed list. Concept, formula and example cards have separate review schedules. This content-based generator does not call an external LLM: written responses are self-assessed against the course guide rather than automatically graded by AI.

## Run locally

Requirements: Node.js 22 and npm.

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

Account mode uses Supabase Auth and Postgres. A learner's progress—including review schedules and practice history—is stored in a row keyed by the authenticated Supabase user ID. The `user_progress` table has row-level security policies that restrict select, insert and update access to the current user's row. The client uses the Supabase publishable key; the Supabase secret/service-role key must never be exposed in browser code.

Google OAuth does not become active until the Supabase project, environment variables, database migration and Google provider credentials have been configured. See [auth-setup.md](auth-setup.md).

## Vercel deployment

The Next.js application is in the repository root. Use the **Next.js** framework preset and root directory `./`. The connected GitHub project deploys from `main`.

For user accounts, create/connect a Supabase resource to the Vercel project, confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are available in the required environments, run the SQL migration, and configure Google OAuth. The detailed sequence is in [auth-setup.md](auth-setup.md).
