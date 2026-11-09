-- =============================================================================
-- CAMPEÇAS CHECK-IN: contas criadas fora da tela Equipe nascem desativadas
-- Se o cadastro público do Supabase Auth estiver ligado, qualquer pessoa com a
-- chave pública poderia criar uma conta pela API. Essas contas não têm papel em
-- app_metadata (só a service role define esse campo), então ficam inativas até
-- um administrador liberar. O primeiro usuário do sistema continua sendo admin.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.user_role;
  v_name text;
  v_first boolean;
  v_assigned boolean;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'Funcionário'), '@', 1)
  );
  if char_length(v_name) < 2 then
    v_name := 'Funcionário';
  end if;

  v_first := not exists (select 1 from public.profiles);
  v_assigned := (new.raw_app_meta_data ? 'role');

  if v_first then
    v_role := 'admin';
  else
    begin
      v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'inspector');
    exception when invalid_text_representation then
      v_role := 'inspector';
    end;
  end if;

  insert into public.profiles (id, full_name, email, role, active)
  values (new.id, left(v_name, 120), new.email, v_role, v_first or v_assigned);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
