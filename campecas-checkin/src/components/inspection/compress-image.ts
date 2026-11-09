import { MAX_PHOTO_DIMENSION, PHOTO_QUALITY } from "@/lib/photos";

export type CompressedImage = { blob: Blob; width: number; height: number };

async function loadImage(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; release: () => void }> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Fallback abaixo (ex.: formatos não suportados pelo createImageBitmap)
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => URL.revokeObjectURL(url) };
}

/**
 * Redimensiona e converte a foto para JPEG (reduz o consumo de dados móveis e
 * de armazenamento) e grava uma marca com placa, data e hora: evidência do
 * estado do veículo no momento da entrada.
 */
export async function compressImage(file: File, stamp?: string): Promise<CompressedImage> {
  const { source, width, height, release } = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(source, 0, 0, w, h);

    if (stamp) {
      const fontSize = Math.max(14, Math.round(Math.min(w, h) * 0.028));
      const pad = Math.round(fontSize * 0.6);
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
      const textWidth = ctx.measureText(stamp).width;
      const boxH = fontSize + pad * 2;
      ctx.fillStyle = "rgba(11,11,12,0.72)";
      ctx.fillRect(0, h - boxH, textWidth + pad * 3, boxH);
      ctx.fillStyle = "#e10600";
      ctx.fillRect(0, h - boxH, Math.max(4, Math.round(fontSize * 0.25)), boxH);
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(stamp, pad * 2, h - boxH / 2);
    }

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao processar a imagem"))), "image/jpeg", PHOTO_QUALITY),
    );
    return { blob, width: w, height: h };
  } finally {
    release();
  }
}
