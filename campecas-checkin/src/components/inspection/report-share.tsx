"use client";

import { useState, useTransition } from "react";
import { Check, Copy, LoaderCircle, MessageCircle } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { getReportLink, registerReportSent, revokeReportLink } from "@/app/(app)/inspecoes/actions";
import { formatDate, formatTime } from "@/lib/format";
import { reportMessage, whatsappUrl } from "@/lib/whatsapp";

type Props = {
  inspectionId: string;
  /** Número já normalizado (55 + DDD + número) ou null se o cliente não tem telefone válido. */
  contactNumber: string | null;
  message: { ownerName: string | null; brand: string | null; model: string | null; plate: string | null; registeredAt: string };
  activeLink: { token: string; expiresAt: string } | null;
  lastDelivery: { sentAt: string; sentBy: string | null } | null;
};

/*
 * Envio do laudo ao cliente. O link público só é gerado no primeiro envio ou cópia
 * (token aleatório, 30 dias, revogável); cada envio pelo WhatsApp fica registrado.
 */
export function ReportShare({ inspectionId, contactNumber, message, activeLink, lastDelivery }: Props) {
  const [link, setLink] = useState(activeLink);
  const [delivery, setDelivery] = useState(lastDelivery);
  const [busy, setBusy] = useState<"whatsapp" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, startRevoke] = useTransition();

  const urlFor = (token: string) => `${window.location.origin}/laudo/${token}`;

  async function ensureLink(): Promise<string | null> {
    if (link) return link.token;
    const res = await getReportLink(inspectionId);
    if (!res.ok) {
      setError(res.error);
      return null;
    }
    setLink({ token: res.token, expiresAt: res.expiresAt });
    return res.token;
  }

  async function sendWhatsapp() {
    if (!contactNumber || busy) return;
    setError(null);
    setBusy("whatsapp");
    // Abre a aba já no toque (navegadores bloqueiam janelas abertas depois de uma espera).
    const win = window.open("", "_blank");
    if (win) win.opener = null;
    try {
      const token = await ensureLink();
      if (!token) {
        win?.close();
        return;
      }
      const url = whatsappUrl(contactNumber, reportMessage({ ...message, link: urlFor(token) }));
      const sent = await registerReportSent(inspectionId);
      if (sent.ok) setDelivery({ sentAt: sent.sentAt, sentBy: "você" });
      if (win) win.location.href = url;
      else window.location.href = url;
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    if (busy) return;
    setError(null);
    setBusy("copy");
    try {
      const token = await ensureLink();
      if (!token) return;
      const url = urlFor(token);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        window.prompt("Copie o link do laudo:", url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } finally {
      setBusy(null);
    }
  }

  function revoke() {
    if (!window.confirm("Cancelar o link do laudo? Quem tiver o link não conseguirá mais abrir. Um novo link pode ser gerado depois.")) return;
    startRevoke(async () => {
      const res = await revokeReportLink(inspectionId);
      if (res.ok) setLink(null);
      else setError(res.error);
    });
  }

  return (
    <section className="panel mt-6 p-4 sm:p-5" aria-labelledby="laudo-cliente">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 id="laudo-cliente" className="h2">
            Laudo do cliente
          </h2>
          <p className="text-sm text-muted">
            {delivery ? (
              <>
                <Check size={14} className="mr-1 inline text-positive" />
                Enviado em {formatDate(delivery.sentAt)} às {formatTime(delivery.sentAt)}
                {delivery.sentBy ? ` por ${delivery.sentBy}` : ""}
              </>
            ) : (
              "Ainda não enviado ao cliente"
            )}
          </p>
          {link && (
            <p className="mt-0.5 text-xs text-muted">
              Link válido até {formatDate(link.expiresAt)} ·{" "}
              <button type="button" onClick={revoke} disabled={revoking} className="underline underline-offset-2 hover:text-ink">
                {revoking ? "cancelando…" : "cancelar link"}
              </button>
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-none">
          <button
            type="button"
            onClick={() => void sendWhatsapp()}
            disabled={!contactNumber || busy !== null}
            className={buttonClass("primary", "lg", "sm:h-10")}
          >
            {busy === "whatsapp" ? <LoaderCircle size={18} className="animate-spin" /> : <MessageCircle size={18} />}
            Enviar laudo no WhatsApp
          </button>
          <button type="button" onClick={() => void copyLink()} disabled={busy !== null} className={buttonClass("outline", "lg", "sm:h-10")}>
            {busy === "copy" ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : copied ? (
              <Check size={18} className="text-positive" />
            ) : (
              <Copy size={18} />
            )}
            {copied ? "Link copiado" : "Copiar link"}
          </button>
        </div>
      </div>
      {!contactNumber && (
        <p className="mt-3 text-sm text-muted">
          O cliente não tem WhatsApp nem telefone válido no cadastro. Use &ldquo;Copiar link&rdquo; para enviar por outro meio.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-accent-ink">{error}</p>}
    </section>
  );
}
