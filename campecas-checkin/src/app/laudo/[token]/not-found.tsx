import { Logo } from "@/components/brand/logo";

export default function ReportNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ground p-6 text-center">
      <Logo height={30} />
      <h1 className="h1 mt-4">Laudo indisponível</h1>
      <p className="max-w-sm text-[15px] text-muted">
        Este link não existe, expirou (vale 30 dias) ou foi cancelado pela oficina. Peça um novo link à oficina.
      </p>
    </main>
  );
}
