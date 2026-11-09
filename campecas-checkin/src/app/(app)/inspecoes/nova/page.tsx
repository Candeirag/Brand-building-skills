import type { Metadata } from "next";
import { InspectionEditor } from "@/components/inspection/inspection-editor";
import { requireStaff } from "@/lib/auth";
import { loadEditorContext } from "@/lib/inspection-data";
import { isValidPlate, normalizePlate } from "@/lib/validation";

export const metadata: Metadata = { title: "Nova inspeção" };

/*
 * Inspeção nova: nada é gravado ao abrir esta tela. O rascunho nasce no banco
 * quando a pessoa preenche o primeiro campo ou tira a primeira foto.
 */
export default async function NewInspectionPage({ searchParams }: { searchParams: Promise<{ placa?: string }> }) {
  const profile = await requireStaff();
  const { placa } = await searchParams;
  const context = await loadEditorContext();
  const plate = normalizePlate(placa);

  return (
    <InspectionEditor
      inspection={null}
      initialItems={context.catalog}
      initialPhotos={[]}
      mechanics={context.mechanics}
      canDelete
      inspectorName={profile.full_name}
      initialPlate={isValidPlate(plate) ? plate : undefined}
    />
  );
}
