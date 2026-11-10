-- =============================================================================
-- Tempo no pátio: registro da saída do veículo.
-- O carro está no pátio desde a entrada (inspections.started_at) até a saída.
-- A saída fica numa tabela própria para que a inspeção finalizada continue
-- imutável (o laudo não muda). Só se registra saída de inspeção finalizada.
-- Gravação apenas pelas funções abaixo; leitura só para funcionários (RLS).
-- =============================================================================

create table public.yard_exits (
  inspection_id  uuid primary key references public.inspections (id) on delete cascade,
  exited_at      timestamptz not null default now(),
  exited_by      uuid references public.profiles (id) default auth.uid(),
  exited_by_name text
);

comment on table public.yard_exits is 'Saída do veículo do pátio (uma por inspeção). Sem registro = carro ainda no pátio.';

alter table public.yard_exits enable row level security;
revoke all on table public.yard_exits from anon, public;
grant select on public.yard_exits to authenticated;
revoke insert, update, delete on public.yard_exits from authenticated;

create policy "Funcionários consultam saídas do pátio"
  on public.yard_exits for select to authenticated
  using ((select public.is_staff()));

-- Registra a saída (quem e quando) e devolve a hora registrada.
create or replace function public.register_vehicle_exit(p_inspection_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_started timestamptz;
  v_status public.inspection_status;
  v_now timestamptz := now();
  v_name text;
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;

  select i.started_at, i.status into v_started, v_status
  from public.inspections i where i.id = p_inspection_id;
  if not found then
    raise exception 'Inspeção não encontrada.' using errcode = 'no_data_found';
  end if;
  if v_status <> 'finalized' then
    raise exception 'Finalize a inspeção antes de registrar a saída do veículo.' using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.yard_exits e where e.inspection_id = p_inspection_id) then
    raise exception 'A saída deste veículo já foi registrada.' using errcode = 'unique_violation';
  end if;

  select full_name into v_name from public.profiles where id = auth.uid();
  insert into public.yard_exits (inspection_id, exited_at, exited_by_name)
  values (p_inspection_id, v_now, v_name);

  perform public.write_audit('vehicle.exited', 'inspection', p_inspection_id,
    jsonb_build_object('minutes_in_yard', floor(extract(epoch from (v_now - v_started)) / 60)));
  return v_now;
end;
$$;

-- Desfaz uma saída registrada por engano (fica na auditoria).
create or replace function public.undo_vehicle_exit(p_inspection_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Acesso negado.' using errcode = 'insufficient_privilege';
  end if;
  delete from public.yard_exits where inspection_id = p_inspection_id;
  if not found then
    raise exception 'Não há saída registrada para este veículo.' using errcode = 'no_data_found';
  end if;
  perform public.write_audit('vehicle.exit_undone', 'inspection', p_inspection_id, '{}'::jsonb);
end;
$$;

revoke execute on function public.register_vehicle_exit(uuid), public.undo_vehicle_exit(uuid) from public, anon;
grant execute on function public.register_vehicle_exit(uuid), public.undo_vehicle_exit(uuid) to authenticated;
