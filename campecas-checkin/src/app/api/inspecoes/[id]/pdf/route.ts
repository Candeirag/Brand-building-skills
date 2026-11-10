import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import type { ReportPhoto } from "@/lib/pdf/inspection-report";
import { pdfResponse, renderReportPdf } from "@/lib/pdf/render";
import { maskDocument } from "@/lib/format";
import { PHOTO_BUCKET } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PHOTOS = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  const profile = await getCurrentProfile();
  if (!profile?.active) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const supabase = await createClient();
  const [inspectionRes, itemsRes, photosRes] = await Promise.all([
    supabase.from("inspections").select("*").eq("id", id).maybeSingle(),
    supabase.from("inspection_items").select("*").eq("inspection_id", id).order("position"),
    supabase
      .from("inspection_photos")
      .select("id, category, item_key, storage_path, mime_type")
      .eq("inspection_id", id)
      .order("created_at")
      .limit(MAX_PHOTOS),
  ]);

  const inspection = inspectionRes.data;
  if (!inspection) {
    return NextResponse.json({ error: "Inspeção não encontrada" }, { status: 404 });
  }

  // Baixa as fotos com a sessão do usuário (políticas de storage aplicadas).
  const photos: ReportPhoto[] = await Promise.all(
    (photosRes.data ?? []).map(async (p) => {
      if (p.mime_type !== "image/jpeg") return { id: p.id, category: p.category, item_key: p.item_key, data: null };
      const { data } = await supabase.storage.from(PHOTO_BUCKET).download(p.storage_path);
      return {
        id: p.id,
        category: p.category,
        item_key: p.item_key,
        data: data ? Buffer.from(await data.arrayBuffer()) : null,
      };
    }),
  );

  const i = inspection;
  const pdf = await renderReportPdf({
    inspection: i,
    items: itemsRes.data ?? [],
    photos,
    maskedDocument: i.owner_document ? maskDocument(i.owner_document) : null,
    contactPhone: i.owner_whatsapp ?? i.owner_phone,
  });
  const filename = `${i.number ?? `rascunho-${i.plate ?? id.slice(0, 8)}`}.pdf`;
  return pdfResponse(pdf, filename);
}
