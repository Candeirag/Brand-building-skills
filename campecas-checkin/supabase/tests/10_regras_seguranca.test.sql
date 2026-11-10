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

-- Conta criada pela API pública (sem papel em app_metadata) nasce desativada
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  ('00000000-0000-0000-0000-00000000000e', 'estranho@exemplo.com', '{"full_name":"Pessoa Externa"}', '{"provider":"email"}');
select tests.ok((select not active from public.profiles where id = '00000000-0000-0000-0000-00000000000e'),
  'cadastro sem papel definido pelo administrador nasce desativado');
select tests.ok((select active from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'funcionário criado pela tela Equipe nasce ativo');

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
select tests.ok((select count(*) from public.inspection_items where inspection_id = '11111111-1111-1111-1111-111111111111') = 17,
  'checklist com os 17 itens ativos (sem o antigo item Combustível)');
select tests.ok((select is_blank from public.inspections where id = '11111111-1111-1111-1111-111111111111'),
  'rascunho recém-criado sem dados é vazio');

update public.inspections set status = 'finalized', number = 'X'
where id = '11111111-1111-1111-1111-111111111111';
select tests.ok((select status from public.inspections where id = '11111111-1111-1111-1111-111111111111') = 'draft',
  'status não pode ser alterado diretamente');

update public.inspections set
  plate = 'ABC1D23', brand = 'Volkswagen', model = 'Gol 1.0', year = 2019, color = 'Prata',
  mileage = 85432, fuel_level = 'half', owner_name = 'Carlos da Silva', owner_document = '52998224725',
  owner_phone = '11987654321', inspector_name = 'Ana Recepção'
where id = '11111111-1111-1111-1111-111111111111';
select tests.ok((select not is_blank from public.inspections where id = '11111111-1111-1111-1111-111111111111'),
  'rascunho com dados deixa de ser vazio');

select tests.throws($$update public.inspections set plate = 'abc-1234' where id = '11111111-1111-1111-1111-111111111111'$$,
  'check constraint', 'placa inválida é rejeitada');

select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'Pendências', 'finalização bloqueada com pendências');

update public.inspection_items set status = 'ok' where inspection_id = '11111111-1111-1111-1111-111111111111';
update public.inspection_items set status = 'damaged'
where inspection_id = '11111111-1111-1111-1111-111111111111' and item_key = 'front_bumper';

select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  '1 avaria sem descrição', 'avaria exige descrição (com concordância)');

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

-- Novas exigências: serviço solicitado e fotos obrigatórias
select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'serviço solicitado', 'serviço solicitado é obrigatório');
select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'foto do painel com a quilometragem', 'foto do painel é obrigatória');
select tests.throws($$select public.finalize_inspection('11111111-1111-1111-1111-111111111111')$$,
  'foto da avaria: Para-choque dianteiro', 'cada avaria exige foto');
update public.inspections set service_request = 'Revisão dos freios e ruído na suspensão'
where id = '11111111-1111-1111-1111-111111111111';
insert into public.inspection_photos (inspection_id, category, storage_path)
values ('11111111-1111-1111-1111-111111111111', 'dashboard', '11111111-1111-1111-1111-111111111111/dashboard/b.jpg');
insert into storage.objects (bucket_id, name)
values ('inspection-photos', '11111111-1111-1111-1111-111111111111/damage/c.jpg');
insert into public.inspection_photos (inspection_id, category, item_key, storage_path)
values ('11111111-1111-1111-1111-111111111111', 'damage', 'front_bumper', '11111111-1111-1111-1111-111111111111/damage/c.jpg');

-- Finalização
select tests.ok((select number from public.finalize_inspection('11111111-1111-1111-1111-111111111111'))
  ~ '^MC[0-9]{4}-000001$', 'finalização gera número único sequencial');

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

-- Gestão da equipe pelo banco (sem chave de serviço)
select tests.ok(public.admin_create_member('Novo.Mecanico@Campecas.com.br', 'Oficina2026', 'Pedro Novo', 'mechanic') is not null,
  'administrador cadastra funcionário pelo banco');
select tests.ok((select active and role = 'mechanic' from public.profiles where email = 'novo.mecanico@campecas.com.br'),
  'funcionário cadastrado nasce ativo com a função escolhida');
reset role;
select tests.ok(exists(select 1 from auth.identities i join auth.users u on u.id = i.user_id
  where u.email = 'novo.mecanico@campecas.com.br' and i.provider = 'email'), 'identidade de login por e-mail criada');
set role authenticated;
select tests.throws($$select public.admin_create_member('novo.mecanico@campecas.com.br', 'Oficina2026', 'Outro', 'inspector')$$,
  'Já existe', 'e-mail duplicado é recusado');
select tests.throws($$select public.admin_create_member('x@campecas.com.br', 'fraca', 'Senha Fraca', 'inspector')$$,
  'A senha deve', 'senha fraca é recusada');
