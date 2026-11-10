-- =============================================================================
-- CAMPEÇAS CHECK-IN — Armazenamento das fotografias (Supabase Storage)
-- Bucket PRIVADO: as imagens só são acessadas por URLs assinadas e temporárias.
-- Estrutura dos caminhos: {inspection_id}/{categoria}/{uuid}.jpg
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'inspection-photos',
  'inspection-photos',
  false,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Retorna o id da inspeção contido no caminho do arquivo, ou null se inválido.
create or replace function public.inspection_id_from_path(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

revoke execute on function public.inspection_id_from_path(text) from public, anon;
grant execute on function public.inspection_id_from_path(text) to authenticated;

create policy "Funcionários visualizam fotos de inspeção"
  on storage.objects for select to authenticated
  using (bucket_id = 'inspection-photos' and (select public.is_staff()));

create policy "Funcionários enviam fotos para rascunhos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'inspection-photos'
    and (select public.is_staff())
    and public.inspection_is_draft(public.inspection_id_from_path(name))
  );

create policy "Funcionários removem fotos de rascunhos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'inspection-photos'
    and (select public.is_staff())
    and public.inspection_is_draft(public.inspection_id_from_path(name))
  );

-- Não há política de UPDATE: arquivos enviados não podem ser sobrescritos.
