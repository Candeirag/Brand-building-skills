-- Correção: na migração anterior o gatilho inspections_track_blank (que só deixa
-- is_blank ir de true para false) foi criado antes da marcação dos rascunhos
-- antigos e a bloqueou. Refaz a marcação com o gatilho suspenso.
alter table public.inspections disable trigger inspections_track_blank;

update public.inspections i set is_blank = true
 where i.status = 'draft'
   and not i.is_blank
   and not public.inspection_row_has_data(i)
   and not exists (select 1 from public.inspection_items it
                    where it.inspection_id = i.id and (it.status is not null or it.notes is not null))
   and not exists (select 1 from public.inspection_photos p where p.inspection_id = i.id);

alter table public.inspections enable trigger inspections_track_blank;