reset role;
select tests.ok((select encrypted_password from auth.users where email = 'novo.mecanico@campecas.com.br')
  = extensions.crypt('Oficina2026', (select encrypted_password from auth.users where email = 'novo.mecanico@campecas.com.br')),
  'senha gravada com hash bcrypt');
set role authenticated;
select public.admin_set_member_password((select id from public.profiles where email = 'novo.mecanico@campecas.com.br'), 'NovaSenha2026');
reset role;
select tests.ok((select encrypted_password from auth.users where email = 'novo.mecanico@campecas.com.br')
  = extensions.crypt('NovaSenha2026', (select encrypted_password from auth.users where email = 'novo.mecanico@campecas.com.br')),
  'administrador redefine a senha');
set role authenticated;
update public.profiles set active = false where email = 'novo.mecanico@campecas.com.br';
reset role;
select tests.ok((select banned_until = 'infinity' from auth.users where email = 'novo.mecanico@campecas.com.br'),
  'desativar bloqueia o login no Auth');
set role authenticated;
update public.profiles set active = true where email = 'novo.mecanico@campecas.com.br';
reset role;
select tests.ok((select banned_until is null from auth.users where email = 'novo.mecanico@campecas.com.br'),
  'reativar desbloqueia o login');
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
select tests.throws($$select public.admin_create_member('y@campecas.com.br', 'Oficina2026', 'Intruso', 'admin')$$,
  'Somente administradores', 'funcionário comum não cadastra contas');
select tests.throws($$select public.admin_set_member_password('00000000-0000-0000-0000-00000000000a', 'Oficina2026')$$,
  'Somente administradores', 'funcionário comum não redefine senhas');
select tests.throws($$select public.internal_create_auth_user('z@campecas.com.br', 'Oficina2026', 'Z Z', 'admin')$$,
  'permission denied', 'função interna de criação não é exposta');
select tests.as_user('00000000-0000-0000-0000-00000000000a');

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
  owner_name = 'Maria Souza', owner_whatsapp = '11912345678', mechanic_name = 'João', checklist_confirmed = true,
  service_request = 'Troca de óleo', owner_document = '11222333000181'
where id = '33333333-3333-3333-3333-333333333333';
insert into public.inspection_photos (inspection_id, category, storage_path) values
  ('33333333-3333-3333-3333-333333333333', 'front', '33333333-3333-3333-3333-333333333333/front/a.jpg'),
  ('33333333-3333-3333-3333-333333333333', 'dashboard', '33333333-3333-3333-3333-333333333333/dashboard/b.jpg');
update public.inspection_items set status = 'not_applicable' where inspection_id = '33333333-3333-3333-3333-333333333333';
select tests.ok((select number from public.finalize_inspection('33333333-3333-3333-3333-333333333333'))
  ~ '-000002$', 'segunda inspeção recebe o próximo número');
select tests.ok((select count(*) from public.vehicles where plate = 'ABC1D23') = 1, 'veículo não é duplicado');
select tests.ok((select last_mileage from public.vehicles where plate = 'ABC1D23') = 90000, 'quilometragem atualizada');
reset role;

-- Laudo público por link -------------------------------------------------------
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
select tests.throws($$select * from public.get_or_create_report_link('22222222-2222-2222-2222-222222222222')$$,
  null, 'link não é gerado para inspeção inexistente ou rascunho');
create temp table t_link as select token from public.get_or_create_report_link('11111111-1111-1111-1111-111111111111');
create temp table t_link3 as select token from public.get_or_create_report_link('33333333-3333-3333-3333-333333333333');
select tests.ok((select char_length(token) >= 40 from t_link), 'token aleatório e longo');
select tests.ok((select token from public.get_or_create_report_link('11111111-1111-1111-1111-111111111111'))
  = (select token from t_link), 'o mesmo link é reaproveitado enquanto válido');
select tests.ok((select expires_at between now() + interval '29 days' and now() + interval '31 days'
  from public.report_links where token = (select token from t_link)), 'validade de 30 dias');
select tests.ok(public.register_report_delivery('11111111-1111-1111-1111-111111111111') is not null,
  'envio pelo WhatsApp registrado');
select tests.ok((select sent_by_name from public.report_deliveries
  where inspection_id = '11111111-1111-1111-1111-111111111111') = 'Ana Recepção', 'registro guarda quem enviou');
reset role;
select tests.ok(exists(select 1 from public.audit_log where action = 'report.sent'), 'envio fica na auditoria');
create temp table t_key as select value as k from private.app_secrets where name = 'report_server_key';
grant select on t_link, t_link3, t_key to anon, authenticated;

set role anon;
select tests.throws('select * from public.report_links', 'permission denied', 'anon não lê a tabela de links');
select tests.throws($$select public.public_report((select token from t_link), 'chave-errada')$$,
  'Acesso negado', 'leitura pública exige a chave do servidor');
