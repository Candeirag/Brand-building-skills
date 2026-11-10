import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <LogoMark height={36} />
      <h1 className="h1 mt-2">Página não encontrada</h1>
      <p className="max-w-sm text-[15px] text-muted">O endereço não existe ou a inspeção não está disponível para o seu acesso.</p>
      <Link href="/" className={buttonClass("outline", "lg", "mt-2")}>
        Voltar ao painel
      </Link>
    </main>
  );
}
