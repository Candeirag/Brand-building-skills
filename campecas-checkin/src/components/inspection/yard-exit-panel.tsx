"use client";

import { useState, useTransition } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { registerVehicleExit, undoVehicleExit } from "@/app/(app)/inspecoes/actions";
import { formatDate, formatTime } from "@/lib/format";
import { YARD_ALERT_HOURS } from "@/lib/yard";
import { YardTimer } from "./yard-timer";

/*
 * Tempo no pátio da inspeção finalizada: corre desde a entrada até "Registrar saída".
 * A saída fica numa tabela própria (a inspeção finalizada não muda) e pode ser desfeita.
 */
export function YardExitPanel({
  inspectionId,
  startedAt,
  exit,
  nowMs,
}: {
  inspectionId: string;
  startedAt: string;
  exit: { exitedAt: string; exitedBy: string | null } | null;
  nowMs: number;
}) {
  const [current, setCurrent] = useState(exit);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function registerExit() {
    setError(null);
    start(async () => {
      const res = await registerVehicleExit(inspectionId);
      if (res.ok) setCurrent({ exitedAt: res.exitedAt, exitedBy: "você" });
      else setError(res.error);
    });
  }

  function undo() {
    if (!window.confirm("Desfazer a saída? O carro volta para a lista do pátio e o tempo volta a contar.")) return;
    setError(null);
    start(async () => {
      const res = await undoVehicleExit(inspectionId);
      if (res.ok) setCurrent(null);
      else setError(res.error);
    });
  }

  return (
    <section className="panel mt-4 p-4 sm:p-5" aria-labelledby="tempo-patio">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="tempo-patio" className="h2">
            {current ? "Tempo que ficou no pátio" : "Tempo no pátio"}
          </h2>
          <p className="mt-1">
            <YardTimer startedAt={startedAt} exitedAt={current?.exitedAt ?? null} nowMs={nowMs} variant="large" />
          </p>
          <p className="text-sm text-muted">
            Entrada em {formatDate(startedAt)} às {formatTime(startedAt)}
            {current ? (
              <>
                {" "}
                · saída em {formatDate(current.exitedAt)} às {formatTime(current.exitedAt)}
                {current.exitedBy ? ` por ${current.exitedBy}` : ""} ·{" "}
                <button
                  type="button"
                  onClick={undo}
                  disabled={pending}
                  className="underline underline-offset-2 hover:text-ink"
                >
                  desfazer
                </button>
              </>
            ) : (
              <> · destaque após {YARD_ALERT_HOURS / 24} dias</>
            )}
          </p>
        </div>
        {!current && (
          <button
            type="button"
            onClick={registerExit}
            disabled={pending}
            className={buttonClass("outline", "lg", "w-full sm:h-10 sm:w-auto")}
          >
            {pending ? <LoaderCircle size={18} className="animate-spin" /> : <LogOut size={18} />}
            Registrar saída do veículo
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-accent-ink">{error}</p>}
    </section>
  );
}
