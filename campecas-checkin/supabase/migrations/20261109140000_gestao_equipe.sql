-- =============================================================================
-- CAMPEÇAS CHECK-IN: gestão da equipe sem a chave de serviço
-- Administradores criam funcionários, redefinem senhas e bloqueiam o login de
-- quem foi desativado por funções do banco (verificam is_admin() por dentro).
-- O sistema deixa de depender da SUPABASE_SERVICE_ROLE_KEY no servidor.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.validate_member_password(p_password text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_password is null or char_length(p_password) < 8 or char_length(p_password) > 72
     or p_password !~ '[a-z]' or p_password !~ '[A-Z]' or p_password !~ '[0-9]' then
    raise exception 'A senha deve ter de 8 a 72 caracteres, com letra maiúscula, minúscula e número.'
      using errcode = 'check_violation';
  end if;
end;
$$;

-- Cria o usuário no Supabase Auth (login por e-mail e senha, e-mail já confirmado).
-- Interna: não é exposta pela API.
create or replace function public.internal_create_auth_user(
  p_email text, p_password text, p_full_name text, p_role public.user_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(p_email));
  v_name text := trim(p_full_name);
begin
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 254 then
    raise exception 'E-mail inválido.' using errcode = 'check_violation';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Informe o nome completo.' using errcode = 'check_violation';
  end if;
  perform public.validate_member_password(p_password);
  if exists (select 1 from auth.users u where lower(u.email) = v_email) then
    raise exception 'Já existe um usuário com este e-mail.' using errcode = 'unique_violation';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'role', p_role::text),
    jsonb_build_object('full_name', v_name), now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  return v_id;
end;
$$;

-- Tela Equipe: cadastrar funcionário (somente administradores).
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
  perform public.write_audit('member.created', 'profiles', v_id, jsonb_build_object('role', p_role::text));
  return v_id;
end;
$$;

-- Tela Equipe: redefinir a senha de um funcionário (somente administradores).
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
  perform public.write_audit('member.password_reset', 'profiles', p_user_id, '{}'::jsonb);
end;
$$;

-- Desativar um funcionário também bloqueia o login no Auth; reativar desbloqueia.
create or replace function public.sync_member_ban()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
     set banned_until = case when new.active then null else 'infinity'::timestamptz end
   where id = new.id;
  return new;
end;
$$;

create trigger profiles_sync_ban
  after update of active on public.profiles
  for each row
  when (old.active is distinct from new.active)
  execute function public.sync_member_ban();

revoke execute on function
  public.internal_create_auth_user(text, text, text, public.user_role),
  public.sync_member_ban()
from public, anon, authenticated;

revoke execute on function
  public.admin_create_member(text, text, text, public.user_role),
  public.admin_set_member_password(uuid, text),
  public.validate_member_password(text)
from public, anon;

grant execute on function
  public.admin_create_member(text, text, text, public.user_role),
  public.admin_set_member_password(uuid, text)
to authenticated;
