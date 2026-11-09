-- =============================================================================
-- Testes das regras de negócio e segurança do banco (RLS, imutabilidade,
-- finalização, storage, LGPD). Executado por scripts/test-db.sh.
-- Qualquer falha interrompe a execução com erro.
-- =============================================================================
\set ON_ERROR_STOP on
set client_min_messages = warning;

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FALHOU: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

create function tests.throws(stmt text, expected text, msg text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if expected is null or sqlerrm ilike '%' || expected || '%' then
      raise notice 'ok - % (erro: %)', msg, sqlerrm;
      return;
    end if;
    raise exception 'FALHOU: % — erro inesperado: %', msg, sqlerrm;
  end;
  raise exception 'FALHOU: % — era esperado um erro', msg;
end $$;

create function tests.as_user(p_id uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p_id::text, ''), false);
end $$;

grant execute on all functions in schema tests to anon, authenticated;
set client_min_messages = notice;

-- Usuários --------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'gerente@campecas.com.br', '{"full_name":"Gerente Campeças"}');
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  ('00000000-0000-0000-0000-00000000000b', 'recepcao@campecas.com.br', '{"full_name":"Ana Recepção"}', '{"role":"inspector"}'),
  ('00000000-0000-0000-0000-00000000000c', 'mecanico@campecas.com.br', '{"full_name":"João Mecânico"}', '{"role":"mechanic"}'),
  ('00000000-0000-0000-0000-00000000000d', 'ex@campecas.com.br', '{"full_name":"Ex Funcionário"}', '{"role":"admin"}');
update public.profiles set active = false where id = '00000000-0000-0000-0000-00000000000d';

select tests.ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'admin',
  'primeiro usuário criado torna-se administrador');
select tests.ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000c') = 'mechanic',
  'papel lido do app_metadata');

-- Anônimo ---------------------------------------------------------------------
set role anon;
select tests.throws('select * from public.inspections', 'permission denied', 'anon não lê inspeções');
select tests.throws('select * from public.customers', 'permission denied', 'anon não lê clientes');
select tests.throws('select public.finalize_inspection(gen_random_uuid())', 'permission denied', 'anon não executa finalização');
reset role;

-- Funcionário cria rascunho ---------------------------------------------------
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');

insert into public.inspections (id, status, number, inspector_id)
values ('11111111-1111-1111-1111-111111111111', 'finalized', 'FORJADO', '00000000-0000-0000-0000-00000000000a');

select tests.ok((select status from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 'draft',
  'inserção sempre cria rascunho');
select tests.ok((select number from public.inspections where id = '11111111-1111-1111-1111-111111111111') is null,
  'número não pode ser forjado no insert');
select tests.ok((select inspector_id from public.inspections where id = '11111111-1111-1111-1111-111111111111')
  = '00000000-0000-0000-0000-00000000000b', 'responsável é o usuário autenticado');
select tests.ok((select inspector_name from public.inspections where id = '11111111-1111-1111-1111-111111111111')
  = 'Ana Recepção', 'nome do funcionário preenchido automaticamente');
select tests.ok((select count(*) from public.inspection_items where inspection_id = '11111111-1111-1111-1111-111111111111') = 18,
  'checklist com 18 itens criado a partir do catálogo');

update public.inspections set status = 'finalized', number = 'X'
where id = '11111111-1111-1111-1111-111111111111';
select tests.ok((select status from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 'draft',
  'status não pode ser alterado diretamente');

update public.inspections set
  plate = 'ABC1D23', brand = 'Volkswagen', model = 'Gol 1.0', year = 2019, color = 'Prata',
  mileage = 85432, fuel_level = 'half', owner_name = 'Carlos da Silva', owner_document = '52998224725',
  owner_phone = '11987654321', inspector_name = 'Ana Recepção'
where id = '11111111-1111-1111-1111-111111111111';

select tests.throws($$update public.inspections set plate = 'abc-1234' where id = '11111111-1111-1111-1111-111111111111'$$,
  'check constraint', 'placa inválida é rejeitada');

select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'Pendências', 'finalização bloqueada com pendências');

update public.inspection_items set status = 'ok' where inspection_id = '11111111-1111-1111-1111-111111111111';
update public.inspection_items set status = 'damaged'
where inspection_id = '11111111-1111-1111-1111-111111111111' and item_key = 'front_bumper';

select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'avaria(s) sem descrição', 'avaria exige descrição');

