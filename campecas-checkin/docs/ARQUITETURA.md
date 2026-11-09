# Arquitetura — CAMPEÇAS CHECK-IN

## Visão geral

```
 Celular / tablet / PC (navegador, instalável como app)
        │  HTTPS
        ▼
 ┌─────────────────────────────────────────────┐
 │ Next.js 16 (App Router) — Vercel ou Node     │
 │  • proxy.ts: renova sessão e protege rotas   │
 │  • Server Components: painel, histórico,     │
 │    visualização (dados lidos com a sessão    │
 │    do funcionário → RLS aplicada)            │
 │  • Server Actions: criar/finalizar/excluir   │
 │    inspeção, gestão da equipe                │
 │  • Route Handler: /api/inspecoes/[id]/pdf    │
 │  • Client Components: editor da inspeção     │
 │    (salvamento automático, câmera, upload)   │
 └───────────────┬─────────────────────────────┘
                 │ supabase-js (JWT do funcionário)
                 ▼
 ┌─────────────────────────────────────────────┐
 │ Supabase                                     │
 │  • Auth: login por e-mail/senha, sem cadastro│
 │    público; papéis em app_metadata           │
 │  • PostgreSQL: tabelas + RLS + gatilhos +    │
 │    função finalize_inspection()              │
 │  • Storage: bucket PRIVADO inspection-photos │
 │    (URLs assinadas e temporárias)            │
 └─────────────────────────────────────────────┘
```

**Princípio central:** a segurança e as regras críticas ficam no banco de dados. Mesmo que alguém chame a API do
Supabase diretamente com a chave pública, as políticas RLS, os gatilhos e a função de finalização impedem acesso
indevido, alteração de inspeções finalizadas e números forjados.

## Fluxo da inspeção (uma única tela)

1. **Nova inspeção** (painel) → Server Action cria um rascunho; o banco força `status = draft`, registra
   `started_at` (data/hora automáticas), o funcionário e copia os 18 itens do catálogo do checklist.
2. **Editor** (`/inspecoes/[id]/editar`) — tela única com 5 seções e atalhos no topo:
   Veículo → Proprietário → Checklist → Fotos → Finalização.
   - Digitar a placa busca o veículo e preenche marca, modelo, ano, cor e proprietário automaticamente.
   - Cliente também pode ser localizado por telefone ou CPF/CNPJ.
   - "Pendentes = Normal" responde de uma vez os itens restantes; avarias exigem descrição e aceitam fotos.
   - Fotos tiradas pela câmera traseira são redimensionadas (máx. 1920 px, JPEG) e recebem uma marca com
     placa, data e hora antes do envio.
3. **Salvamento automático**: cada alteração é gravada no Supabase ~1 s depois (alterações agrupadas em uma
   única requisição) e copiada no `localStorage`. Sem internet, o indicador mostra "salvo no aparelho" e o envio
   é refeito ao reconectar, ao minimizar o app ou a cada 5 s em caso de erro. Ao reabrir, alterações não enviadas
   são recuperadas.
4. **Finalizar** → `finalize_inspection()` valida tudo no banco, cadastra/atualiza cliente e veículo, gera o
   número único `CP{ANO}-{SEQUENCIAL}` (ex.: `CP2026-000124`), registra data/hora e responsável, e grava na
   auditoria. A partir daí a inspeção, seus itens e suas fotos são **imutáveis**.

## Modelo de dados

| Tabela | Conteúdo |
| --- | --- |
| `profiles` | Funcionários (1:1 com `auth.users`): nome, e-mail, papel (`admin`, `inspector`, `mechanic`), ativo |
| `customers` | Proprietários: nome, CPF/CNPJ, telefone, WhatsApp (somente dígitos), `anonymized_at` |
| `vehicles` | Placa única, marca, modelo, ano, cor, proprietário atual, última quilometragem |
| `checklist_items` | Catálogo dos itens do checklist (permite incluir/desativar itens sem mudar código) |
| `inspections` | Inspeção: número, status, **cópia** dos dados do veículo e do proprietário no momento da entrada, km, combustível, responsáveis, observações, datas |
| `inspection_items` | Resposta de cada item (status + descrição), com rótulo copiado do catálogo |
| `inspection_photos` | Metadados das fotos (categoria, item da avaria, caminho no Storage, tamanho) |
| `audit_log` | Trilha de auditoria (sem dados pessoais) |

Os dados do veículo/proprietário são copiados para a inspeção para que o registro finalizado reflita exatamente
o momento da entrada, mesmo que o cadastro mude depois.

Status do checklist: `ok` (Normal), `damaged` (Avariado), `not_checked` (Não verificado),
`not_applicable` (Não se aplica). `null` significa "ainda não respondido" — a finalização exige todos respondidos.

