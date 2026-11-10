import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

/*
 * Desktop: apresentação à esquerda (azul-escuro da marca), formulário à direita.
 * Celular: logo e formulário primeiro; a apresentação vem depois.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;
  const initialError =
    erro === "inativo" ? "Seu acesso está desativado. Procure o administrador da oficina." : undefined;

  return (
    <main className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex flex-col px-5 pt-[max(env(safe-area-inset-top),2rem)] pb-10 sm:px-8 lg:order-2">
        <div className="lg:hidden">
          <Logo height={72} priority />
        </div>
        <div className="flex flex-1 items-start justify-center pt-10 lg:items-center lg:pt-0">
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

      <section className="flex flex-col justify-between gap-8 bg-brand-deep p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] text-white sm:p-8 lg:order-1 lg:p-12">
        <div className="hidden lg:block">
          <Logo tone="dark" height={104} />
        </div>
        <div className="max-w-lg">
          <p className="text-[28px] leading-[1.15] font-semibold lg:text-[40px] lg:leading-[1.1]">
            Cada carro registrado antes do <span className="text-accent-on-dark">primeiro aperto.</span>
          </p>
          <p className="mt-4 text-base leading-7 text-white/70 lg:text-lg">
            Placa, quilometragem, checklist, fotos e avarias de quem entra na oficina, num laudo que o cliente recebe no
            WhatsApp.
          </p>
        </div>
        <p className="text-sm text-white/70">Uso exclusivo da equipe da MineiroCar Auto Center.</p>
      </section>
    </main>
  );
}
