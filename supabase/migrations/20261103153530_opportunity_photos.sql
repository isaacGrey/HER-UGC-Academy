alter table public.opportunities add column cover_path text, add column photo_1 text, add column photo_2 text, add column photo_3 text;
create function public.opportunity_feature_guard() returns trigger language plpgsql as $$
begin
 if new.status <> 'LIVE' then
   if new.featured and (tg_op = 'INSERT' or not old.featured) then raise exception 'Only approved live opportunities can be featured'; end if;
   new.featured := false;
 end if;
 return new;
end $$;
update public.opportunities set featured=false where status <> 'LIVE';
create trigger opportunity_feature_guard before insert or update on public.opportunities for each row execute function public.opportunity_feature_guard();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('opportunity-images','opportunity-images',false,5242880,array['image/jpeg','image/png','image/webp']);
create policy opportunity_media_read on storage.objects for select to authenticated using (
 bucket_id='opportunity-images' and public.active_role() is not null and (
 (storage.foldername(name))[1]=auth.uid()::text or public.is_admin() or
 exists(select 1 from public.opportunities o where name in (o.cover_path,o.photo_1,o.photo_2,o.photo_3))
 ));
create policy opportunity_media_insert on storage.objects for insert to authenticated with check (
 bucket_id='opportunity-images' and public.active_role() in ('BRAND','ADMIN') and (storage.foldername(name))[1]=auth.uid()::text);
create policy opportunity_media_delete on storage.objects for delete to authenticated using (
 bucket_id='opportunity-images' and public.active_role() in ('BRAND','ADMIN') and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
