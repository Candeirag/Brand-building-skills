import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatDocument,
  formatKm,
  formatPhone,
  formatPlate,
  isoDateInSaoPaulo,
  maskDocument,
  startOfDaySaoPaulo,
  whatsappLink,
} from "@/lib/format";

describe("formatação", () => {
  it("placa", () => {
    expect(formatPlate("ABC1D23")).toBe("ABC-1D23");
    expect(formatPlate(null)).toBe("–");
  });
  it("telefone", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
  });
  it("documentos", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
  });
  it("mascara documentos (LGPD)", () => {
    expect(maskDocument("52998224725")).toBe("***.982.247-**");
    expect(maskDocument("11222333000181")).toBe("**.222.333/0001-**");
  });
  it("quilometragem", () => {
    expect(formatKm(85432)).toBe("85.432 km");
  });
  it("datas no fuso de Brasília", () => {
    expect(isoDateInSaoPaulo(new Date("2026-11-10T02:30:00Z"))).toBe("2026-11-09");
    expect(startOfDaySaoPaulo("2026-11-09")).toBe("2026-11-09T03:00:00.000Z");
    expect(formatDateTime("2026-11-09T17:05:00Z")).toBe("09/11/2026 às 14:05");
  });
  it("link de WhatsApp", () => {
    expect(whatsappLink("(11) 98765-4321")).toBe("https://wa.me/5511987654321");
    expect(whatsappLink("123")).toBeNull();
  });
});