update public.inspection_items set notes = 'Risco profundo lado direito'
where inspection_id = '11111111-1111-1111-1111-111111111111' and item_key = 'front_bumper';
update public.inspections set mechanic_name = 'João Mecânico', checklist_confirmed = true
where id = '11111111-1111-1111-1111-111111111111';

-- Storage em rascunho
insert into storage.objects (bucket_id, name)
values ('inspection-photos', '11111111-1111-1111-1111-111111111111/front/a.jpg');
insert into public.inspection_photos (inspection_id, category, storage_path)
values ('11111111-1111-1111-1111-111111111111', 'front', '11111111-1111-1111-1111-111111111111/front/a.jpg');
select tests.ok(true, 'upload e registro de foto em rascunho');

select tests.throws($$insert into public.inspection_photos (inspection_id, category, storage_path)
  values ('11111111-1111-1111-1111-111111111111', 'front', 'outra/front/a.jpg')$$,
  'check constraint', 'caminho da foto deve pertencer à inspeção');

select tests.throws($$insert into storage.objects (bucket_id, name) values ('inspection-photos', 'qualquer/coisa.jpg')$$,
  'row-level security', 'upload fora de uma inspeção é bloqueado');

-- Finalização
select tests.ok((select number from public.finalize_inspection('11111111-1111-1111-1111-111111111111'))
  ~ '^CP[0-9]{4}-000001$', 'finalização gera número único sequencial');

select tests.ok((select status from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 'finalized',
  'inspeção finalizada');
select tests.ok((select finalized_by from public.inspections where id = '11111111-1111-1111-1111-111111111111')
  = '00000000-0000-0000-0000-00000000000b', 'responsável pela finalização registrado');
select tests.ok(exists(select 1 from public.vehicles where plate = 'ABC1D23' and last_mileage = 85432),
  'veículo cadastrado/atualizado na finalização');
select tests.ok(exists(select 1 from public.customers where document = '52998224725' and phone = '11987654321'),
  'cliente cadastrado na finalização');

select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'já foi finalizada', 'não é possível finalizar duas vezes');

