"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email("Informe um e-mail válido.").max(254),
  password: z.string().min(1, "Informe a senha.").max(200),
  next: z.string().optional(),
});

export type LoginState = { error?: string; email?: string };

/** Aceita apenas caminhos internos para evitar redirecionamento aberto. */
function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message, email: String(formData.get("email") ?? "") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    const tooMany = error?.status === 429;
    return {
      error: tooMany
        ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        : "E-mail ou senha incorretos.",
      email: parsed.data.email,
    };
  }

  const { data: profile } = await supabase.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await supabase.auth.signOut();
    return { error: "Seu acesso está desativado. Procure o administrador da oficina.", email: parsed.data.email };
  }

  redirect(safeNext(parsed.data.next));
}
