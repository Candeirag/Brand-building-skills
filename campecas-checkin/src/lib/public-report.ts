import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { ChecklistStatus, FuelLevel } from "./checklist";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import { PHOTO_BUCKET, type PhotoCategory } from "./photos";
import type { Database } from "./supabase/database.types";

export type PublicReport = {
  number: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  fuel_level: FuelLevel | null;
  started_at: string;
  finalized_at: string;
  owner_name: string | null;
  owner_document_masked: string | null;
  service_request: string | null;
  notes: string | null;
  inspector_name: string | null;
  mechanic_name: string | null;
  expires_at: string;
  items: {
    item_key: string;
    item_label: string;
    group_name: string;
    position: number;
    status: ChecklistStatus | null;
    notes: string | null;
  }[];
  photos: {
    id: string;
    category: PhotoCategory;
    item_key: string | null;
    storage_path: string;
    caption: string | null;
    mime_type: string;
    url: string | null;
  }[];
};

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,64}$/;
const SIGNED_URL_TTL = 60 * 60; // 1 hora

/** Cliente sem sessão: o laudo público nunca usa o login de um funcionário. */
function publicClient() {
  return createSupabaseClient<Database>(SUPABASE_URL(), SUPABASE_ANON_KEY(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Lê o laudo público pelo token. A validação (token ativo, não revogado, dentro
 * dos 30 dias, inspeção finalizada) acontece no banco, em public_report(), que só
 * responde a quem tem a chave do servidor. As tabelas seguem fechadas para anônimos.
 */
export async function loadPublicReport(token: string, withPhotoUrls = true): Promise<PublicReport | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const serverKey = process.env.REPORT_SERVER_KEY;
  if (!serverKey) throw new Error("REPORT_SERVER_KEY não configurada no servidor.");

  const supabase = publicClient();
  const { data, error } = await supabase.rpc("public_report", { p_token: token, p_server_key: serverKey });
  if (error) throw new Error(`Falha ao ler o laudo: ${error.message}`);
  if (!data) return null;

  const report = data as unknown as Omit<PublicReport, "photos"> & { photos: Omit<PublicReport["photos"][number], "url">[] };
  const urls = new Map<string, string>();
  if (withPhotoUrls && report.photos.length) {
    const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(
      report.photos.map((p) => p.storage_path),
      SIGNED_URL_TTL,
    );
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return { ...report, photos: report.photos.map((p) => ({ ...p, url: urls.get(p.storage_path) ?? null })) };
}

/** Baixa as fotos JPEG do laudo público para o PDF (mesmas regras de acesso). */
export async function downloadPublicPhotos(report: PublicReport) {
  const supabase = publicClient();
  return Promise.all(
    report.photos.map(async (p) => {
      if (p.mime_type !== "image/jpeg") return { id: p.id, category: p.category, item_key: p.item_key, data: null };
      const { data } = await supabase.storage.from(PHOTO_BUCKET).download(p.storage_path);
      return { id: p.id, category: p.category, item_key: p.item_key, data: data ? Buffer.from(await data.arrayBuffer()) : null };
    }),
  );
}
