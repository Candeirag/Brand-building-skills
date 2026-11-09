"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: initialError });
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="field-input"
          placeholder="seu.nome@campecas.com.br"
        />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Senha
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field-input pr-14"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 flex w-13 items-center justify-center text-steel"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-brand-red-soft px-4 py-3 text-sm font-medium text-brand-red-dark">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonClass("primary", "xl", "w-full")}>
        {pending ? <LoaderCircle className="animate-spin" size={22} /> : <LogIn size={22} />}
        Entrar
      </button>
    </form>
  );
}
