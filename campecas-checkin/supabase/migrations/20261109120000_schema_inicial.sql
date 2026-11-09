-- =============================================================================
-- CAMPEÇAS CHECK-IN — Schema inicial
-- Tabelas, tipos, catálogo do checklist, gatilhos de integridade e auditoria.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Tipos
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'inspector', 'mechanic');
create type public.inspection_status as enum ('draft', 'finalized');
create type public.checklist_status as enum ('ok', 'damaged', 'not_checked', 'not_applicable');
create type public.photo_category as enum (
  'front', 'rear', 'left_side', 'right_side', 'dashboard', 'damage', 'extra'
);
create type public.fuel_level as enum ('reserve', 'quarter', 'half', 'three_quarters', 'full');

-- -----------------------------------------------------------------------------
-- Utilitário: updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Funcionários (perfil vinculado ao Supabase Auth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  email       text,
  role        public.user_role not null default 'inspector',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Funcionários da oficina com acesso ao sistema.';

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Funções de autorização usadas pelas políticas RLS.
-- SECURITY DEFINER para evitar recursão de RLS ao consultar profiles.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.active and p.role = 'admin'
  );
$$;

-- Cria o perfil quando um usuário é criado no Auth.
-- O papel vem de app_metadata (definível apenas com a service role).
-- O primeiro usuário criado no sistema torna-se administrador.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'Funcionário'), '@', 1)
  );
  if char_length(v_name) < 2 then
    v_name := 'Funcionário';
  end if;

  if not exists (select 1 from public.profiles) then
    v_role := 'admin';
  else
    begin
      v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'inspector');
    exception when invalid_text_representation then
      v_role := 'inspector';
    end;
  end if;

  insert into public.profiles (id, full_name, email, role)
  values (new.id, left(v_name, 120), new.email, v_role);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantém o e-mail do perfil sincronizado com o Auth.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Impede que o sistema fique sem nenhum administrador ativo.
create or replace function public.protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin' and old.active
     and (new.role <> 'admin' or not new.active)
     and not exists (
       select 1 from public.profiles
       where role = 'admin' and active and id <> old.id
     )
  then
    raise exception 'É necessário manter pelo menos um administrador ativo.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_last_admin
  before update of role, active on public.profiles
  for each row execute function public.protect_last_admin();

