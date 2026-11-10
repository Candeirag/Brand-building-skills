"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { ok?: boolean; error?: string };

const newPassword = z
  .string()
  .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
  .max(72, "A nova senha deve ter no máximo 72 caracteres.")
  .regex(/[a-z]/, "A nova senha deve conter letra minúscula.")
  .regex(/[A-Z]/, "A nova senha deve conter letra maiúscula.")
  .regex(/\d/, "A nova senha deve conter número.");

/** Troca a própria senha, conferindo a senha atual no servidor. */
export async function changeOwnPassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const profile = await requireStaff();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!current) return { error: "Informe a senha atual." };
  const parsed = newPassword.safeParse(next);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  if (next !== confirm) return { error: "A confirmação não é igual à nova senha." };
  if (next === current) return { error: "A nova senha precisa ser diferente da atual." };
  if (!profile.email) return { error: "Sua conta não tem e-mail cadastrado. Procure o administrador." };

  // Confere a senha atual num cliente separado, sem tocar na sessão do navegador.
  const verifier = createSupabaseClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: wrong } = await verifier.auth.signInWithPassword({ email: profile.email, password: current });
  if (wrong) {
    return { error: wrong.status === 429 ? "Muitas tentativas. Aguarde alguns minutos." : "A senha atual está incorreta." };
  }
  await verifier.auth.signOut({ scope: "local" });

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    const same = /different|same/i.test(error.message);
    return { error: same ? "A nova senha precisa ser diferente da atual." : "Não foi possível alterar a senha. Tente de novo." };
  }

  // Quem estava com senha provisória segue direto para o sistema.
  if (profile.must_change_password) redirect("/?senha=alterada");
  return { ok: true };
}
