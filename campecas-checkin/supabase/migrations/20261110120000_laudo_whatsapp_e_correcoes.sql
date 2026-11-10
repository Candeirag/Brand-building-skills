-- =============================================================================
-- CAMPEÇAS CHECK-IN: laudo público por link, envio pelo WhatsApp e correções
--  1. Rascunhos vazios: marcados (is_blank), fora das contagens, limpos após 24 h.
--  2. "Serviço solicitado / queixa do cliente" obrigatório na finalização.
--  3. Item "Combustível" sai do checklist (o nível de combustível já cobre).
--  4. Fotos obrigatórias: frente, painel com km e uma por avaria.
--  5. Links do laudo (token aleatório, 30 dias, revogável) e registro de envios.
--  6. Senha provisória: troca obrigatória no primeiro acesso.
--  7. Ninguém altera a própria função nem se desativa.
-- Toda tabela nova tem RLS. As tabelas continuam fechadas para leitura anônima.
-- =============================================================================

-- Concordância de número nas mensagens geradas pelo banco.
create or replace function public.plural(p_n bigint, p_singular text, p_plural text)
returns text
language sql
immutable
set search_path = ''
as $$
  select p_n::text || ' ' || case when p_n = 1 then p_singular else p_plural end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Rascunhos vazios
-- -----------------------------------------------------------------------------
alter table public.inspections add column is_blank boolean not null default false;
alter table public.inspections alter column is_blank set default true;
alter table public.inspections add column service_request text
  check (char_length(service_request) <= 2000);

comment on column public.inspections.is_blank is
  'Rascunho sem nenhum dado preenchido. Não entra nas contagens e é apagado após 24 h.';
comment on column public.inspections.service_request is 'Serviço solicitado / queixa do cliente.';

create or replace function public.inspection_row_has_data(r public.inspections)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    r.plate is not null or nullif(trim(r.brand), '') is not null or nullif(trim(r.model), '') is not null
    or r.year is not null or nullif(trim(r.color), '') is not null or r.mileage is not null
    or r.fuel_level is not null or nullif(trim(r.owner_name), '') is not null or r.owner_document is not null
    or r.owner_phone is not null or r.owner_whatsapp is not null or r.customer_id is not null
    or nullif(trim(r.mechanic_name), '') is not null or nullif(trim(r.notes), '') is not null
    or nullif(trim(r.service_request), '') is not null or r.checklist_confirmed,
    false);
$$;

-- Uma vez preenchido, o rascunho deixa de ser vazio (só vai de true para false).
create or replace function public.inspections_track_blank()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.is_blank := old.is_blank and new.is_blank;
  end if;
  if new.is_blank and public.inspection_row_has_data(new) then
    new.is_blank := false;
  end if;
  return new;
end;
$$;

create trigger inspections_track_blank
  before insert or update on public.inspections
  for each row execute function public.inspections_track_blank();

-- Resposta no checklist ou foto também conta como dado.
create or replace function public.mark_inspection_not_blank()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.inspections set is_blank = false
   where id = new.inspection_id and is_blank and status = 'draft';
  return new;
end;
$$;

create trigger inspection_items_mark_not_blank
  after update on public.inspection_items
  for each row
  when (new.status is not null or new.notes is not null)
  execute function public.mark_inspection_not_blank();

create trigger inspection_photos_mark_not_blank
  after insert on public.inspection_photos
  for each row execute function public.mark_inspection_not_blank();

-- Rascunhos existentes sem nenhum dado passam a ser vazios.
update public.inspections i set is_blank = true
 where i.status = 'draft'
   and not public.inspection_row_has_data(i)
   and not exists (select 1 from public.inspection_items it
                    where it.inspection_id = i.id and (it.status is not null or it.notes is not null))
   and not exists (select 1 from public.inspection_photos p where p.inspection_id = i.id);

-- Limpeza automática: rascunhos vazios com mais de 24 h (sem fotos, por definição).
create or replace function public.cleanup_blank_drafts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  delete from public.inspections
   where status = 'draft' and is_blank and started_at < now() - interval '24 hours';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create index inspections_blank_drafts_idx on public.inspections (started_at) where status = 'draft' and is_blank;

-- Agenda a limpeza de hora em hora quando o pg_cron estiver disponível (Supabase).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    perform cron.schedule('campecas-limpar-rascunhos-vazios', '17 * * * *', 'select public.cleanup_blank_drafts()');
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 3. Item "Combustível" sai do catálogo (o nível de combustível já cobre).
-- Rascunhos que ainda têm a linha passam a ignorá-la (ver finalize_inspection).
-- -----------------------------------------------------------------------------
update public.checklist_items set active = false where key = 'fuel';

