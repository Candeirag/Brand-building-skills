/** Concordância de número: plural(1, "avaria", "avarias") → "1 avaria"; plural(3, …) → "3 avarias". */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

/** Só a palavra, sem o número: pick(2, "foi", "foram") → "foram". */
export function pick(n: number, singular: string, pluralForm: string): string {
  return n === 1 ? singular : pluralForm;
}
