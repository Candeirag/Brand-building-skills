import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "@/lib/env";

/**
 * Cliente com a service role. IGNORA as políticas RLS — usar somente em
 * Server Actions que já verificaram que o usuário é administrador.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.");
  }
  return createClient<Database>(SUPABASE_URL(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
