type LetterboxBarProps = {
  position: "top" | "bottom";
  as?: "header" | "div";
  children: React.ReactNode;
  hidden?: boolean;
};

/**
 * Barra de letterbox fixa. A de cima carrega o logo e a navegação;
 * a de baixo, a legenda de cena e o timecode. Juntas, são a moldura do "filme".
 */
export function LetterboxBar({ position, as: Tag = "div", children, hidden }: LetterboxBarProps) {
  return (
    <Tag
      aria-hidden={hidden || undefined}
      className={`px-gutter fixed inset-x-0 z-50 flex h-(--bar) items-center justify-between gap-6 bg-black ${
        position === "top"
          ? "top-0 border-b border-bone/8"
          : "bottom-0 box-content border-t border-bone/8 pb-[env(safe-area-inset-bottom)]"
      }`}
    >
      {children}
    </Tag>
  );
}
