import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Tables } from "./supabase/database.types";

export type Profile = Tables<"profiles">;

/** Perfil do funcionário autenticado (memoizado por requisição). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
});

/**
 * Exige funcionário ativo; redireciona para o login caso contrário.
 * Quem está com senha provisória vai para a troca de senha antes de usar o sistema.
 */
export async function requireStaff(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.active) redirect("/login?erro=inativo");
  if (profile.must_change_password) {
    const path = (await headers()).get("x-pathname") ?? "";
    if (path !== "/conta") redirect("/conta?senha=provisoria");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireStaff();
  if (profile.role !== "admin") redirect("/");
  return profile;
}

export const ROLE_LABELS: Record<Profile["role"], string> = {
  admin: "Administrador",
  inspector: "Recepção / Vistoria",
  mechanic: "Mecânico",
};
