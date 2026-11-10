import { describe, expect, it } from "vitest";
import {
  isValidCNPJ,
  isValidCPF,
  isValidDocument,
  isValidPhone,
  isValidPlate,
  normalizePlate,
  sanitizeSearch,
} from "@/lib/validation";

describe("placas", () => {
  it("aceita padrão antigo e Mercosul", () => {
    expect(isValidPlate("ABC1234")).toBe(true);
    expect(isValidPlate("abc-1d23")).toBe(true);
    expect(isValidPlate("BRA2E19")).toBe(true);
  });
  it("rejeita formatos inválidos", () => {
    expect(isValidPlate("AB12345")).toBe(false);
    expect(isValidPlate("ABCD123")).toBe(false);
    expect(isValidPlate("")).toBe(false);
  });
  it("normaliza", () => {
    expect(normalizePlate(" abc-1d23 ")).toBe("ABC1D23");
  });
});

describe("documentos", () => {
  it("valida CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });
  it("valida CNPJ", () => {
    expect(isValidCNPJ("11.222.333/0001-81")).toBe(true);
    expect(isValidCNPJ("11.222.333/0001-80")).toBe(false);
    expect(isValidCNPJ("00.000.000/0000-00")).toBe(false);
  });
  it("aceita CPF ou CNPJ", () => {
    expect(isValidDocument("52998224725")).toBe(true);
    expect(isValidDocument("11222333000181")).toBe(true);
    expect(isValidDocument("123")).toBe(false);
  });
});

describe("telefones", () => {
  it("valida celular e fixo com DDD", () => {
    expect(isValidPhone("(11) 98765-4321")).toBe(true);
    expect(isValidPhone("(11) 3456-7890")).toBe(true);
    expect(isValidPhone("(11) 8765-4321")).toBe(true);
    expect(isValidPhone("11 18765-4321")).toBe(false);
    expect(isValidPhone("98765-4321")).toBe(false);
  });
});

describe("busca", () => {
  it("remove caracteres de controle do PostgREST", () => {
    expect(sanitizeSearch("abc,plate.eq.x)")).toBe("abc plate eq x");
    expect(sanitizeSearch("  Carlos   Silva ")).toBe("Carlos Silva");
  });
});