-- Imutabilidade
update public.inspections set mileage = 1 where id = '11111111-1111-1111-1111-111111111111';
select tests.ok((select mileage from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 85432,
  'funcionário não altera inspeção finalizada');
delete from public.inspections where id = '11111111-1111-1111-1111-111111111111';
select tests.ok(exists(select 1 from public.inspections where id = '11111111-1111-1111-1111-111111111111'),
  'funcionário não exclui inspeção finalizada');
update public.inspection_items set status = 'ok'
where inspection_id = '11111111-1111-1111-1111-111111111111' and item_key = 'front_bumper';
select tests.ok((select status from public.inspection_items where inspection_id = '11111111-1111-1111-1111-111111111111'
  and item_key = 'front_bumper') = 'damaged', 'checklist finalizado não muda');
select tests.throws($$insert into storage.objects (bucket_id, name)
  values ('inspection-photos', '11111111-1111-1111-1111-111111111111/extra/b.jpg')$$,
  'row-level security', 'não envia fotos para inspeção finalizada');
delete from storage.objects where name = '11111111-1111-1111-1111-111111111111/front/a.jpg';
select tests.ok(exists(select 1 from storage.objects where name = '11111111-1111-1111-1111-111111111111/front/a.jpg'),
  'não remove fotos de inspeção finalizada');

select tests.ok((select count(*) from public.audit_log) = 0, 'funcionário não vê registros de auditoria');
reset role;

-- Nem mesmo o dono do banco altera finalizadas (gatilho)
select tests.throws($$update public.inspections set mileage = 1 where id = '11111111-1111-1111-1111-111111111111'$$,
  'não pode ser alterada', 'gatilho protege finalizada contra qualquer alteração');
select tests.throws($$delete from public.inspections where id = '11111111-1111-1111-1111-111111111111'$$,
  'não podem ser excluídas', 'gatilho impede exclusão de finalizada');

-- Funcionário inativo -----------------------------------------------------------
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000d');
select tests.ok((select count(*) from public.inspections) = 0, 'funcionário inativo não vê inspeções');
select tests.ok((select count(*) from public.profiles) = 1, 'funcionário inativo vê apenas o próprio perfil');
select tests.throws($$insert into public.inspections default values$$, 'row-level security',
  'funcionário inativo não cria inspeções');

-- Exclusão de rascunho ----------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000c');
insert into public.inspections (id) values ('22222222-2222-2222-2222-222222222222');
select tests.as_user('00000000-0000-0000-0000-00000000000b');
delete from public.inspections where id = '22222222-2222-2222-2222-222222222222';
select tests.ok(exists(select 1 from public.inspections where id = '22222222-2222-2222-2222-222222222222'),
  'funcionário não exclui rascunho de outro colega');
select tests.as_user('00000000-0000-0000-0000-00000000000c');
delete from public.inspections where id = '22222222-2222-2222-2222-222222222222';
select tests.ok(not exists(select 1 from public.inspections where id = '22222222-2222-2222-2222-222222222222'),
  'autor exclui o próprio rascunho (itens em cascata)');

-- Perfis e administração ------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000b');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000b';
select tests.ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'inspector',
  'funcionário não se promove a administrador');
select tests.throws($$select public.anonymize_customer((select id from public.customers limit 1))$$,
  'Somente administradores', 'funcionário não anonimiza clientes');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
select tests.throws($$update public.profiles set active = false where id = '00000000-0000-0000-0000-00000000000a'$$,
  'pelo menos um administrador', 'último administrador ativo é protegido');
select tests.ok((select count(*) from public.audit_log where action = 'inspection.finalized') = 1,
  'administrador consulta auditoria da finalização');

-- LGPD
select public.anonymize_customer((select id from public.customers where document = '52998224725'));
select tests.ok((select owner_name from public.inspections where id = '11111111-1111-1111-1111-111111111111')
  = 'Titular anonimizado', 'anonimização remove dados pessoais da inspeção finalizada');
select tests.ok((select owner_document is null and owner_phone is null from public.inspections
  where id = '11111111-1111-1111-1111-111111111111'), 'documento e telefone removidos');
select tests.ok((select mileage from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 85432,
  'dados técnicos preservados após anonimização');
select tests.ok(not exists(select 1 from public.customers where document = '52998224725'),
  'cadastro do cliente anonimizado');
reset role;

-- Segunda inspeção reaproveita veículo e gera próximo número
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.inspections (id) values ('33333333-3333-3333-3333-333333333333');
update public.inspections set plate = 'ABC1D23', brand = 'VW', model = 'Gol', mileage = 90000,
  owner_name = 'Maria Souza', owner_whatsapp = '11912345678', mechanic_name = 'João', checklist_confirmed = true
where id = '33333333-3333-3333-3333-333333333333';
update public.inspection_items set status = 'not_applicable' where inspection_id = '33333333-3333-3333-3333-333333333333';
select tests.ok((select number from public.finalize_inspection('33333333-3333-3333-3333-333333333333'))
  ~ '-000002$', 'segunda inspeção recebe o próximo número');
select tests.ok((select count(*) from public.vehicles where plate = 'ABC1D23') = 1, 'veículo não é duplicado');
select tests.ok((select last_mileage from public.vehicles where plate = 'ABC1D23') = 90000, 'quilometragem atualizada');
reset role;

\echo 'Todos os testes do banco passaram.'
