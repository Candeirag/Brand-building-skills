import "server-only";

import { cache } from "react";
import { PHOTO_BUCKET } from "./photos";
import { createClient } from "./supabase/server";
import type { Tables } from "./supabase/database.types";

export type InspectionPhoto = Tables<"inspection_photos"> & { url: string | null };

const SIGNED_URL_TTL = 60 * 60 * 2; // 2 horas

/** Carrega inspeção, itens e fotos (com URLs assinadas) respeitando RLS. */
export const loadInspection = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();

  const [inspectionRes, itemsRes, photosRes] = await Promise.all([
    supabase.from("inspections").select("*").eq("id", id).maybeSingle(),
    supabase.from("inspection_items").select("*").eq("inspection_id", id).order("position"),
    supabase.from("inspection_photos").select("*").eq("inspection_id", id).order("created_at"),
  ]);

  if (!inspectionRes.data) return null;

  const photos = photosRes.data ?? [];
  const urls = new Map<string, string>();
  if (photos.length) {
    const { data } = await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrls(
        photos.map((p) => p.storage_path),
        SIGNED_URL_TTL,
      );
    for (const d of data ?? []) {
      if (d.path && d.signedUrl) urls.set(d.path, d.signedUrl);
    }
  }

  return {
    inspection: inspectionRes.data,
    items: itemsRes.data ?? [],
    photos: photos.map<InspectionPhoto>((p) => ({ ...p, url: urls.get(p.storage_path) ?? null })),
  };
});