-- -----------------------------------------------------------------------------
-- 2 e 4. Finalização com serviço solicitado e fotos obrigatórias
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
  v_damaged_without_photo text;
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
  if coalesce(trim(v_insp.service_request), '') = '' then
    v_errors := array_append(v_errors, 'serviço solicitado');
  end if;
  if coalesce(trim(v_insp.inspector_name), '') = '' then v_errors := array_append(v_errors, 'funcionário responsável'); end if;
  if coalesce(trim(v_insp.mechanic_name), '') = '' then v_errors := array_append(v_errors, 'mecânico responsável'); end if;
  if not v_insp.checklist_confirmed then v_errors := array_append(v_errors, 'confirmação do checklist'); end if;

  -- Só contam os itens ativos no catálogo (o antigo item "Combustível" é ignorado).
  select count(*) filter (where it.status is null),
         count(*) filter (where it.status = 'damaged' and coalesce(trim(it.notes), '') = '')
    into v_pending, v_damaged_without_notes
  from public.inspection_items it
  join public.checklist_items c on c.key = it.item_key and c.active
  where it.inspection_id = p_inspection_id;

  if v_pending > 0 then
    v_errors := array_append(v_errors, public.plural(v_pending, 'item do checklist sem resposta', 'itens do checklist sem resposta'));
  end if;
  if v_damaged_without_notes > 0 then
    v_errors := array_append(v_errors, public.plural(v_damaged_without_notes, 'avaria sem descrição', 'avarias sem descrição'));
  end if;

  if not exists (select 1 from public.inspection_photos p where p.inspection_id = p_inspection_id and p.category = 'front') then
    v_errors := array_append(v_errors, 'foto da frente do veículo');
  end if;
  if not exists (select 1 from public.inspection_photos p where p.inspection_id = p_inspection_id and p.category = 'dashboard') then
    v_errors := array_append(v_errors, 'foto do painel com a quilometragem');
  end if;

  select string_agg(it.item_label, ', ' order by it.position) into v_damaged_without_photo
  from public.inspection_items it
  join public.checklist_items c on c.key = it.item_key and c.active
  where it.inspection_id = p_inspection_id and it.status = 'damaged'
    and not exists (select 1 from public.inspection_photos p
                     where p.inspection_id = p_inspection_id and p.item_key = it.item_key);
  if v_damaged_without_photo is not null then
    v_errors := array_append(v_errors, 'foto da avaria: ' || v_damaged_without_photo);
  end if;

  if array_length(v_errors, 1) > 0 then
    raise exception 'Não foi possível finalizar. Pendências: %', array_to_string(v_errors, '; ')
      using errcode = 'check_violation';
  end if;

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
    owner_name = trim(v_insp.owner_name),
    service_request = trim(v_insp.service_request)
  where i.id = p_inspection_id;

  perform set_config('campecas.finalizing', 'off', true);

  perform public.write_audit('inspection.finalized', 'inspection', p_inspection_id,
    jsonb_build_object('number', v_number));

  return query select p_inspection_id, v_number, v_now;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Laudo público: links com token e registro de envios
-- -----------------------------------------------------------------------------
create table public.report_links (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid not null references public.inspections (id) on delete cascade,
  token          text not null unique check (char_length(token) >= 40),
  created_by     uuid references public.profiles (id) default auth.uid(),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '30 days',
  revoked_at     timestamptz,
  revoked_by     uuid references public.profiles (id)
);

comment on table public.report_links is 'Links públicos do laudo (token aleatório, validade de 30 dias, revogável).';
create index report_links_inspection_idx on public.report_links (inspection_id, created_at desc);

create table public.report_deliveries (
  id             uuid primary key default gen_random_uuid(),
  inspection_id  uuid not null references public.inspections (id) on delete cascade,
  link_id        uuid not null references public.report_links (id) on delete cascade,
  channel        text not null default 'whatsapp' check (channel in ('whatsapp')),
  sent_by        uuid references public.profiles (id) default auth.uid(),
  sent_by_name   text,
  sent_at        timestamptz not null default now()
);

comment on table public.report_deliveries is 'Envios do laudo ao cliente (quem enviou e quando).';
create index report_deliveries_inspection_idx on public.report_deliveries (inspection_id, sent_at desc);

alter table public.report_links enable row level security;
alter table public.report_deliveries enable row level security;
revoke all on table public.report_links, public.report_deliveries from anon, public;
grant select on public.report_links, public.report_deliveries to authenticated;
revoke insert, update, delete on public.report_links, public.report_deliveries from authenticated;

