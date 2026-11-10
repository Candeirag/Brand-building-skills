"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

/**
 * Abre o editor de uma inspeção nova. Não grava nada no banco: o rascunho só é
 * criado quando a pessoa preenche o primeiro campo. Fica desabilitado depois do
 * primeiro toque, para um toque duplo não abrir duas vezes.
 */
export function NewInspectionButton({
  plate,
  label = "Nova inspeção",
  variant = "primary",
  className = "w-full sm:h-10 sm:w-auto",
}: {
  plate?: string;
  label?: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const href = plate ? `/inspecoes/nova?placa=${encodeURIComponent(plate)}` : "/inspecoes/nova";

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => {
        if (pending) return;
        setPending(true);
        router.push(href);
      }}
      className={buttonClass(variant, "lg", className)}
    >
      {pending ? <LoaderCircle size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={2.25} />}
      {label}
    </button>
  );
}
