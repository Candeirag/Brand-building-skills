-- Funções de gatilho e de auditoria não devem ser chamáveis pela API
-- (o Supabase concede EXECUTE a "authenticated" por padrão nas funções do schema public).
revoke execute on function
  public.handle_new_user(), public.handle_user_email_change(), public.protect_last_admin(),
  public.inspections_before_insert(), public.inspections_after_insert(),
  public.inspections_guard(), public.inspection_children_guard(),
  public.audit_row_change(), public.audit_inspection_delete(), public.set_updated_at(),
  public.write_audit(text, text, uuid, jsonb)
from authenticated;
