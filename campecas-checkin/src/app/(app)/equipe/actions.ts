"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FormState = { ok?: boolean; error?: string; message?: string };

const MISSING_KEY =
  "A chave de serviço do Supabase não está configurada neste servidor (SUPABASE_SERVICE_ROLE_KEY). " +
  "Cadastre o funcionário em Supabase → Authentication → Users e ative-o aqui, ou configure a chave na Vercel.";

function adminClientOrNull() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
}

const password = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72)
  .regex(/[a-z]/, "A senha deve conter letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter letra maiúscula.")
  .regex(/\d/, "A senha deve conter número.");

const memberSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo.").max(120),
  email: z.email("E-mail inválido.").max(254),
  role: z.enum(["admin", "inspector", "mechanic"]),
  password,
});

export async function createMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = memberSchema.safeParse({
    full_name: formData.get("full_name"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = adminClientOrNull();
  if (!admin) return { error: MISSING_KEY };
  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.full_name },
    app_metadata: { role: parsed.data.role },
  });
  if (error) {
    const exists = /already|registered|exists/i.test(error.message);
    return { error: exists ? "Já existe um usuário com este e-mail." : "Não foi possível criar o usuário." };
  }

  revalidatePath("/equipe");
  return { ok: true, message: `${parsed.data.full_name} foi cadastrado(a). Informe a senha provisória pessoalmente.` };
}

const idSchema = z.uuid();

export async function updateMember(
  userId: string,
  changes: { role?: "admin" | "inspector" | "mechanic"; active?: boolean },
): Promise<FormState> {
  const me = await requireAdmin();
  if (!idSchema.safeParse(userId).success) return { error: "Usuário inválido." };
  if (userId === me.id && (changes.active === false || (changes.role && changes.role !== "admin"))) {
    return { error: "Você não pode remover o seu próprio acesso de administrador." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(changes).eq("id", userId);
  if (error) return { error: friendlyError(error) };

  if (changes.active !== undefined) {
    // Bloqueia/desbloqueia o login no Supabase Auth (sem a chave, o RLS já bloqueia o acesso aos dados).
    const admin = adminClientOrNull();
    if (admin) await admin.auth.admin.updateUserById(userId, { ban_duration: changes.active ? "none" : "876000h" });
  }

  revalidatePath("/equipe");
  return { ok: true };
}

export async function resetMemberPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const parsed = password.safeParse(formData.get("password"));
  if (!idSchema.safeParse(userId).success) return { error: "Usuário inválido." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const admin = adminClientOrNull();
  if (!admin) return { error: MISSING_KEY };
  const { error } = await admin.auth.admin.updateUserById(userId, { password: parsed.data });
  if (error) return { error: "Não foi possível redefinir a senha." };
  return { ok: true, message: "Senha redefinida. Informe a nova senha ao funcionário." };
}

export async function anonymizeCustomer(customerId: string): Promise<FormState> {
  await requireAdmin();
  if (!idSchema.safeParse(customerId).success) return { error: "Cliente inválido." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("anonymize_customer", { p_customer_id: customerId });
  if (error) return { error: friendlyError(error) };
  revalidatePath("/equipe");
  return { ok: true, message: "Dados pessoais anonimizados." };
}
