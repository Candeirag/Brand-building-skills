import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Privacidade e LGPD" };

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/" aria-label="Início">
            <Logo size="sm" subtitle="Oficina · Check-in" />
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-2xl space-y-6 px-5 py-10 text-[15px] leading-6 text-ink sm:px-6">
        <h1 className="h1">Privacidade e proteção de dados</h1>
        <p>
          O CAMPEÇAS CHECK-IN é o sistema interno usado pela oficina CAMPEÇAS para registrar as condições dos veículos no
          momento da entrada. Este aviso descreve como os dados pessoais são tratados, em conformidade com a Lei Geral de
          Proteção de Dados (Lei 13.709/2018).
        </p>
        <section>
          <h2 className="h2 mb-2">Quais dados são coletados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Do proprietário: nome, CPF ou CNPJ (opcional), telefone e WhatsApp.</li>
            <li>Do veículo: placa, marca, modelo, ano, cor, quilometragem, estado de conservação e fotografias.</li>
            <li>Dos funcionários: nome, e-mail e registro das ações realizadas no sistema.</li>
          </ul>
        </section>
        <section>
          <h2 className="h2 mb-2">Finalidade e base legal</h2>
          <p>
            Os dados são usados exclusivamente para identificar o veículo e seu responsável, documentar o estado do veículo
            antes do serviço e permitir o contato sobre o atendimento: execução de contrato (art. 7º, V) e exercício regular
            de direitos (art. 7º, VI). Não há compartilhamento com terceiros para fins comerciais.
          </p>
        </section>
        <section>
          <h2 className="h2 mb-2">Segurança</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Acesso restrito a funcionários autenticados e ativos, com permissões por função.</li>
            <li>Controle de acesso aplicado diretamente no banco de dados (Row Level Security).</li>
            <li>Fotografias em armazenamento privado, acessíveis apenas por links temporários.</li>
            <li>Conexões criptografadas (HTTPS) e trilha de auditoria das operações relevantes.</li>
            <li>Documentos exibidos de forma parcial nos relatórios (minimização de dados).</li>
          </ul>
        </section>
        <section>
          <h2 className="h2 mb-2">Direitos do titular</h2>
          <p>
            O titular pode solicitar confirmação, acesso, correção ou eliminação de seus dados pessoais diretamente na
            oficina. Inspeções finalizadas não são alteradas, mas os dados pessoais podem ser anonimizados mediante
            solicitação, preservando apenas os registros técnicos do veículo.
          </p>
        </section>
        <section>
          <h2 className="h2 mb-2">Retenção</h2>
          <p>
            Os registros de inspeção são mantidos pelo prazo necessário à garantia dos serviços e à defesa em eventuais
            reclamações (prazo prescricional do Código de Defesa do Consumidor), após o qual podem ser anonimizados.
          </p>
        </section>
        <Link href="/" className="inline-block font-medium text-ink underline underline-offset-2">
          ← Voltar ao sistema
        </Link>
      </article>
    </main>
  );
}