create policy "Funcionários consultam links do laudo"
  on public.report_links for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários consultam envios do laudo"
  on public.report_deliveries for select to authenticated
  using ((select public.is_staff()));

-- Chave do servidor: só a rota do servidor (que a conhece) lê o laudo público.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_secrets (
  name   text primary key,
  value  text not null
);
alter table private.app_secrets enable row level security;
insert into private.app_secrets (name, value)
values ('report_server_key', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

create or replace function public.new_report_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', '-_');
$$;

-- Devolve o link ativo da inspeção finalizada, criando um se ainda não existir.
create or replace function public.get_or_create_report_link(p_inspection_id uuid)
returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_link public.report_links%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from public.inspections i where i.id = p_inspection_id and i.status = 'finalized') then
    raise exception 'O laudo só pode ser enviado depois de finalizar a inspeção.' using errcode = 'check_violation';
  end if;

  select * into v_link from public.report_links l
   where l.inspection_id = p_inspection_id and l.revoked_at is null and l.expires_at > now()
   order by l.created_at desc limit 1;

  if not found then
    insert into public.report_links (inspection_id, token)
    values (p_inspection_id, public.new_report_token())
    returning * into v_link;
    perform public.write_audit('report.link_created', 'inspection', p_inspection_id,
      jsonb_build_object('expires_at', v_link.expires_at));
  end if;

  return query select v_link.token, v_link.expires_at;
end;
$$;

create or replace function public.revoke_report_link(p_inspection_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;
  update public.report_links set revoked_at = now(), revoked_by = auth.uid()
   where inspection_id = p_inspection_id and revoked_at is null;
  get diagnostics v_count = row_count;
  if v_count > 0 then
    perform public.write_audit('report.link_revoked', 'inspection', p_inspection_id, '{}'::jsonb);
  end if;
  return v_count;
end;
$$;

-- Registra o envio pelo WhatsApp (quem enviou e quando) na tabela e na auditoria.
create or replace function public.register_report_delivery(p_inspection_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_link_id uuid;
  v_name text;
  v_sent timestamptz := now();
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;
  select l.id into v_link_id from public.report_links l
   where l.inspection_id = p_inspection_id and l.revoked_at is null and l.expires_at > now()
   order by l.created_at desc limit 1;
  if v_link_id is null then
    raise exception 'Gere o link do laudo antes de enviar.' using errcode = 'check_violation';
  end if;
  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.report_deliveries (inspection_id, link_id, sent_by_name, sent_at)
  values (p_inspection_id, v_link_id, v_name, v_sent);
  perform public.write_audit('report.sent', 'inspection', p_inspection_id,
    jsonb_build_object('channel', 'whatsapp'));
  return v_sent;
end;
$$;

-- Leitura pública do laudo, chamada pela rota do servidor (exige a chave do servidor).
-- Devolve só o necessário: documento mascarado, sem telefone e sem WhatsApp.
create or replace function public.public_report(p_token text, p_server_key text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_link public.report_links%rowtype;
  v_insp public.inspections%rowtype;
  v_doc text;
begin
  if p_server_key is null
     or p_server_key <> (select value from private.app_secrets where name = 'report_server_key') then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;
  if p_token is null or char_length(p_token) < 40 then
    return null;
  end if;

  select * into v_link from public.report_links l
   where l.token = p_token and l.revoked_at is null and l.expires_at > now();
  if not found then
    return null;
  end if;

  select * into v_insp from public.inspections i where i.id = v_link.inspection_id and i.status = 'finalized';
  if not found then
    return null;
  end if;

  v_doc := v_insp.owner_document;

  return jsonb_build_object(
    'number', v_insp.number,
    'plate', v_insp.plate,
    'brand', v_insp.brand,
    'model', v_insp.model,
    'year', v_insp.year,
    'color', v_insp.color,
    'mileage', v_insp.mileage,
    'fuel_level', v_insp.fuel_level,
    'started_at', v_insp.started_at,
    'finalized_at', v_insp.finalized_at,
    'owner_name', v_insp.owner_name,
    'owner_document_masked', case
      when v_doc is null then null
      when char_length(v_doc) = 11 then '***.' || substr(v_doc, 4, 3) || '.' || substr(v_doc, 7, 3) || '-**'
      else '**.' || substr(v_doc, 3, 3) || '.' || substr(v_doc, 6, 3) || '/' || substr(v_doc, 9, 4) || '-**'
    end,
    'service_request', v_insp.service_request,
    'notes', v_insp.notes,
    'inspector_name', v_insp.inspector_name,
    'mechanic_name', v_insp.mechanic_name,
    'expires_at', v_link.expires_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_key', it.item_key, 'item_label', it.item_label, 'group_name', it.group_name,
               'position', it.position, 'status', it.status, 'notes', it.notes) order by it.position)
      from public.inspection_items it
      where it.inspection_id = v_insp.id
        and (it.status is not null or exists (select 1 from public.checklist_items c where c.key = it.item_key and c.active))
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'category', p.category, 'item_key', p.item_key,
               'storage_path', p.storage_path, 'caption', p.caption, 'mime_type', p.mime_type) order by p.created_at)
      from public.inspection_photos p
      where p.inspection_id = v_insp.id
    ), '[]'::jsonb)
  );
