import type { ElementType } from 'react';

interface HeadingProps {
  /** Cada item é uma linha do título. No máximo duas. */
  lines: string[];
  as?: ElementType;
  className?: string;
  id?: string;
}

/** Título de seção: cada linha sobe de dentro de uma máscara ao entrar na tela. */
export function Heading({ lines, as: Tag = 'h2', className = '', id }: HeadingProps) {
  return (
    <Tag id={id} className={`display ${className}`}>
      {lines.map((line) => (
        <span key={line} className="-mt-[0.16em] block overflow-hidden pb-[0.07em] pt-[0.16em]">
          <span data-line className="block">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
