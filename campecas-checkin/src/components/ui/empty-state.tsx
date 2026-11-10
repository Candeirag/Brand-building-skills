import type { ReactNode } from "react";

/** Seção vazia: mantém a moldura e ganha uma frase em caixa tracejada. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="m-4 rounded-card border border-dashed border-dash px-4 py-3 text-sm">
      <p className="font-medium text-ink">{title}</p>
      {children && <div className="mt-0.5 text-muted">{children}</div>}
    </div>
  );
}