end;
$$;

-- As fotos de um laudo compartilhado podem ser assinadas pela rota pública
-- (somente enquanto houver link ativo; o caminho só é revelado pelo laudo).
create or replace function public.report_photo_shared(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.report_links l
    join public.inspections i on i.id = l.inspection_id and i.status = 'finalized'
    where l.inspection_id = public.inspection_id_from_path(p_name)
      and l.revoked_at is null and l.expires_at > now()
  );
$$;

create policy "Laudo público: fotos de inspeções com link ativo"
  on storage.objects for select to anon
  using (bucket_id = 'inspection-photos' and public.report_photo_shared(name));

-- -----------------------------------------------------------------------------
-- 6. Senha provisória
-- -----------------------------------------------------------------------------
alter table public.profiles add column must_change_password boolean not null default false;
comment on column public.profiles.must_change_password is
  'Senha definida por um administrador: o funcionário troca a senha antes de usar o sistema.';

-- Quando a senha muda no Auth (troca feita pelo próprio funcionário), libera o acesso.
create or replace function public.clear_password_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set must_change_password = false
   where id = new.id and must_change_password;
  return new;
end;
$$;

create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row
  when (old.encrypted_password is distinct from new.encrypted_password)
  execute function public.clear_password_flag();

create or replace function public.admin_create_member(
  p_email text, p_password text, p_full_name text, p_role public.user_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem cadastrar funcionários.' using errcode = 'insufficient_privilege';
  end if;
  v_id := public.internal_create_auth_user(p_email, p_password, p_full_name, p_role);
  update public.profiles set must_change_password = true where id = v_id;
  perform public.write_audit('member.created', 'profiles', v_id, jsonb_build_object('role', p_role::text));
  return v_id;
end;
$$;

create or replace function public.admin_set_member_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Somente administradores podem redefinir senhas.' using errcode = 'insufficient_privilege';
  end if;
  perform public.validate_member_password(p_password);
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_user_id;
  if not found then
    raise exception 'Funcionário não encontrado.' using errcode = 'no_data_found';
  end if;
  -- Senha definida pelo administrador é provisória (o gatilho acima acabou de liberar; volta a exigir).
  update public.profiles set must_change_password = true where id = p_user_id;
  perform public.write_audit('member.password_reset', 'profiles', p_user_id, '{}'::jsonb);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. Ninguém altera a própria função nem se desativa (além da regra do último admin)
-- -----------------------------------------------------------------------------
create or replace function public.protect_self_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and old.id = auth.uid()
     and (new.role is distinct from old.role or new.active is distinct from old.active) then
    raise exception 'Você não pode alterar a sua própria função nem se desativar.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_self
  before update of role, active on public.profiles
  for each row execute function public.protect_self_profile();

-- -----------------------------------------------------------------------------
-- Permissões das funções
-- -----------------------------------------------------------------------------
revoke execute on function
  public.inspections_track_blank(), public.mark_inspection_not_blank(), public.cleanup_blank_drafts(),
  public.clear_password_flag(), public.protect_self_profile(), public.new_report_token(),
  public.report_photo_shared(text)
from public, anon, authenticated;

-- Usada pelo gatilho inspections_track_blank, que roda com a permissão de quem edita.
revoke execute on function public.inspection_row_has_data(public.inspections) from public, anon;

revoke execute on function
  public.get_or_create_report_link(uuid), public.revoke_report_link(uuid),
  public.register_report_delivery(uuid), public.public_report(text, text)
from public, anon;

grant execute on function
  public.get_or_create_report_link(uuid), public.revoke_report_link(uuid), public.register_report_delivery(uuid)
to authenticated;

-- A rota pública do servidor usa a chave anônima; a função exige a chave do servidor.
grant execute on function public.public_report(text, text) to anon, authenticated;

-- Necessária para a política de storage do laudo público (avaliada como anon).
grant execute on function public.report_photo_shared(text), public.inspection_id_from_path(text) to anon;
