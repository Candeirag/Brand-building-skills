"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { CircleCheck } from "lucide-react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  suffix?: ReactNode;
  inputClassName?: string;
};

/** Rótulo acima do campo (14/500), dica ou erro abaixo. */
export function TextField({
  label,
  value,
  onValueChange,
  error,
  hint,
  suffix,
  className = "",
  inputClassName = "",
  ...rest
}: TextFieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`field-input ${suffix ? "pr-12" : ""} ${inputClassName}`}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{suffix}</span>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-accent-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Escolha rápida em chips (cores, mecânicos). */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | null | string;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`h-9 rounded-full border px-3.5 text-sm transition ${
              selected ? "border-ink bg-ink font-medium text-white" : "border-control bg-surface text-ink hover:border-faint"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Seção do editor: título-substantivo, uma linha de contexto e o sinal de concluída. */
export function SectionCard({
  id,
  title,
  subtitle,
  complete,
  children,
  aside,
}: {
  id: string;
  title: string;
  subtitle?: string;
  complete?: boolean;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section id={id} className="panel scroll-mt-28 lg:scroll-mt-24" aria-labelledby={`${id}-title`}>
      <header className="flex items-start gap-3 px-4 pt-4 pb-1 sm:px-5 sm:pt-5">
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="h2 flex items-center gap-2">
            {title}
            {complete && <CircleCheck size={17} className="text-positive" aria-label="Concluída" />}
          </h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {aside}
      </header>
      <div className="px-4 pt-4 pb-5 sm:px-5">{children}</div>
    </section>
  );
}
