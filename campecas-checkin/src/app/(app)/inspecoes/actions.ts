"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { PHOTO_BUCKET } from "@/lib/photos";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

// Campos que a tela pode enviar ao criar o rascunho (o resto é controlado pelo banco).
const DRAFT_FIELDS = [
  "plate", "brand", "model", "year", "color", "mileage", "fuel_level",
  "owner_name", "owner_document", "owner_phone", "owner_whatsapp", "customer_id",
  "inspector_name", "mechanic_name", "mechanic_id", "notes", "service_request",
] as const;

export type DraftResult = { ok: true; id: string; started_at: string } | { ok: false; error: string };

/**
 * Cria o rascunho no banco. Chamado pelo editor só quando a pessoa preenche o
 * primeiro campo (ou tira a primeira foto), já com esses dados.
 */
export async function createDraftInspection(patch: TablesUpdate<"inspections">): Promise<DraftResult> {
  const profile = await requireStaff();
  const supabase = await createClient();

  const row: TablesInsert<"inspections"> = { inspector_id: profile.id, inspector_name: profile.full_name };
  for (const key of DRAFT_FIELDS) {
    if (key in patch) Object.assign(row, { [key]: patch[key] ?? null });
  }
  if (!row.inspector_name) row.inspector_name = profile.full_name;

  const { data, error } = await supabase.from("inspections").insert(row).select("id, started_at").single();
  if (error || !data) return { ok: false, error: friendlyError(error, "Não foi possível iniciar a inspeção.") };

  revalidatePath("/");
  return { ok: true, id: data.id, started_at: data.started_at };
}

export type ActionResult = { ok: true; number?: string } | { ok: false; error: string };

/** Finaliza a inspeção (validação, número único e data/hora no banco). */
export async function finalizeInspection(inspectionId: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_inspection", { p_inspection_id: inspectionId });
  if (error) return { ok: false, error: friendlyError(error, "Não foi possível finalizar a inspeção.") };

  revalidatePath("/");
  revalidatePath("/historico");
  return { ok: true, number: data?.[0]?.number };
}

/** Exclui um rascunho (somente o autor ou administrador: também garantido por RLS). */
export async function deleteDraft(inspectionId: string): Promise<ActionResult> {
  const profile = await requireStaff();
  const supabase = await createClient();

  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, status, inspector_id")
    .eq("id", inspectionId)
    .maybeSingle();

  if (!inspection || inspection.status !== "draft") {
    return { ok: false, error: "Rascunho não encontrado ou inspeção já finalizada." };
  }
  if (inspection.inspector_id !== profile.id && profile.role !== "admin") {
    return { ok: false, error: "Somente quem iniciou o rascunho ou um administrador pode excluí-lo." };
  }

  // Os arquivos só podem ser removidos enquanto a inspeção é rascunho.
  const { data: photos } = await supabase
    .from("inspection_photos")
    .select("storage_path")
    .eq("inspection_id", inspectionId);
  if (photos?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.storage_path));
  }

  const { error } = await supabase.from("inspections").delete().eq("id", inspectionId).eq("status", "draft");
  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/");
  revalidatePath("/inspecoes/em-andamento");
  return { ok: true };
}

export type LinkResult = { ok: true; token: string; expiresAt: string } | { ok: false; error: string };

/** Gera (ou reaproveita) o link público do laudo de uma inspeção finalizada. */
export async function getReportLink(inspectionId: string): Promise<LinkResult> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_report_link", { p_inspection_id: inspectionId });
  const row = data?.[0];
  if (error || !row) return { ok: false, error: friendlyError(error, "Não foi possível gerar o link do laudo.") };
  return { ok: true, token: row.token, expiresAt: row.expires_at };
}

/** Registra na auditoria e na inspeção que o laudo foi enviado pelo WhatsApp. */
export async function registerReportSent(inspectionId: string): Promise<{ ok: true; sentAt: string } | { ok: false; error: string }> {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_report_delivery", { p_inspection_id: inspectionId });
  if (error || !data) return { ok: false, error: friendlyError(error, "Não foi possível registrar o envio.") };
  revalidatePath(`/inspecoes/${inspectionId}`);
  revalidatePath("/historico");
  return { ok: true, sentAt: data };
}

/** Revoga o link público do laudo (ele deixa de abrir na hora). */
export async function revokeReportLink(inspectionId: string): Promise<ActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_report_link", { p_inspection_id: inspectionId });
  if (error) return { ok: false, error: friendlyError(error, "Não foi possível revogar o link.") };
  revalidatePath(`/inspecoes/${inspectionId}`);
  return { ok: true };
}
