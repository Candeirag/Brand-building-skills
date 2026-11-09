"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { PHOTO_BUCKET } from "@/lib/photos";
import { isValidPlate, normalizePlate } from "@/lib/validation";

/** Cria um rascunho de inspeção e abre a tela de preenchimento. */
export async function createInspection(formData?: FormData) {
  const profile = await requireStaff();
  const supabase = await createClient();

  const plateInput = normalizePlate(String(formData?.get("plate") ?? ""));
  const plate = isValidPlate(plateInput) ? plateInput : null;

  const { data, error } = await supabase
    .from("inspections")
    .insert({ inspector_id: profile.id, inspector_name: profile.full_name, plate })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(friendlyError(error, "Não foi possível iniciar a inspeção."));
  }

  revalidatePath("/");
  redirect(`/inspecoes/${data.id}/editar${plate ? "?buscar=1" : ""}`);
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

/** Exclui um rascunho (somente o autor ou administrador — também garantido por RLS). */
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