Categorias de foto: `front`, `rear`, `left_side`, `right_side`, `dashboard`, `damage`, `extra`.
Caminho no Storage: `{inspection_id}/{categoria}/{uuid}.jpg`.

## Segurança

| Camada | Medida |
| --- | --- |
| Autenticação | Supabase Auth; cadastro público desativado; funcionários criados pelo administrador. Sessão em cookies httpOnly renovada pelo `proxy.ts` (`getClaims`). |
| Autorização | `is_staff()` (ativo) e `is_admin()` usados em todas as políticas RLS. Papel anônimo sem nenhum privilégio. Funcionário desativado é bloqueado no Auth (ban) e perde acesso imediatamente via RLS. |
| Integridade | Gatilhos impedem forjar status/número/autor; finalizadas não podem ser alteradas ou excluídas (nem pelo dono do banco); só o autor ou admin exclui rascunhos; sempre resta 1 admin ativo. |
| Fotos | Bucket privado, limite de 10 MiB, apenas JPEG/PNG/WebP; envio e remoção só em rascunhos; sem sobrescrita; leitura por URL assinada de 2 h. |
| Aplicação | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy` (câmera só no próprio site); validação com zod nas Server Actions; proteção contra redirecionamento aberto no login; busca sanitizada para filtros do PostgREST; nenhuma chave secreta no servidor: a gestão da equipe usa funções do banco restritas a administradores (`admin_create_member`, `admin_set_member_password`), e desativar um perfil bloqueia o login no Auth por gatilho. |

## LGPD

- **Finalidade e minimização**: apenas dados necessários à identificação e ao contato; CPF/CNPJ opcional.
- **Transparência**: aviso no formulário do proprietário e página pública `/privacidade`.
- **Mascaramento**: documento exibido parcialmente no relatório PDF e para não administradores.
- **Direito de eliminação**: `anonymize_customer()` (tela Equipe → Privacidade de clientes) remove nome,
  documento e telefones do cadastro **e** das inspeções finalizadas, preservando apenas dados técnicos.
- **Responsabilização**: `audit_log` registra criação, finalização, exclusão de rascunho, alterações de cadastro
  (somente os nomes dos campos) e anonimizações, sem armazenar dados pessoais.
- **Retenção**: recomenda-se definir o prazo (ex.: 5 anos, prazo prescricional do CDC) e anonimizar após.

## Direção de arte

A interface segue a skill de direção de arte para telas de app (`references/app-screens.md`), estilo
**accent ladder** (seed `1386293280`):

- **Um matiz só, o vermelho Campeças (`#e10600`)**, cheio apenas em marcas pequenas: as avarias, o ícone da
  navegação ativa e o único botão preenchido de cada tela. Os tons claros dele fazem o trabalho de área
  (item ativo, avisos de avaria). O fundo (`#fbf8f8`) fica um degrau tingido em direção ao vermelho.
- **Vermelho significa avaria.** Em todo lugar (tabelas, mapa, KPIs, PDF) a cor cheia aponta um dano ou uma
  pendência; o que está normal fica em cinza.
- **Elemento-assinatura: o mapa de avarias** (`src/lib/damage-map.ts`), o croqui da ficha de entrada em papel,
  desenhado a partir do checklist. Mesma geometria na tela e no PDF.
- **Estrutura "plano aberto"**: barra lateral clara de 240 px no desktop; no celular, barra superior de 48 px com o
  nome da tela e barra inferior com os destinos (o editor usa a tela inteira).
- **Superfícies chapadas**: borda de 1 px ou degrau de tom, sem sombra em repouso; raio 8/6/4; uma família
  tipográfica (Barlow), com mono só para identificadores (placa, nº da inspeção).
- **Cada tela responde a uma pergunta**, escrita como comentário no topo do arquivo da página (ex.: painel:
  "Quais carros do pátio estão com inspeção aberta, e o que entrou hoje?").

Checagem: `lint.mjs --app` sem achados e `inspect.mjs --app` sem FAIL em todas as telas, em 1440, 768 e 390 px.
Os avisos restantes são defendidos: telas curtas com poucos dados de exemplo (`hero-void`) e o editor, que é um
formulário sequencial com atalhos para cada seção (`below-fold`).

## Decisões e evolução

- **Por que gravar direto do navegador no Supabase?** O salvamento automático precisa ser leve e tolerante a
  falhas; o RLS garante a segurança, e as operações sensíveis (finalizar, excluir, equipe) passam pelo servidor.
- **PDF no servidor** (`@react-pdf/renderer`): mesmo layout em qualquer aparelho, fotos baixadas com a sessão do
  usuário, sem expor URLs.
- **Próximos passos sugeridos**: assinatura digital do cliente na tela; envio automático do PDF por WhatsApp
  (API oficial); app offline completo (Service Worker + fila de fotos em IndexedDB); painel de indicadores;
  tela de administração do catálogo do checklist; inspeção de saída comparando com a entrada.
