"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { Check } from "lucide-react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  suffix?: ReactNode;
  inputClassName?: string;
};

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
          className={`field-input ${suffix ? "pr-14" : ""} ${inputClassName}`}
          {...rest}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-steel">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-brand-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-steel">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

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
            className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${
              selected ? "border-ink bg-ink text-white" : "border-line bg-white text-graphite hover:border-graphite/40"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SectionCard({
  id,
  step,
  title,
  subtitle,
  complete,
  children,
  aside,
}: {
  id: string;
  step: number;
  title: string;
  subtitle?: string;
  complete?: boolean;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section id={id} className="card scroll-mt-44 overflow-hidden" aria-labelledby={`${id}-title`}>
      <header className="flex items-center gap-3 border-b border-line px-4 py-4 sm:px-6">
        <span
          className={`display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-extrabold ${
            complete ? "bg-ok text-white" : "bg-ink text-white"
          }`}
          aria-hidden="true"
        >
          {complete ? <Check size={20} strokeWidth={3} /> : step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="display text-xl leading-tight font-bold">
            {title}
          </h2>
          {subtitle && <p className="text-sm text-steel">{subtitle}</p>}
        </div>
        {aside}
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
}
