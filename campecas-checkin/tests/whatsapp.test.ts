import { describe, expect, it } from "vitest";
import { normalizeWhatsappNumber, pickContactNumber, reportMessage, whatsappUrl } from "@/lib/whatsapp";

describe("número do WhatsApp", () => {
  it("normaliza para 55 + DDD + número", () => {
    expect(normalizeWhatsappNumber("(61) 99864-9037")).toBe("5561998649037");
    expect(normalizeWhatsappNumber("6135755864")).toBe("556135755864");
    expect(normalizeWhatsappNumber("061998649037")).toBe("5561998649037");
    expect(normalizeWhatsappNumber("+55 61 99864-9037")).toBe("5561998649037");
  });
  it("recusa números sem DDD ou incompletos", () => {
    expect(normalizeWhatsappNumber("99864-9037")).toBeNull();
    expect(normalizeWhatsappNumber("")).toBeNull();
    expect(normalizeWhatsappNumber(null)).toBeNull();
  });
  it("usa o WhatsApp e, sem ele, o telefone", () => {
    expect(pickContactNumber("61998649037", "6135755864")).toBe("5561998649037");
    expect(pickContactNumber(null, "6135755864")).toBe("556135755864");
    expect(pickContactNumber(null, null)).toBeNull();
  });
});

describe("mensagem do laudo", () => {
  it("monta o texto pedido pela oficina", () => {
    const msg = reportMessage({
      ownerName: "Carlos Eduardo da Silva",
      brand: "Volkswagen",
      model: "Gol 1.0",
      plate: "ABC1D23",
      registeredAt: "2026-11-09T12:10:00Z",
      link: "https://campecas-checkin.vercel.app/laudo/abc",
    });
    expect(msg).toBe(
      "Olá, Carlos! Aqui é da oficina Campeças. Segue o laudo de entrada do seu Volkswagen Gol 1.0, placa ABC-1D23, registrado em 09/11/2026 às 09:10: https://campecas-checkin.vercel.app/laudo/abc",
    );
    expect(whatsappUrl("5561998649037", "Olá!")).toBe("https://wa.me/5561998649037?text=Ol%C3%A1!");
  });
});
