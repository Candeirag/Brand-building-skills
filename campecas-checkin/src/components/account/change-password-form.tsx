"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { changeOwnPassword, type PasswordState } from "@/app/(app)/conta/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changeOwnPassword, {});

  return (
    <form action={action} className="space-y-4" key={state.ok ? "ok" : "form"}>
      <div>
        <label htmlFor="current-password" className="field-label">
          Senha atual
        </label>
        <input id="current-password" name="current_password" type="password" autoComplete="current-password" required className="field-input" />
      </div>
      <div>
        <label htmlFor="new-password" className="field-label">
          Nova senha
        </label>
        <input
          id="new-password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="new-password-hint"
          className="field-input"
        />
        <p id="new-password-hint" className="mt-1.5 text-xs text-muted">
          Pelo menos 8 caracteres, com letra maiúscula, minúscula e número.
        </p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="field-label">
          Repita a nova senha
        </label>
        <input id="confirm-password" name="confirm_password" type="password" autoComplete="new-password" required className="field-input" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-control border border-tint-2 bg-tint px-3 py-2 text-sm text-accent-ink">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-control border border-positive/25 bg-positive-bg px-3 py-2 text-sm text-positive-ink">
          Senha alterada. Use a nova senha no próximo acesso.
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={buttonClass("primary", "lg", "w-full sm:h-10 sm:w-auto")}>
          {pending && <LoaderCircle size={16} className="animate-spin" />} Salvar nova senha
        </button>
      </div>
    </form>
  );
}
