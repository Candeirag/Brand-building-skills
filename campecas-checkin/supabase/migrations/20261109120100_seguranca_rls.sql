-- =============================================================================
-- CAMPEÇAS CHECK-IN — Segurança: privilégios e Row Level Security
-- Princípio do menor privilégio: o papel "anon" não acessa nenhum dado;
-- somente funcionários autenticados e ATIVOS (public.is_staff()) operam.
-- =============================================================================

-- Privilégios ---------------------------------------------------------------
revoke all on table
  public.profiles, public.customers, public.vehicles, public.checklist_items,
  public.inspections, public.inspection_items, public.inspection_photos, public.audit_log
from anon, public;

revoke all on sequence public.inspection_number_seq from anon, authenticated, public;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;
grant select, insert, update, delete on public.inspections to authenticated;
grant select, insert, update, delete on public.inspection_items to authenticated;
grant select, insert, update, delete on public.inspection_photos to authenticated;
grant select on public.audit_log to authenticated;
revoke insert, update, delete on public.audit_log from authenticated;

-- Funções: somente usuários autenticados podem executar as expostas via API.
revoke execute on function
  public.is_staff(), public.is_admin(), public.inspection_is_draft(uuid),
  public.finalize_inspection(uuid), public.anonymize_customer(uuid),
  public.write_audit(text, text, uuid, jsonb),
  public.handle_new_user(), public.handle_user_email_change(), public.protect_last_admin(),
  public.inspections_before_insert(), public.inspections_after_insert(),
  public.inspections_guard(), public.inspection_children_guard(),
  public.audit_row_change(), public.audit_inspection_delete(), public.set_updated_at()
from public, anon;

revoke execute on function public.write_audit(text, text, uuid, jsonb) from authenticated;

grant execute on function
  public.is_staff(), public.is_admin(), public.inspection_is_draft(uuid),
  public.finalize_inspection(uuid), public.anonymize_customer(uuid)
to authenticated;

-- RLS -------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.customers         enable row level security;
alter table public.vehicles          enable row level security;
alter table public.checklist_items   enable row level security;
alter table public.inspections       enable row level security;
alter table public.inspection_items  enable row level security;
alter table public.inspection_photos enable row level security;
alter table public.audit_log         enable row level security;

-- Perfis
create policy "Funcionários veem a equipe; cada um vê o próprio perfil"
  on public.profiles for select to authenticated
  using ((select public.is_staff()) or id = (select auth.uid()));

create policy "Administradores gerenciam perfis"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Clientes
create policy "Funcionários consultam clientes"
  on public.customers for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários cadastram clientes"
  on public.customers for insert to authenticated
  with check ((select public.is_staff()));

create policy "Funcionários atualizam clientes não anonimizados"
  on public.customers for update to authenticated
  using ((select public.is_staff()) and anonymized_at is null)
  with check ((select public.is_staff()) and anonymized_at is null);

create policy "Administradores excluem clientes"
  on public.customers for delete to authenticated
  using ((select public.is_admin()));

-- Veículos
create policy "Funcionários consultam veículos"
  on public.vehicles for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários cadastram veículos"
  on public.vehicles for insert to authenticated
  with check ((select public.is_staff()));

create policy "Funcionários atualizam veículos"
  on public.vehicles for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Administradores excluem veículos"
  on public.vehicles for delete to authenticated
  using ((select public.is_admin()));

-- Catálogo do checklist
create policy "Funcionários consultam o catálogo"
  on public.checklist_items for select to authenticated
  using ((select public.is_staff()));

create policy "Administradores incluem itens no catálogo"
  on public.checklist_items for insert to authenticated
  with check ((select public.is_admin()));

create policy "Administradores alteram o catálogo"
  on public.checklist_items for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Administradores removem itens do catálogo"
  on public.checklist_items for delete to authenticated
  using ((select public.is_admin()));

-- Inspeções
create policy "Funcionários consultam inspeções"
  on public.inspections for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários iniciam inspeções"
  on public.inspections for insert to authenticated
  with check ((select public.is_staff()) and inspector_id = (select auth.uid()));

create policy "Funcionários editam rascunhos"
  on public.inspections for update to authenticated
  using ((select public.is_staff()) and status = 'draft')
  with check ((select public.is_staff()) and status = 'draft');

create policy "Autor ou administrador exclui rascunho"
  on public.inspections for delete to authenticated
  using (
    (select public.is_staff()) and status = 'draft'
    and (inspector_id = (select auth.uid()) or (select public.is_admin()))
  );

-- Itens do checklist
create policy "Funcionários consultam itens"
  on public.inspection_items for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários incluem itens em rascunhos"
  on public.inspection_items for insert to authenticated
  with check ((select public.is_staff()) and public.inspection_is_draft(inspection_id));

create policy "Funcionários atualizam itens de rascunhos"
  on public.inspection_items for update to authenticated
  using ((select public.is_staff()) and public.inspection_is_draft(inspection_id))
  with check ((select public.is_staff()) and public.inspection_is_draft(inspection_id));

create policy "Funcionários removem itens de rascunhos"
  on public.inspection_items for delete to authenticated
  using ((select public.is_staff()) and public.inspection_is_draft(inspection_id));

-- Fotografias
create policy "Funcionários consultam fotos"
  on public.inspection_photos for select to authenticated
  using ((select public.is_staff()));

create policy "Funcionários anexam fotos a rascunhos"
  on public.inspection_photos for insert to authenticated
  with check (
    (select public.is_staff())
    and public.inspection_is_draft(inspection_id)
    and created_by = (select auth.uid())
  );

create policy "Funcionários editam legendas de rascunhos"
  on public.inspection_photos for update to authenticated
  using ((select public.is_staff()) and public.inspection_is_draft(inspection_id))
  with check ((select public.is_staff()) and public.inspection_is_draft(inspection_id));

create policy "Funcionários removem fotos de rascunhos"
  on public.inspection_photos for delete to authenticated
  using ((select public.is_staff()) and public.inspection_is_draft(inspection_id));

-- Auditoria
create policy "Administradores consultam a auditoria"
  on public.audit_log for select to authenticated
  using ((select public.is_admin()));
