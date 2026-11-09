"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Cliente Supabase do navegador (sessão do funcionário, sujeito às políticas RLS). */
export function createClient() {
  browserClient ??= createBrowserClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY());
  return browserClient;
}
