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
  if (state.error) return <p className="rounded-lg bg-brand-red-soft px-3 py-2 text-sm text-brand-red-dark">{state.error}</p>;
  if (state.message) return <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{state.message}</p>;
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
      <div>
        <label className="field-label" htmlFor="m-pass">Senha provisória</label>
        <input id="m-pass" name="password" type="text" required minLength={8} className="field-input font-mono" autoComplete="new-password" />
        <p className="mt-1 text-xs text-steel">Mín. 8 caracteres, com maiúscula, minúscula e número.</p>
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={buttonClass("dark", "lg", "w-full")}>
        {pending ? <LoaderCircle size={20} className="animate-spin" /> : <UserPlus size={20} />} Cadastrar
      </button>
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
    <li className={`px-4 py-4 sm:px-5 ${member.active ? "" : "bg-paper/60"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {member.full_name} {isSelf && <span className="text-xs font-normal text-steel">(você)</span>}
          </p>
          <p className="truncate text-sm text-steel">{member.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={member.role}
            disabled={pending || isSelf}
            onChange={(e) => run({ role: e.target.value as Tables<"profiles">["role"] })}
            className="h-10 rounded-lg border border-line bg-white px-2 text-sm"
            aria-label={`Função de ${member.full_name}`}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || isSelf}
            onClick={() => run({ active: !member.active })}
            className={buttonClass(member.active ? "danger" : "outline", "sm")}
          >
            {pending ? <LoaderCircle size={14} className="animate-spin" /> : member.active ? "Desativar" : "Reativar"}
          </button>
          <button type="button" onClick={() => setShowReset((s) => !s)} className={buttonClass("ghost", "sm")} aria-label="Redefinir senha">
            <KeyRound size={16} />
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-brand-red">{error}</p>}
      {showReset && (
        <form action={resetAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="user_id" value={member.id} />
          <input name="password" type="text" placeholder="Nova senha provisória" required minLength={8} className="field-input h-11 flex-1 font-mono" autoComplete="new-password" />
          <button type="submit" disabled={resetting} className={buttonClass("dark", "md")}>Redefinir</button>
          <div className="sm:hidden"><Feedback state={resetState} /></div>
        </form>
      )}
      {showReset && <div className="mt-2 hidden sm:block"><Feedback state={resetState} /></div>}
    </li>
  );
}
