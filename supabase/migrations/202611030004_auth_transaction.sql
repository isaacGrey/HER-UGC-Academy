-- GoTrue's admin API inserts the auth row, then updates trusted app metadata
-- in the same transaction. Check the final row at COMMIT, never user metadata.
create or replace function public.accept_invited_user() returns trigger language plpgsql security definer set search_path=public as $$
declare inv public.invitations; b uuid; current_user_row auth.users;
begin
 select * into current_user_row from auth.users where id=new.id;
 select * into inv from public.invitations where token_hash=current_user_row.raw_app_meta_data->>'invitation_hash' and email=lower(current_user_row.email) and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if inv.id is null then raise exception 'Valid invitation required'; end if;
 update public.invitations set accepted_at=now() where id=inv.id;
 insert into public.profiles(id,email,display_name,role) values(new.id,lower(current_user_row.email),coalesce(nullif(current_user_row.raw_user_meta_data->>'display_name',''),'New member'),inv.role);
 if inv.role='CREATOR' then
  insert into public.creator_profiles(id,display_name) values(new.id,coalesce(nullif(current_user_row.raw_user_meta_data->>'display_name',''),'New creator'));
  insert into public.creator_contacts(id,contact_email) values(new.id,current_user_row.email);
 elsif inv.role='BRAND' then
  insert into public.brands(name,slug) values(coalesce(nullif(current_user_row.raw_user_meta_data->>'display_name',''),'New brand'),new.id::text) returning id into b;
  insert into public.brand_members(brand_id,user_id) values(b,new.id);
  insert into public.brand_contacts(id,contact_email) values(b,current_user_row.email);
  insert into public.subscriptions(brand_id,plan_id) select b,id from public.plans where is_default;
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(new.id,'ACCOUNT_CREATED','profiles',new.id::text);
 return new;
end $$;
drop trigger invited_auth_user on auth.users;
create constraint trigger invited_auth_user after insert on auth.users deferrable initially deferred for each row execute function public.accept_invited_user();
