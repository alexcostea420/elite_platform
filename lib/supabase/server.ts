import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseConfig, getSupabaseServiceRoleConfig } from "@/lib/supabase/config";

export function createServerSupabaseClient() {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              domain: ".armatadetraderi.com",
              maxAge: 60 * 60 * 24 * 7, // 7 days
            });
          });
        } catch {
          // Cookie writes are ignored in Server Components. Middleware and
          // Server Actions handle refresh/write paths.
        }
      },
    },
  });
}

export function createServiceRoleSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
