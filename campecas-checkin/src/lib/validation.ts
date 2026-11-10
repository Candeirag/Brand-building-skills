/** Remove tudo que não for dígito. */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Normaliza placa: maiúsculas, sem hífen/espaços. */
export function normalizePlate(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
}

/** Placa no padrão antigo (ABC1234) ou Mercosul (ABC1D23). */
export function isValidPlate(value: string | null | undefined): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value));
}

export function isValidCPF(value: string | null | undefined): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i]! * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === digits[9] && calc(10) === digits[10];
}

export function isValidCNPJ(value: string | null | undefined): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digits = cnpj.split("").map(Number);
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + digits[i]! * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === digits[12] && calc(13) === digits[13];
}

export function isValidDocument(value: string | null | undefined): boolean {
  const d = onlyDigits(value);
  return d.length === 11 ? isValidCPF(d) : d.length === 14 ? isValidCNPJ(d) : false;
}

/** Telefone brasileiro com DDD: 10 (fixo) ou 11 (celular) dígitos. */
export function isValidPhone(value: string | null | undefined): boolean {
  const d = onlyDigits(value);
  if (d.length === 11) return /^[1-9]{2}9\d{8}$/.test(d);
  if (d.length === 10) return /^[1-9]{2}[2-8]\d{7}$/.test(d);
  return false;
}

export function isValidYear(value: number | null | undefined): boolean {
  if (value == null) return false;
  const max = new Date().getFullYear() + 1;
  return Number.isInteger(value) && value >= 1900 && value <= max;
}

/** Remove caracteres com significado especial nos filtros do PostgREST. */
export function sanitizeSearch(value: string | null | undefined): string {
  return (value ?? "").replace(/[,()*%\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
