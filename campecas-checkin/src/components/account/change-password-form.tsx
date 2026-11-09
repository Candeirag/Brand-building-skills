"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function passwordProblem(p: string): string | null {
  if (p.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (p.length > 72) return "A senha deve ter no máximo 72 caracteres.";
  if (!/[a-z]/.test(p)) return "A senha deve conter letra minúscula.";
  if (!/[A-Z]/.test(p)) return "A senha deve conter letra maiúscula.";
  if (!/\d/.test(p)) return "A senha deve conter número.";
  return null;
}

export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const problem = passwordProblem(password);
    if (problem) return setResult({ ok: false, text: problem });
    if (password !== confirm) return setResult({ ok: false, text: "As duas senhas não são iguais." });

    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPending(false);
    if (error) {
      const same = /different from the old|same/i.test(error.message);
      return setResult({ ok: false, text: same ? "A nova senha precisa ser diferente da atual." : "Não foi possível alterar a senha. Tente de novo." });
    }
    setPassword("");
    setConfirm("");
    setResult({ ok: true, text: "Senha alterada. Use a nova senha no próximo acesso." });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="new-password" className="field-label">
          Nova senha
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          required
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="field-label">
          Repita a nova senha
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field-input"
          required
        />
      </div>
      {result && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`rounded-control border px-3 py-2 text-sm ${
            result.ok ? "border-positive/25 bg-positive-bg text-positive-ink" : "border-tint-2 bg-tint text-accent-ink"
          }`}
        >
          {result.text}
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
