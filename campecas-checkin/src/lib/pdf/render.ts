import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InspectionReport, type ReportProps } from "./inspection-report";

/** Gera o PDF do laudo (usado pela rota interna e pela rota do laudo público). */
export async function renderReportPdf(props: Omit<ReportProps, "generatedAt">): Promise<Buffer> {
  const element = createElement(InspectionReport, { ...props, generatedAt: new Date() }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export function pdfResponse(pdf: Buffer, filename: string): Response {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
