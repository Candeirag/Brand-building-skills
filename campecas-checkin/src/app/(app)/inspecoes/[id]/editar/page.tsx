import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InspectionEditor } from "@/components/inspection/inspection-editor";
import { requireStaff } from "@/lib/auth";
import { loadInspection } from "@/lib/inspection-data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inspeção em andamento" };

export default async function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireStaff();
  const data = await loadInspection(id);
  if (!data) notFound();
  if (data.inspection.status === "finalized") redirect(`/inspecoes/${id}`);

  const supabase = await createClient();
  const { data: mechanics } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("active", true)
    .eq("role", "mechanic")
    .order("full_name");

  return (
    <InspectionEditor
      key={data.inspection.id}
      inspection={data.inspection}
      initialItems={data.items}
      initialPhotos={data.photos.map((p) => ({
        id: p.id,
        category: p.category,
        item_key: p.item_key,
        storage_path: p.storage_path,
        caption: p.caption,
        url: p.url,
        created_at: p.created_at,
      }))}
      mechanics={mechanics ?? []}
      canDelete={data.inspection.inspector_id === profile.id || profile.role === "admin"}
    />
  );
}
