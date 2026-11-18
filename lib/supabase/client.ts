import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a cookie-backed Supabase browser client.
 * Returns null until the project URL and publishable key are configured.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(url, publishableKey);
  }

  return browserClient;
}
