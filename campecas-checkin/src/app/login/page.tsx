import type { Metadata } from "next";
import Link from "next/link";
import { Logo, LogoMark } from "@/components/brand/logo";
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
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <span className="inline-flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <span className="font-brand text-2xl font-bold tracking-tight uppercase italic">Campeças</span>
        </span>
        <div className="max-w-lg">
          <p className="text-[40px] leading-[1.1] font-semibold">
            Cada carro registrado antes do <span className="text-accent">primeiro aperto.</span>
          </p>
          <p className="mt-4 text-lg leading-7 text-white/70">
            Placa, quilometragem, checklist, fotos e avarias de quem entra na oficina, num laudo que o cliente recebe no
            WhatsApp.
          </p>
        </div>
        <p className="text-sm text-white/70">Uso exclusivo da equipe da oficina CAMPEÇAS.</p>
      </section>

      <section className="flex flex-col px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-10 sm:px-8">
        <div className="lg:hidden">
          <Logo size="md" subtitle="Oficina · Check-in" />
        </div>
        <div className="flex flex-1 items-start justify-center pt-12 lg:items-center lg:pt-0">
          <div className="w-full max-w-sm">
            <h1 className="h1">Acesso da equipe</h1>
            <p className="mt-1 mb-7 text-[15px] text-muted">Entre com o e-mail e a senha que a oficina forneceu.</p>
            <LoginForm next={next} initialError={initialError} />
            <p className="mt-8 text-sm text-muted">
              Esqueceu a senha? Peça ao administrador para redefinir.{" "}
              <Link href="/privacidade" className="text-ink underline underline-offset-2">
                Privacidade e LGPD
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
