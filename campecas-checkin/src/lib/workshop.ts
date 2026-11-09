/**
 * Dados da oficina exibidos no laudo público, no PDF e na página de Privacidade.
 * Campos vazios ficam fora do laudo enviado ao cliente e aparecem como [PREENCHER]
 * na página de Privacidade. Preencha com os dados reais da oficina.
 */
export const WORKSHOP = {
  name: "CAMPEÇAS",
  legalName: "", // razão social
  cnpj: "", // 00.000.000/0000-00
  address: "", // rua, número, bairro, cidade/UF, CEP
  phone: "", // telefone de contato da oficina
  privacyContact: "", // e-mail ou telefone para pedidos da LGPD
} as const;

export const PLACEHOLDER = "[PREENCHER]";

export function orPlaceholder(value: string): string {
  return value.trim() || PLACEHOLDER;
}

/** Linhas da oficina para o laudo: só o que estiver preenchido. */
export function workshopLines(): string[] {
  return [
    WORKSHOP.legalName && WORKSHOP.cnpj ? `${WORKSHOP.legalName} · CNPJ ${WORKSHOP.cnpj}` : WORKSHOP.legalName,
    WORKSHOP.address,
    WORKSHOP.phone,
  ].filter((l): l is string => Boolean(l && l.trim()));
}
