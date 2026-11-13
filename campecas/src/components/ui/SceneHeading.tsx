type SceneHeadingProps = {
  scene: string;
  slug: string;
  className?: string;
};

/** Cabeçalho de cena no formato de roteiro: "CENA 03 — INT. CABINE DE PINTURA — NOITE". */
export function SceneHeading({ scene, slug, className = "" }: SceneHeadingProps) {
  return (
    <p className={`label flex items-center gap-3 text-ash ${className}`}>
      <span className="shrink-0 text-bone">Cena {scene}</span>
      <span className="h-px w-8 shrink-0 bg-red" aria-hidden="true" />
      <span>{slug}</span>
    </p>
  );
}