select tests.ok((select public.public_report((select token from t_link), (select k from t_key)) ->> 'number')
  ~ '^MC[0-9]{4}-000001$', 'rota do servidor lê o laudo com token válido');
select tests.ok((select public.public_report((select token from t_link3), (select k from t_key)) ->> 'owner_document_masked')
  = '**.222.333/0001-**', 'documento sai mascarado');
select tests.ok(not (public.public_report((select token from t_link), (select k from t_key)) ? 'owner_phone')
  and not (public.public_report((select token from t_link), (select k from t_key)) ? 'owner_whatsapp'),
  'telefone e WhatsApp não saem no laudo público');
select tests.ok(public.public_report('token-inexistente-0000000000000000000000000000', (select k from t_key)) is null,
  'token inválido não abre nada');
select tests.ok(exists(select 1 from storage.objects where name = '11111111-1111-1111-1111-111111111111/damage/c.jpg'),
  'foto do laudo compartilhado pode ser assinada');
reset role;
insert into storage.objects (bucket_id, name)
values ('inspection-photos', '22222222-2222-2222-2222-222222222222/front/a.jpg');
set role anon;
select tests.ok(not exists(select 1 from storage.objects where name like '22222222-2222-2222-2222-222222222222/%'),
  'fotos de inspeção sem link continuam fechadas');
reset role;

set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
select tests.ok(public.revoke_report_link('11111111-1111-1111-1111-111111111111') = 1, 'link revogado');
reset role;
set role anon;
select tests.ok(public.public_report((select token from t_link), (select k from t_key)) is null,
  'link revogado não abre mais');
select tests.ok(not exists(select 1 from storage.objects where name like '11111111-1111-1111-1111-111111111111/%'),
  'fotos deixam de ser acessíveis após revogar');
reset role;

-- Rascunhos vazios ---------------------------------------------------------------
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.inspections (id) values ('44444444-4444-4444-4444-444444444444');
insert into public.inspections (id) values ('55555555-5555-5555-5555-555555555555');
update public.inspection_items set status = 'ok'
where inspection_id = '55555555-5555-5555-5555-555555555555' and item_key = 'hood';
select tests.ok((select not is_blank from public.inspections where id = '55555555-5555-5555-5555-555555555555'),
  'resposta no checklist conta como dado');
select tests.ok((select count(*) from public.inspections where status = 'draft' and not is_blank) = 1,
  'rascunho vazio não conta em "Em andamento"');
update public.inspections set is_blank = true where id = '55555555-5555-5555-5555-555555555555';
select tests.ok((select not is_blank from public.inspections where id = '55555555-5555-5555-5555-555555555555'),
  'rascunho preenchido não volta a ser vazio');
reset role;
select set_config('campecas.finalizing', 'on', false);
update public.inspections set started_at = now() - interval '25 hours'
where id in ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555');
select set_config('campecas.finalizing', 'off', false);
select tests.ok(public.cleanup_blank_drafts() = 1, 'limpeza apaga só o rascunho vazio com mais de 24 h');
select tests.ok(exists(select 1 from public.inspections where id = '55555555-5555-5555-5555-555555555555')
  and not exists(select 1 from public.inspections where id = '44444444-4444-4444-4444-444444444444'),
  'rascunho com dados é preservado');
set role authenticated;
select tests.throws('select public.cleanup_blank_drafts()', 'permission denied', 'limpeza não é chamável pela API');
reset role;

-- Senha provisória e autoproteção -------------------------------------------------
select tests.ok((select must_change_password from public.profiles where email = 'novo.mecanico@campecas.com.br'),
  'senha definida pelo administrador é provisória');
update auth.users set encrypted_password = extensions.crypt('MinhaSenha2026', extensions.gen_salt('bf'))
where email = 'novo.mecanico@campecas.com.br';
select tests.ok((select not must_change_password from public.profiles where email = 'novo.mecanico@campecas.com.br'),
  'trocar a senha libera o acesso');
update public.profiles set active = true where id = '00000000-0000-0000-0000-00000000000d';
set role authenticated;
select tests.as_user('00000000-0000-0000-0000-00000000000a');
select tests.throws($$update public.profiles set role = 'inspector' where id = '00000000-0000-0000-0000-00000000000a'$$,
  'própria função', 'administrador não altera a própria função');
select tests.throws($$update public.profiles set active = false where id = '00000000-0000-0000-0000-00000000000a'$$,
  'própria função', 'administrador não se desativa');
update public.profiles set role = 'inspector' where id = '00000000-0000-0000-0000-00000000000d';
select tests.ok((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000d') = 'inspector',
  'administrador altera a função de outro funcionário');
reset role;

\echo 'Todos os testes do banco passaram.'
