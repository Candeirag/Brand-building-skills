import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="display text-6xl font-extrabold text-brand-red">404</p>
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-steel">O endereço acessado não existe ou a inspeção não está disponível.</p>
      <Link href="/" className={buttonClass("dark", "lg")}>
        Voltar ao painel
      </Link>
    </main>
  );
}
