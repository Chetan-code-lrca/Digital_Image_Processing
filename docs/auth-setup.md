# DIP Studio — Google accounts and cross-device progress

DIP Studio supports guest study mode and an account-backed mode. Guest progress remains in the current browser. Once Supabase is connected and Google OAuth is enabled, each signed-in learner gets a separate database row and can continue their own preparation on another device.

## What account mode uses

- **Google OAuth** through Supabase Auth.
- **Supabase Postgres** for each learner's saved topics, weekly planner, study goal and session list.
- **Row-level security (RLS)** so a signed-in learner can only read or change the row whose `user_id` matches their authenticated ID.
- Cookie-backed Supabase sessions via `@supabase/ssr` and the Next.js 16 `proxy.ts` session refresh handler.

Vercel's own SSO / Deployment Protection is not the right public-user login system. It is designed to restrict access to deployments for members of a Vercel team. DIP Studio uses Google identities instead.

## 1. Provision Supabase from Vercel

The Supabase Marketplace integration is installed for the Vercel team, but a database resource still needs to be provisioned and connected to the `dip-studio` project.

1. Open the [DIP Studio project in Vercel](https://vercel.com/inagantichetan0-9946s-projects/dip-studio).
2. Open **Storage** (or **Integrations → Supabase**) and choose **Create Database**.
3. Select **Supabase**, authorize the Supabase account when prompted, and create a project in a region close to the app's users (for example, Mumbai / `bom1` where offered).
4. Make sure the new Supabase resource is connected to the `dip-studio` Vercel project for **Production**, **Preview** and **Development**.
5. Confirm these browser-safe environment variables exist in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The Marketplace integration may add these variables automatically. Do not put a Supabase secret/service-role key in a `NEXT_PUBLIC_...` variable or in browser code.

## 2. Create the per-user progress table

Open the Supabase project → **SQL Editor** and run the complete migration:

`supabase/migrations/20261118_user_progress.sql`

It creates `public.user_progress`, enables row-level security and adds policies that allow authenticated users to read, insert and update only their own row. Do not disable RLS on this table.

## 3. Enable Google OAuth

1. In Google Cloud Console, create an OAuth client ID with application type **Web application**.
2. Add the production origin `https://dip-studio.vercel.app` to **Authorized JavaScript origins**. Add `http://localhost:3000` for local development.
3. In Supabase Dashboard → **Authentication → Sign In / Providers → Google**, enable Google and paste the Google OAuth client ID and client secret.
4. Copy the Supabase callback URL shown on that Google provider settings screen. It has the form:

   `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

5. Add that exact callback URL to the Google OAuth client's **Authorized redirect URIs**.
6. In Supabase Dashboard → **Authentication → URL Configuration**, set the Site URL to `https://dip-studio.vercel.app` and add these allowed redirect URLs:
   - `https://dip-studio.vercel.app`
   - `http://localhost:3000`

Use the actual public Vercel domain configured on the project. Add any Vercel Preview URL explicitly when you need to test OAuth on previews.

## 4. Deploy and verify

1. Redeploy the Vercel project after the environment variables are present.
2. Open `https://dip-studio.vercel.app` and choose the top-right account menu → **Continue with Google**.
3. Confirm the learner's email appears in the account menu.
4. Mark a topic complete or add a planner session. The account menu should show **Progress synced to your account**.
5. Sign out and sign in as a second Google account. The second account should see its own empty progress, not the first learner's data.
6. Sign back in as the first account (or use another browser) and verify the original progress is restored.

## 5. Local development

Copy `.env.example` to `.env.local` and fill it with the Supabase URL and publishable key from Project Settings → API. Then run:

```bash
npm install
npm run dev
```

Do not commit `.env.local`, Google client secrets, Supabase secret keys, or service-role keys.

## Troubleshooting

- **Google sign-in says it is not configured:** the Vercel project is missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **OAuth redirect error:** check the Google authorized redirect URI and Supabase allowed redirect URLs. They must match the deployed host exactly.
- **Signed in, but cloud progress needs attention:** confirm the SQL migration ran successfully, RLS is enabled, and the Supabase resource is connected to the right Vercel project/environment.
- **No cross-device sync:** confirm the deployment is using the same Supabase project in both environments and that the account menu reports synced status.

Guest mode and the local JSON backup remain available while the cloud account setup is incomplete.
