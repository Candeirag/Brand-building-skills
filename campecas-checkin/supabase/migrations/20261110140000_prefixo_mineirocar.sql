-- Nova identidade: a oficina passa a ser MINEIROCAR Auto Center.
-- O número das inspeções finalizadas passa de CPAAAA-NNNNNN para MCAAAA-NNNNNN.
-- Nada mais muda na função (mesmo corpo da migração 20261110120000). Números já
-- emitidos não são alterados.
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

  v_number := 'MC' || to_char(v_now at time zone 'America/Sao_Paulo', 'YYYY') || '-'
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
