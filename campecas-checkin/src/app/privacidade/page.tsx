import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Privacidade e LGPD" };

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh">
      <header className="bg-ink px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/" aria-label="Início">
            <Logo />
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl space-y-6 px-6 py-10 leading-relaxed text-graphite">
        <h1 className="display text-3xl font-extrabold text-ink">Privacidade e proteção de dados</h1>
        <p>
          O CAMPEÇAS CHECK-IN é o sistema interno usado pela oficina CAMPEÇAS para registrar as condições dos veículos no
          momento da entrada. Este aviso descreve como os dados pessoais são tratados, em conformidade com a Lei Geral de
          Proteção de Dados (Lei 13.709/2018).
        </p>
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">Quais dados são coletados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Do proprietário: nome, CPF ou CNPJ (opcional), telefone e WhatsApp.</li>
            <li>Do veículo: placa, marca, modelo, ano, cor, quilometragem, estado de conservação e fotografias.</li>
            <li>Dos funcionários: nome, e-mail e registro das ações realizadas no sistema.</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">Finalidade e base legal</h2>
          <p>
            Os dados são usados exclusivamente para identificar o veículo e seu responsável, documentar o estado do veículo
            antes do serviço e permitir o contato sobre o atendimento — execução de contrato (art. 7º, V) e exercício regular
            de direitos (art. 7º, VI). Não há compartilhamento com terceiros para fins comerciais.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">Segurança</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Acesso restrito a funcionários autenticados e ativos, com permissões por função.</li>
            <li>Controle de acesso aplicado diretamente no banco de dados (Row Level Security).</li>
            <li>Fotografias em armazenamento privado, acessíveis apenas por links temporários.</li>
            <li>Conexões criptografadas (HTTPS) e trilha de auditoria das operações relevantes.</li>
            <li>Documentos exibidos de forma parcial nos relatórios (minimização de dados).</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">Direitos do titular</h2>
          <p>
            O titular pode solicitar confirmação, acesso, correção ou eliminação de seus dados pessoais diretamente na
            oficina. Inspeções finalizadas não são alteradas, mas os dados pessoais podem ser anonimizados mediante
            solicitação, preservando apenas os registros técnicos do veículo.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-ink">Retenção</h2>
          <p>
            Os registros de inspeção são mantidos pelo prazo necessário à garantia dos serviços e à defesa em eventuais
            reclamações (prazo prescricional do Código de Defesa do Consumidor), após o qual podem ser anonimizados.
          </p>
        </section>
        <Link href="/" className="inline-block font-semibold text-brand-red">
          ← Voltar ao sistema
        </Link>
      </article>
    </main>
  );
}
