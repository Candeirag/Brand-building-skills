import type { ReactNode } from "react";

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 text-steel/70">{icon}</div>}
      <p className="font-semibold text-graphite">{title}</p>
      {children && <div className="max-w-sm text-sm text-steel">{children}</div>}
    </div>
  );
}
