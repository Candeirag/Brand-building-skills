import { NextResponse } from "next/server";
import { renderReportPdf, pdfResponse } from "@/lib/pdf/render";
import { downloadPublicPhotos, loadPublicReport } from "@/lib/public-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** PDF do laudo público: mesmo token, mesmas regras de validade e revogação da página. */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await loadPublicReport(token, false);
  if (!report) {
    return NextResponse.json({ error: "Laudo não encontrado ou link expirado." }, { status: 404 });
  }

  const photos = await downloadPublicPhotos(report);
  const pdf = await renderReportPdf({
    inspection: { ...report, status: "finalized" },
    items: report.items,
    photos,
    maskedDocument: report.owner_document_masked,
    contactPhone: null, // o laudo público não mostra telefone
  });
  return pdfResponse(pdf, `${report.number}.pdf`);
}
