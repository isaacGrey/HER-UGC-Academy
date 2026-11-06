-- GoTrue creates auth users as a trusted database role without an end-user JWT.
-- REST writes still need both an active administrator and the invitation policy.
create or replace function public.guard_invitation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.role() is distinct from 'authenticated' then return new; end if;
 if new.role='ADMIN' and not exists(select 1 from public.profiles where id=auth.uid() and status='ACTIVE' and role='ADMIN' and can_invite_admin) then raise exception 'Privileged administrator required'; end if;
 if tg_op='UPDATE' and (new.accepted_at is distinct from old.accepted_at or new.role<>old.role or new.email<>old.email) then raise exception 'Invitation identity cannot change'; end if;
 new.invited_by=auth.uid(); return new;
end $$;
alter table public.creator_profiles add constraint creator_website_https check(website is null or website ~ '^https://[^/@[:space:]]+([/:?#]|$)');
alter table public.brands add constraint brand_website_https check(website is null or website ~ '^https://[^/@[:space:]]+([/:?#]|$)');
-- Database sorting/filtering uses each account's latest snapshot. Audiences can overlap.
create view public.creator_discovery with (security_invoker=true) as
 select c.*,coalesce(m.followers,0)::bigint as followers,coalesce(m.total_views,0)::bigint as total_views,
 coalesce(m.average_views,0) as average_views,coalesce(m.engagement_rate,0) as engagement_rate,
 m.last_snapshot_at,coalesce(m.account_count,0)::int as metric_account_count
 from public.creator_profiles c left join lateral (
  select sum(s.followers) followers,sum(s.total_views) total_views,avg(s.average_views) average_views,
  avg(s.engagement_rate) engagement_rate,max(s.created_at) last_snapshot_at,count(*) account_count
  from public.social_accounts a join lateral (select * from public.social_metric_snapshots ss where ss.social_account_id=a.id order by ss.created_at desc limit 1) s on true
  where a.creator_id=c.id
 ) m on true;
grant select on public.creator_discovery to authenticated,service_role;
-- Saved records must point to visible marketplace entities, including direct REST writes.
drop policy own on public.saved_opportunities;
create policy own on public.saved_opportunities for all to authenticated using(user_id=auth.uid() and public.active_role()='CREATOR') with check(user_id=auth.uid() and public.active_role()='CREATOR' and exists(select 1 from public.opportunities o where o.id=opportunity_id and o.status='LIVE'));
drop policy own on public.saved_creators;
create policy own on public.saved_creators for all to authenticated using(user_id=auth.uid() and public.active_role()='BRAND') with check(user_id=auth.uid() and public.active_role()='BRAND' and public.creator_visible(creator_id));
drop policy own on public.saved_brands;
create policy own on public.saved_brands for all to authenticated using(user_id=auth.uid() and public.active_role()='CREATOR') with check(user_id=auth.uid() and public.active_role()='CREATOR' and public.brand_visible(brand_id));
create index campaigns_owner on public.creator_campaigns(creator_id);
create index earnings_owner on public.creator_earnings(creator_id,period desc);
create index brands_industry on public.brands(industry);
create index opportunities_platforms on public.opportunities using gin(platforms);
create index creators_platforms on public.creator_profiles using gin(platforms);
