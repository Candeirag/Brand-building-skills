"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/*
 * Gestão da equipe pelas funções do banco (admin_create_member, admin_set_member_password).
 * Elas verificam is_admin() por dentro, então não há chave de serviço no servidor.
 * Desativar um perfil bloqueia o login no Auth por gatilho (profiles_sync_ban).
 */

export type FormState = { ok?: boolean; error?: string; message?: string };

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

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_member", {
    p_email: parsed.data.email,
    p_password: parsed.data.password,
    p_full_name: parsed.data.full_name,
    p_role: parsed.data.role,
  });
  if (error) return { error: friendlyError(error, "Não foi possível cadastrar o funcionário.") };

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

  revalidatePath("/equipe");
  return { ok: true };
}

export async function resetMemberPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  const parsed = password.safeParse(formData.get("password"));
  if (!idSchema.safeParse(userId).success) return { error: "Usuário inválido." };
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_member_password", { p_user_id: userId, p_password: parsed.data });
  if (error) return { error: friendlyError(error, "Não foi possível redefinir a senha.") };
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
