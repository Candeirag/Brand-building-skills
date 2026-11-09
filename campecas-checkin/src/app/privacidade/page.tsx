import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PLACEHOLDER, WORKSHOP, orPlaceholder } from "@/lib/workshop";

export const metadata: Metadata = { title: "Privacidade e LGPD" };

const UPDATED_AT = "9 de novembro de 2026";

export default function PrivacyPage() {
  const controller: [string, string][] = [
    ["Oficina", WORKSHOP.name],
    ["Razão social", orPlaceholder(WORKSHOP.legalName)],
    ["CNPJ", orPlaceholder(WORKSHOP.cnpj)],
    ["Endereço", orPlaceholder(WORKSHOP.address)],
    ["Canal para pedidos da LGPD", orPlaceholder(WORKSHOP.privacyContact)],
  ];
  return (
    <main className="min-h-dvh">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/" aria-label="Início">
            <Logo height={26} subtitle="Check-in · inspeção de entrada" />
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-2xl space-y-6 px-5 py-10 text-[15px] leading-6 text-ink sm:px-6">
        <div>
          <h1 className="h1">Privacidade e proteção de dados</h1>
          <p className="mt-1 text-sm text-muted">Última atualização: {UPDATED_AT}</p>
        </div>
        <p>
          O CAMPEÇAS CHECK-IN é o sistema interno usado pela oficina CAMPEÇAS para registrar as condições dos veículos no
          momento da entrada. Este aviso descreve como os dados pessoais são tratados, em conformidade com a Lei Geral de
          Proteção de Dados (Lei 13.709/2018).
        </p>
        <section>
          <h2 className="h2 mb-2">Quem é o controlador dos dados</h2>
          <dl className="space-y-1">
            {controller.map(([label, value]) => (
              <div key={label} className="flex flex-wrap gap-x-2">
                <dt className="text-muted">{label}:</dt>
                <dd className={value === PLACEHOLDER ? "font-medium text-accent-ink" : ""}>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2">
            Pedidos relacionados à LGPD (acesso, correção, anonimização ou eliminação) podem ser feitos pelo canal acima ou
            pessoalmente na oficina.
          </p>
        </section>
        <section>
          <h2 className="h2 mb-2">Quais dados são coletados</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Do proprietário: nome, CPF ou CNPJ (opcional), telefone e WhatsApp.</li>
            <li>Do veículo: placa, marca, modelo, ano, cor, quilometragem, nível de combustível, estado de conservação e fotografias.</li>
            <li>Do atendimento: o serviço solicitado ou a queixa relatada pelo cliente.</li>
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
          <h2 className="h2 mb-2">Operadores (empresas que tratam dados em nome da oficina)</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="font-medium">Supabase</strong>: banco de dados, login dos funcionários e armazenamento
              privado das fotografias (servidores na região de São Paulo).
            </li>
            <li>
              <strong className="font-medium">Vercel</strong>: hospedagem do sistema (as páginas e o laudo são servidos a
              partir de São Paulo).
            </li>
            <li>
              <strong className="font-medium">WhatsApp (Meta)</strong>: envio do link do laudo ao cliente. A mensagem leva o
              primeiro nome do cliente, o veículo, a placa, a data da entrada e o link; o laudo em si fica no sistema da
              oficina.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="h2 mb-2">Laudo enviado ao cliente</h2>
          <p>
            O laudo de entrada é aberto por um link pessoal, com código aleatório, que vale 30 dias e pode ser cancelado pela
            oficina a qualquer momento. O laudo não é indexado por buscadores, mostra o CPF/CNPJ mascarado e não mostra o
            telefone. Cada envio fica registrado (quem enviou e quando).
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
            Os registros de inspeção, incluindo fotografias, são guardados por 5 anos a partir da entrada do veículo, prazo
            prescricional para reclamações de consumo (Código de Defesa do Consumidor, art. 27). Depois disso, os dados
            pessoais podem ser anonimizados, mantendo só os registros técnicos do veículo. Rascunhos de inspeção sem nenhum
            dado preenchido são apagados automaticamente após 24 horas.
          </p>
        </section>
        <Link href="/" className="inline-block font-medium text-ink underline underline-offset-2">
          ← Voltar ao sistema
        </Link>
      </article>
    </main>
  );
}
