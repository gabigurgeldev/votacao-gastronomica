-- =============================================================================
-- Storage: bucket 'dishes' para imagens de pratos (leitura pública)
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('dishes', 'dishes', true)
on conflict (id) do nothing;

-- Leitura pública
drop policy if exists "dish_images_public_read" on storage.objects;
create policy "dish_images_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'dishes');

-- Admin pode fazer upload/update/delete (upsert requer INSERT + SELECT + UPDATE)
drop policy if exists "dish_images_admin_insert" on storage.objects;
create policy "dish_images_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dishes' and public.is_admin());

drop policy if exists "dish_images_admin_update" on storage.objects;
create policy "dish_images_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'dishes' and public.is_admin())
  with check (bucket_id = 'dishes' and public.is_admin());

drop policy if exists "dish_images_admin_delete" on storage.objects;
create policy "dish_images_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dishes' and public.is_admin());
