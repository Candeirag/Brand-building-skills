import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const initialError =
    erro === "inativo" ? "Seu acesso está desativado. Procure o administrador da oficina." : undefined;

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="racing-stripe absolute -top-10 right-0 h-48 w-64 opacity-90" aria-hidden="true" />
        <Logo size="lg" />
        <div className="relative max-w-md">
          <p className="display text-5xl leading-[0.95] font-extrabold text-white">
            Cada veículo,
            <br />
            registrado com <span className="text-brand-red">precisão.</span>
          </p>
          <p className="mt-5 text-lg text-white/60">
            Inspeção de entrada digital: checklist, fotos e histórico completo — antes de qualquer serviço.
          </p>
        </div>
        <p className="text-sm text-white/40">Uso exclusivo dos funcionários da oficina CAMPEÇAS.</p>
      </section>

      <section className="flex flex-col">
        <div className="bg-ink px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-8 lg:hidden">
          <Logo size="lg" />
        </div>
        <div className="flex flex-1 items-start justify-center px-6 py-10 lg:items-center">
          <div className="w-full max-w-sm">
            <h1 className="display text-3xl font-bold">Acesso da equipe</h1>
            <p className="mt-1 mb-8 text-steel">Entre com o e-mail e a senha fornecidos pela oficina.</p>
            <LoginForm next={next} initialError={initialError} />
            <p className="mt-8 text-center text-xs text-steel">
              Esqueceu a senha? Solicite ao administrador.{" "}
              <Link href="/privacidade" className="underline underline-offset-2">
                Privacidade e LGPD
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
