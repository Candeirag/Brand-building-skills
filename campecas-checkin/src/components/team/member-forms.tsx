"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, LoaderCircle, UserPlus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { createMember, resetMemberPassword, updateMember, type FormState } from "@/app/(app)/equipe/actions";
import type { Tables } from "@/lib/supabase/database.types";

const ROLES = [
  { value: "inspector", label: "Recepção / Vistoria" },
  { value: "mechanic", label: "Mecânico" },
  { value: "admin", label: "Administrador" },
] as const;

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="rounded-control border border-tint-2 bg-tint px-3 py-2 text-sm text-accent-ink">{state.error}</p>;
  if (state.message)
    return <p className="rounded-control border border-positive/25 bg-positive-bg px-3 py-2 text-sm text-positive-ink">{state.message}</p>;
  return null;
}

export function CreateMemberForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createMember, {});
  return (
    <form action={action} className="space-y-4" key={state.ok ? state.message : undefined}>
      <div>
        <label className="field-label" htmlFor="m-name">Nome completo</label>
        <input id="m-name" name="full_name" required className="field-input" autoComplete="off" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="m-email">E-mail</label>
          <input id="m-email" name="email" type="email" required className="field-input" autoComplete="off" />
        </div>
        <div>
          <label className="field-label" htmlFor="m-role">Função</label>
          <select id="m-role" name="role" defaultValue="inspector" className="field-input">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="m-pass">Senha provisória</label>
        <input id="m-pass" name="password" type="text" required minLength={8} className="field-input id-type" autoComplete="new-password" aria-describedby="m-pass-hint" />
        <p id="m-pass-hint" className="mt-1.5 text-xs text-muted">Mínimo de 8 caracteres, com maiúscula, minúscula e número.</p>
      </div>
      <Feedback state={state} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full sm:h-10 sm:w-auto")}>
          {pending ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />} Cadastrar funcionário
        </button>
      </div>
    </form>
  );
}

export function MemberRow({ member, isSelf }: { member: Tables<"profiles">; isSelf: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetState, resetAction, resetting] = useActionState<FormState, FormData>(resetMemberPassword, {});

  const run = (changes: Parameters<typeof updateMember>[1]) =>
    start(async () => {
      setError(null);
      const res = await updateMember(member.id, changes);
      if (res.error) setError(res.error);
    });

  return (
    <li className="border-t border-rule px-4 py-3 first:border-t-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className={`truncate font-medium ${member.active ? "" : "text-muted"}`}>{member.full_name}</span>
            {isSelf && <span className="text-xs text-muted">você</span>}
            {!member.active && (
              <span className="inline-flex h-5 flex-none items-center rounded-chip bg-raised px-1.5 text-xs text-muted">Desativado</span>
            )}
          </p>
          <p className="truncate text-[13px] text-muted">{member.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={member.role}
            disabled={pending || isSelf}
            onChange={(e) => run({ role: e.target.value as Tables<"profiles">["role"] })}
            className="h-9 rounded-control border border-control bg-surface px-2 text-sm"
            aria-label={`Função de ${member.full_name}`}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button type="button" disabled={pending || isSelf} onClick={() => run({ active: !member.active })} className={buttonClass(member.active ? "danger" : "outline", "md")}>
            {pending ? <LoaderCircle size={14} className="animate-spin" /> : member.active ? "Desativar" : "Reativar"}
          </button>
          <button type="button" onClick={() => setShowReset((s) => !s)} className={buttonClass("ghost", "md", "w-9 px-0")} aria-label={`Redefinir senha de ${member.full_name}`} aria-expanded={showReset}>
            <KeyRound size={16} />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-accent-ink">{error}</p>}
      {showReset && (
        <form action={resetAction} className="mt-3 space-y-2">
          <input type="hidden" name="user_id" value={member.id} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input name="password" type="text" placeholder="Nova senha provisória" aria-label="Nova senha provisória" required minLength={8} className="field-input flex-1 id-type sm:h-9" autoComplete="new-password" />
            <button type="submit" disabled={resetting} className={buttonClass("outline", "lg", "sm:h-9")}>Redefinir senha</button>
          </div>
          <Feedback state={resetState} />
        </form>
      )}
    </li>
  );
}
