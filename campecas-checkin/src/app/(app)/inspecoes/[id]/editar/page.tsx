import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { InspectionEditor } from "@/components/inspection/inspection-editor";
import { requireStaff } from "@/lib/auth";
import { loadEditorContext, loadInspection } from "@/lib/inspection-data";

export const metadata: Metadata = { title: "Inspeção em andamento" };

export default async function EditInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireStaff();
  const [data, context] = await Promise.all([loadInspection(id), loadEditorContext()]);
  if (!data) notFound();
  if (data.inspection.status === "finalized") redirect(`/inspecoes/${id}`);

  // Só os itens ativos no catálogo (o antigo item "Combustível" some dos rascunhos abertos).
  const activeKeys = new Set(context.catalog.map((c) => c.item_key));

  return (
    <InspectionEditor
      key={data.inspection.id}
      inspection={data.inspection}
      initialItems={data.items.filter((i) => activeKeys.has(i.item_key))}
      initialPhotos={data.photos.map((p) => ({
        id: p.id,
        category: p.category,
        item_key: p.item_key,
        storage_path: p.storage_path,
        caption: p.caption,
        url: p.url,
        created_at: p.created_at,
      }))}
      mechanics={context.mechanics}
      canDelete={data.inspection.inspector_id === profile.id || profile.role === "admin"}
      inspectorName={profile.full_name}
    />
  );
}
