insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('brand-logos','brand-logos',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('portfolio-images','portfolio-images',false,5242880,array['image/jpeg','image/png','image/webp'])
 on conflict(id) do nothing;
create policy media_read on storage.objects for select to authenticated using(
 public.active_role() is not null and bucket_id in ('avatars','brand-logos','portfolio-images')
 and (public.creator_visible((storage.foldername(name))[1]::uuid) or public.is_admin())
);
create policy media_insert on storage.objects for insert to authenticated with check(
 public.active_role() in ('CREATOR','BRAND') and bucket_id in ('avatars','brand-logos','portfolio-images') and (storage.foldername(name))[1]=auth.uid()::text
);
create policy media_delete on storage.objects for delete to authenticated using(
 public.active_role() is not null and bucket_id in ('avatars','brand-logos','portfolio-images') and (storage.foldername(name))[1]=auth.uid()::text
);