-- -----------------------------------------------------------------------------
-- Clientes (proprietários) — dados pessoais (LGPD)
-- Documentos e telefones são armazenados somente com dígitos.
-- -----------------------------------------------------------------------------
create table public.customers (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null check (char_length(full_name) between 2 and 160),
  document       text check (document ~ '^([0-9]{11}|[0-9]{14})$'),
  phone          text check (phone ~ '^[0-9]{10,11}$'),
  whatsapp       text check (whatsapp ~ '^[0-9]{10,11}$'),
  anonymized_at  timestamptz,
  created_by     uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.customers is 'Proprietários de veículos. Dados pessoais tratados conforme a LGPD.';
comment on column public.customers.document is 'CPF (11 dígitos) ou CNPJ (14 dígitos), somente números.';

create unique index customers_document_key on public.customers (document) where document is not null;
create index customers_phone_idx on public.customers (phone) where phone is not null;
create index customers_whatsapp_idx on public.customers (whatsapp) where whatsapp is not null;

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Veículos
-- Placa no padrão antigo (ABC1234) ou Mercosul (ABC1D23), sem hífen, maiúscula.
-- -----------------------------------------------------------------------------
create table public.vehicles (
  id            uuid primary key default gen_random_uuid(),
  plate         text not null unique check (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  brand         text check (char_length(brand) <= 60),
  model         text check (char_length(model) <= 80),
  year          smallint check (year between 1900 and 2100),
  color         text check (char_length(color) <= 40),
  customer_id   uuid references public.customers (id) on delete set null,
  last_mileage  integer check (last_mileage >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index vehicles_customer_idx on public.vehicles (customer_id);

create trigger vehicles_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Catálogo do checklist (permite evoluir os itens sem alterar o código)
-- -----------------------------------------------------------------------------
create table public.checklist_items (
  key         text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label       text not null check (char_length(label) between 2 and 80),
  group_name  text not null default 'Outros',
  position    smallint not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.checklist_items (key, label, group_name, position) values
  ('front_bumper',   'Para-choque dianteiro', 'Exterior',        10),
  ('rear_bumper',    'Para-choque traseiro',  'Exterior',        20),
  ('hood',           'Capô',                  'Exterior',        30),
  ('doors',          'Portas',                'Exterior',        40),
  ('trunk',          'Porta-malas',           'Exterior',        50),
  ('mirrors',        'Retrovisores',          'Exterior',        60),
  ('headlights',     'Faróis',                'Exterior',        70),
  ('taillights',     'Lanternas',             'Exterior',        80),
  ('windows',        'Vidros',                'Exterior',        90),
  ('wheels',         'Rodas',                 'Rodas e pneus',  100),
  ('tires',          'Pneus',                 'Rodas e pneus',  110),
  ('seats',          'Bancos',                'Interior',       120),
  ('dashboard',      'Painel',                'Interior',       130),
  ('interior',       'Interior do veículo',   'Interior',       140),
  ('warning_lights', 'Luzes de advertência',  'Interior',       150),
  ('fuel',           'Combustível',           'Outros',         160),
  ('personal_items', 'Objetos pessoais',      'Outros',         170),
  ('other_damage',   'Outros danos',          'Outros',         180);

-- -----------------------------------------------------------------------------
-- Inspeções
-- Os dados do veículo e do proprietário são copiados para a inspeção, de modo
-- que o registro finalizado permanece fiel ao momento da entrada, mesmo que o
-- cadastro do cliente ou do veículo mude depois.
-- -----------------------------------------------------------------------------
create sequence public.inspection_number_seq as bigint start with 1;

create table public.inspections (
  id                   uuid primary key default gen_random_uuid(),
  number               text unique,
  status               public.inspection_status not null default 'draft',

  vehicle_id           uuid references public.vehicles (id),
  customer_id          uuid references public.customers (id),

  plate                text check (plate is null or plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  brand                text check (char_length(brand) <= 60),
  model                text check (char_length(model) <= 80),
  year                 smallint check (year between 1900 and 2100),
  color                text check (char_length(color) <= 40),
  mileage              integer check (mileage between 0 and 9999999),
  fuel_level           public.fuel_level,

  owner_name           text check (char_length(owner_name) <= 160),
  owner_document       text check (owner_document ~ '^([0-9]{11}|[0-9]{14})$'),
  owner_phone          text check (owner_phone ~ '^[0-9]{10,11}$'),
  owner_whatsapp       text check (owner_whatsapp ~ '^[0-9]{10,11}$'),

  inspector_id         uuid not null default auth.uid() references public.profiles (id),
  inspector_name       text check (char_length(inspector_name) <= 120),
  mechanic_id          uuid references public.profiles (id),
  mechanic_name        text check (char_length(mechanic_name) <= 120),
  notes                text check (char_length(notes) <= 5000),
  checklist_confirmed  boolean not null default false,

  started_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  finalized_at         timestamptz,
  finalized_by         uuid references public.profiles (id),

  constraint inspections_finalized_complete check (
    status = 'draft' or (
      number is not null and finalized_at is not null and finalized_by is not null
      and plate is not null and owner_name is not null and mileage is not null
      and checklist_confirmed
    )
  )
);

comment on table public.inspections is 'Inspeções de entrada. Registros finalizados são imutáveis.';

create index inspections_status_idx on public.inspections (status, started_at desc);
create index inspections_finalized_at_idx on public.inspections (finalized_at desc) where status = 'finalized';
create index inspections_plate_idx on public.inspections (plate);
create index inspections_vehicle_idx on public.inspections (vehicle_id);
create index inspections_customer_idx on public.inspections (customer_id);
create index inspections_inspector_idx on public.inspections (inspector_id);
create index inspections_owner_name_trgm on public.inspections using gin (owner_name extensions.gin_trgm_ops);

create trigger inspections_updated_at
  before update on public.inspections
  for each row execute function public.set_updated_at();

-- Itens do checklist de cada inspeção (rótulo copiado do catálogo).
create table public.inspection_items (
  inspection_id  uuid not null references public.inspections (id) on delete cascade,
  item_key       text not null references public.checklist_items (key),
  item_label     text not null,
  group_name     text not null,
  position       smallint not null default 0,
  status         public.checklist_status,
  notes          text check (char_length(notes) <= 2000),
  updated_at     timestamptz not null default now(),
  primary key (inspection_id, item_key)
);

create trigger inspection_items_updated_at
  before update on public.inspection_items
  for each row execute function public.set_updated_at();

-- Fotografias (arquivo no Supabase Storage, metadados aqui).
create table public.inspection_photos (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid not null references public.inspections (id) on delete cascade,
  category       public.photo_category not null,
  item_key       text references public.checklist_items (key),
  storage_path   text not null unique,
  caption        text check (char_length(caption) <= 300),
  mime_type      text not null default 'image/jpeg',
  size_bytes     integer check (size_bytes > 0),
  width          integer,
  height         integer,
  created_by     uuid references public.profiles (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  constraint inspection_photos_path_matches check (storage_path like inspection_id::text || '/%')
);

create index inspection_photos_inspection_idx on public.inspection_photos (inspection_id, category);

-- -----------------------------------------------------------------------------
-- Auditoria (LGPD: registro de operações relevantes, sem dados pessoais)
-- -----------------------------------------------------------------------------
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid,
  action      text not null,
  entity      text not null,
  entity_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

create or replace function public.write_audit(
  p_action text, p_entity text, p_entity_id uuid, p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, entity, entity_id, details)
  values ((select auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

-- -----------------------------------------------------------------------------
-- Integridade das inspeções
-- -----------------------------------------------------------------------------

-- Valores controlados pelo sistema no INSERT (o cliente não pode forjá-los).
create or replace function public.inspections_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.status := 'draft';
  new.number := null;
  new.finalized_at := null;
  new.finalized_by := null;
  new.checklist_confirmed := false;
  new.started_at := now();
  if auth.uid() is not null then
    new.inspector_id := auth.uid();
  end if;
  if new.inspector_name is null then
    select full_name into new.inspector_name from public.profiles where id = new.inspector_id;
  end if;
  return new;
end;
$$;

create trigger inspections_before_insert
  before insert on public.inspections
  for each row execute function public.inspections_before_insert();

-- Preenche os itens do checklist a partir do catálogo ativo.
create or replace function public.inspections_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.inspection_items (inspection_id, item_key, item_label, group_name, position)
  select new.id, c.key, c.label, c.group_name, c.position
  from public.checklist_items c
  where c.active;

  perform public.write_audit('inspection.created', 'inspection', new.id, '{}'::jsonb);
  return new;
end;
$$;

create trigger inspections_after_insert
  after insert on public.inspections
  for each row execute function public.inspections_after_insert();

-- Inspeções finalizadas são imutáveis. A transição rascunho → finalizada só
-- ocorre pela função finalize_inspection(). A única exceção é a anonimização
-- de dados pessoais (LGPD), executada por administrador.
create or replace function public.inspections_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('campecas.lgpd_override', true), '') = 'on' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    if old.status = 'finalized' then
      raise exception 'Inspeções finalizadas não podem ser excluídas.'
        using errcode = 'insufficient_privilege';
    end if;
    return old;
  end if;

  if old.status = 'finalized' then
    raise exception 'Inspeção % já foi finalizada e não pode ser alterada.', old.number
      using errcode = 'insufficient_privilege';
  end if;

  if coalesce(current_setting('campecas.finalizing', true), '') = 'on' then
    return new;
  end if;

  -- Campos protegidos durante o rascunho
  new.status := old.status;
  new.number := old.number;
  new.finalized_at := old.finalized_at;
  new.finalized_by := old.finalized_by;
  new.inspector_id := old.inspector_id;
  new.started_at := old.started_at;
  return new;
end;
$$;

create trigger inspections_guard
  before update or delete on public.inspections
  for each row execute function public.inspections_guard();

create or replace function public.inspection_is_draft(p_inspection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.inspections i
    where i.id = p_inspection_id and i.status = 'draft'
  );
$$;

-- Itens e fotos de inspeções finalizadas também são imutáveis.
create or replace function public.inspection_children_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inspection_id uuid;
  v_status public.inspection_status;
begin
  if coalesce(current_setting('campecas.lgpd_override', true), '') = 'on'
     or coalesce(current_setting('campecas.finalizing', true), '') = 'on' then
    return coalesce(new, old);
  end if;

  v_inspection_id := case when tg_op = 'DELETE' then old.inspection_id else new.inspection_id end;
  select status into v_status from public.inspections where id = v_inspection_id;

  -- Inspeção inexistente: exclusão em cascata de um rascunho.
  if v_status = 'finalized' then
    raise exception 'Inspeção finalizada não pode ser alterada.'
      using errcode = 'insufficient_privilege';
  end if;

  if tg_op = 'UPDATE' and new.inspection_id <> old.inspection_id then
    raise exception 'Não é permitido mover registros entre inspeções.'
      using errcode = 'insufficient_privilege';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger inspection_items_guard
  before insert or update or delete on public.inspection_items
  for each row execute function public.inspection_children_guard();

create trigger inspection_photos_guard
  before insert or update or delete on public.inspection_photos
  for each row execute function public.inspection_children_guard();

-- -----------------------------------------------------------------------------
-- Finalização
-- Valida a inspeção, atualiza cadastros de cliente e veículo, gera o número
-- único (CP{ANO}-{SEQUENCIAL}) e registra data/hora e responsável.
-- -----------------------------------------------------------------------------
create or replace function public.finalize_inspection(p_inspection_id uuid)
returns table (id uuid, number text, finalized_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_insp public.inspections%rowtype;
  v_customer_id uuid;
  v_vehicle_id uuid;
  v_number text;
  v_now timestamptz := now();
  v_pending integer;
  v_damaged_without_notes integer;
  v_errors text[] := '{}';
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_insp from public.inspections i where i.id = p_inspection_id for update;
  if not found then
    raise exception 'Inspeção não encontrada.' using errcode = 'no_data_found';
  end if;
  if v_insp.status <> 'draft' then
    raise exception 'Inspeção % já foi finalizada.', v_insp.number using errcode = 'check_violation';
  end if;

  if v_insp.plate is null then v_errors := array_append(v_errors, 'placa'); end if;
  if coalesce(trim(v_insp.brand), '') = '' then v_errors := array_append(v_errors, 'marca'); end if;
  if coalesce(trim(v_insp.model), '') = '' then v_errors := array_append(v_errors, 'modelo'); end if;
  if v_insp.mileage is null then v_errors := array_append(v_errors, 'quilometragem'); end if;
  if coalesce(trim(v_insp.owner_name), '') = '' then v_errors := array_append(v_errors, 'nome do proprietário'); end if;
  if v_insp.owner_phone is null and v_insp.owner_whatsapp is null then
    v_errors := array_append(v_errors, 'telefone ou WhatsApp');
  end if;
  if coalesce(trim(v_insp.inspector_name), '') = '' then v_errors := array_append(v_errors, 'funcionário responsável'); end if;
  if coalesce(trim(v_insp.mechanic_name), '') = '' then v_errors := array_append(v_errors, 'mecânico responsável'); end if;
  if not v_insp.checklist_confirmed then v_errors := array_append(v_errors, 'confirmação do checklist'); end if;

  select count(*) filter (where it.status is null),
         count(*) filter (where it.status = 'damaged' and coalesce(trim(it.notes), '') = '')
    into v_pending, v_damaged_without_notes
  from public.inspection_items it
  where it.inspection_id = p_inspection_id;

  if v_pending > 0 then
    v_errors := array_append(v_errors, format('%s item(ns) do checklist sem resposta', v_pending));
  end if;
  if v_damaged_without_notes > 0 then
    v_errors := array_append(v_errors, format('%s avaria(s) sem descrição', v_damaged_without_notes));
  end if;

  if array_length(v_errors, 1) > 0 then
    raise exception 'Não foi possível finalizar. Pendências: %', array_to_string(v_errors, ', ')
      using errcode = 'check_violation';
  end if;

  -- Cliente: o selecionado na busca, ou o de mesmo CPF/CNPJ, ou um novo cadastro.
  v_customer_id := v_insp.customer_id;
  if v_customer_id is not null
     and not exists (select 1 from public.customers c where c.id = v_customer_id and c.anonymized_at is null) then
    v_customer_id := null;
  end if;
  if v_customer_id is null and v_insp.owner_document is not null then
    select c.id into v_customer_id from public.customers c where c.document = v_insp.owner_document;
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, document, phone, whatsapp)
    values (trim(v_insp.owner_name), v_insp.owner_document, v_insp.owner_phone, v_insp.owner_whatsapp)
    returning customers.id into v_customer_id;
  else
    update public.customers c set
      full_name = trim(v_insp.owner_name),
      document  = coalesce(v_insp.owner_document, c.document),
      phone     = coalesce(v_insp.owner_phone, c.phone),
      whatsapp  = coalesce(v_insp.owner_whatsapp, c.whatsapp)
    where c.id = v_customer_id;
  end if;

  insert into public.vehicles as v (plate, brand, model, year, color, customer_id, last_mileage)
  values (v_insp.plate, trim(v_insp.brand), trim(v_insp.model), v_insp.year, v_insp.color, v_customer_id, v_insp.mileage)
  on conflict (plate) do update set
    brand = excluded.brand,
    model = excluded.model,
    year = coalesce(excluded.year, v.year),
    color = coalesce(excluded.color, v.color),
    customer_id = excluded.customer_id,
    last_mileage = greatest(coalesce(v.last_mileage, 0), excluded.last_mileage)
  returning v.id into v_vehicle_id;

  v_number := 'CP' || to_char(v_now at time zone 'America/Sao_Paulo', 'YYYY') || '-'
              || lpad(nextval('public.inspection_number_seq')::text, 6, '0');

  perform set_config('campecas.finalizing', 'on', true);

  update public.inspections i set
    status = 'finalized',
    number = v_number,
    finalized_at = v_now,
    finalized_by = auth.uid(),
    customer_id = v_customer_id,
    vehicle_id = v_vehicle_id,
    brand = trim(v_insp.brand),
    model = trim(v_insp.model),
    owner_name = trim(v_insp.owner_name)
  where i.id = p_inspection_id;

  perform set_config('campecas.finalizing', 'off', true);

  perform public.write_audit('inspection.finalized', 'inspection', p_inspection_id,
    jsonb_build_object('number', v_number));

  return query select p_inspection_id, v_number, v_now;
end;
$$;

-- -----------------------------------------------------------------------------
-- LGPD: anonimização de titular (direito de eliminação, art. 18, VI)
-- Remove dados pessoais do cadastro e das inspeções, preservando o registro
-- técnico do veículo. Somente administradores.
-- -----------------------------------------------------------------------------
create or replace function public.anonymize_customer(p_customer_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc text;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem anonimizar dados.' using errcode = 'insufficient_privilege';
  end if;

  select document into v_doc from public.customers where id = p_customer_id;
  if not found then
    raise exception 'Cliente não encontrado.' using errcode = 'no_data_found';
  end if;

  perform set_config('campecas.lgpd_override', 'on', true);

  update public.inspections set
    owner_name = 'Titular anonimizado',
    owner_document = null,
    owner_phone = null,
    owner_whatsapp = null
  where customer_id = p_customer_id
     or (v_doc is not null and owner_document = v_doc);

  update public.customers set
    full_name = 'Titular anonimizado',
    document = null,
    phone = null,
    whatsapp = null,
    anonymized_at = now()
  where id = p_customer_id;

  update public.vehicles set customer_id = null where customer_id = p_customer_id;

  perform set_config('campecas.lgpd_override', 'off', true);

  perform public.write_audit('customer.anonymized', 'customer', p_customer_id, '{}'::jsonb);
end;
$$;

-- Auditoria de alterações de cadastro (somente nomes das colunas alteradas).
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed jsonb;
begin
  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(n.key), '[]'::jsonb) into v_changed
    from jsonb_each(to_jsonb(new)) n
    join jsonb_each(to_jsonb(old)) o using (key)
    where n.value is distinct from o.value and n.key <> 'updated_at';
    if v_changed = '[]'::jsonb then
      return new;
    end if;
    perform public.write_audit(tg_table_name || '.updated', tg_table_name, new.id,
      jsonb_build_object('fields', v_changed));
    return new;
  elsif tg_op = 'INSERT' then
    perform public.write_audit(tg_table_name || '.created', tg_table_name, new.id, '{}'::jsonb);
    return new;
  else
    perform public.write_audit(tg_table_name || '.deleted', tg_table_name, old.id, '{}'::jsonb);
    return old;
  end if;
end;
$$;

create trigger customers_audit
  after insert or update or delete on public.customers
  for each row execute function public.audit_row_change();

create trigger profiles_audit
  after update or delete on public.profiles
  for each row execute function public.audit_row_change();

create or replace function public.audit_inspection_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.write_audit('inspection.draft_deleted', 'inspection', old.id,
    jsonb_build_object('plate', old.plate));
  return old;
end;
$$;

create trigger inspections_audit_delete
  after delete on public.inspections
  for each row execute function public.audit_inspection_delete();
