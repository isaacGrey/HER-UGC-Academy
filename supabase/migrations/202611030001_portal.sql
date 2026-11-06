create extension if not exists pgcrypto;
create type public.app_role as enum ('CREATOR','BRAND','ADMIN');
create type public.account_status as enum ('INVITED','ACTIVE','SUSPENDED','REVOKED','DELETED');
create type public.opportunity_status as enum ('DRAFT','PENDING','APPROVED','LIVE','CLOSED','REJECTED');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null, display_name text not null, role public.app_role not null,
 status public.account_status not null default 'ACTIVE', can_invite_admin boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creator_profiles (
 id uuid primary key references public.profiles(id) on delete cascade,
 display_name text not null, headline text not null default '', bio text not null default '',
 location text not null default '', timezone text not null default '', languages text[] not null default '{}',
 niches text[] not null default '{}', platforms text[] not null default '{}', specialties text[] not null default '{}',
 content_styles text[] not null default '{}', preferred_campaign_types text[] not null default '{}',
 availability text not null default 'Available', website text, avatar_path text,
 verified boolean not null default false, badges text[] not null default '{}',
 academy_status text, cohort text, academy_tier text, graduation_date date, verified_at timestamptz,
 rate_min numeric check (rate_min >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.creator_contacts (
 id uuid primary key references public.creator_profiles(id) on delete cascade,
 contact_email text, business_email text, preferred_contact_method text not null default 'Email'
);
create table public.brands (
 id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null,
 description text not null default '', industry text not null default '', location text not null default '',
 website text, logo_path text, company_size text, remote boolean not null default true,
 verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.brand_members (
 id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 member_role text not null default 'OWNER' check(member_role in ('OWNER','MEMBER')), unique(brand_id,user_id)
);
create table public.brand_contacts (
 id uuid primary key references public.brands(id) on delete cascade, contact_name text, contact_title text, contact_email text
);
create table public.invitations (
 id uuid primary key default gen_random_uuid(), email text not null, role public.app_role not null,
 token_hash text unique not null, invited_by uuid references public.profiles(id),
 expires_at timestamptz not null default now() + interval '7 days',
 accepted_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now(),
 check(email = lower(email)), check(length(token_hash)=64)
);
create table public.opportunities (
 id uuid primary key default gen_random_uuid(), brand_id uuid not null references public.brands(id),
 title text not null, summary text not null, description text not null, content_requirements text not null default '',
 creator_requirements text not null default '', deliverables text not null default '',
 niches text[] not null default '{}', platforms text[] not null default '{}', location text not null default 'Global',
 remote boolean not null default true, campaign_type text not null default 'UGC',
 compensation_type text not null default 'PAID' check(compensation_type in ('PAID','GIFTED','AFFILIATE')),
 compensation_min numeric not null default 0 check(compensation_min >= 0),
 compensation_max numeric not null default 0 check(compensation_max >= compensation_min),
 currency text not null default 'USD' check(currency ~ '^[A-Z]{3}$'), deadline date, start_date date, end_date date,
 external_platform text not null default 'External platform', external_url text not null check(external_url ~ '^https://'),
 status public.opportunity_status not null default 'DRAFT', featured boolean not null default false,
 rejection_reason text, approved_at timestamptz, closed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(end_date is null or start_date is null or end_date >= start_date)
);
create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(id) on delete cascade,
 title text not null, description text not null default '', platform text not null default 'Website',
 url text check(url ~ '^https://'), image_path text, media_type text not null default 'LINK' check(media_type in ('LINK','IMAGE')),
 brand_name text, views bigint check(views>=0), likes bigint check(likes>=0), display_order int not null default 0,
 featured boolean not null default false, created_at timestamptz not null default now()
);
create table public.social_accounts (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(id) on delete cascade,
 platform text not null check(platform in ('TikTok','Instagram','YouTube')), username text not null,
 profile_url text not null check(profile_url ~ '^https://'), platform_user_id text,
 connection_method text not null default 'MANUAL' check(connection_method in ('MANUAL','OAUTH')),
 oauth_status text not null default 'NOT_CONFIGURED', connected_at timestamptz not null default now(), last_synced_at timestamptz,
 unique(creator_id,platform)
);
create table public.social_metric_snapshots (
 id uuid primary key default gen_random_uuid(), social_account_id uuid not null references public.social_accounts(id) on delete cascade,
 followers bigint not null default 0 check(followers >= 0), following bigint not null default 0 check(following>=0),
 total_views bigint not null default 0 check(total_views>=0), average_views numeric not null default 0 check(average_views>=0),
 average_likes numeric not null default 0 check(average_likes>=0), average_comments numeric not null default 0 check(average_comments>=0),
 average_shares numeric not null default 0 check(average_shares>=0), video_count int not null default 0 check(video_count>=0),
 engagement_rate numeric not null default 0 check(engagement_rate between 0 and 100),
 source text not null default 'MANUAL' check(source in ('MANUAL','API')), created_at timestamptz not null default now()
);
create table public.saved_opportunities (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 opportunity_id uuid not null references public.opportunities(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,opportunity_id)
);
create table public.saved_creators (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 creator_id uuid not null references public.creator_profiles(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,creator_id)
);
create table public.saved_brands (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 brand_id uuid not null references public.brands(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id,brand_id)
);
create table public.creator_campaigns (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(id) on delete cascade,
 name text not null, brand_name text not null, external_platform text, external_url text check(external_url ~ '^https://'),
 status text not null default 'ACTIVE' check(status in ('ACTIVE','COMPLETED','CANCELLED')),
 start_date date, end_date date, compensation numeric check(compensation>=0), notes text,
 created_at timestamptz not null default now(), check(end_date is null or start_date is null or end_date>=start_date)
);
create table public.creator_earnings (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.creator_profiles(id) on delete cascade,
 source text not null check(source in ('YOUTUBE','SIDESHIFT','BRAND_DIRECT','OTHER')),
 amount numeric not null check(amount>=0), currency text not null default 'USD' check(currency ~ '^[A-Z]{3}$'),
 period date not null, campaign_name text, external_reference text,
 data_source text not null default 'MANUAL' check(data_source in ('MANUAL','API')), verified boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.plans (
 id uuid primary key default gen_random_uuid(), name text not null, description text not null default '',
 price_monthly numeric not null default 0 check(price_monthly>=0), price_yearly numeric not null default 0 check(price_yearly>=0),
 currency text not null default 'USD', features text[] not null default '{}', stripe_price_monthly_id text,
 stripe_price_yearly_id text, active boolean not null default true, is_default boolean not null default false,
 created_at timestamptz not null default now()
);
create unique index one_default_plan on public.plans(is_default) where is_default;
create table public.subscriptions (
 id uuid primary key default gen_random_uuid(), brand_id uuid not null unique references public.brands(id),
 plan_id uuid references public.plans(id), stripe_customer_id text unique, stripe_subscription_id text unique,
 status text not null default 'FREE', current_period_end timestamptz, updated_at timestamptz not null default now()
);
create table public.feature_flags (id text primary key, enabled boolean not null default false, description text not null);
insert into public.feature_flags values
 ('brand_billing_enabled',false,'Require brand subscriptions'),
 ('creator_earnings_enabled',true,'Allow self-reported creator earnings');
insert into public.plans(name,description,is_default) values('Academy access','Invitation-only access. No payment required.',true);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null,
 entity_type text not null, entity_id text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table public.analytics_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 event text not null, entity_id uuid not null, created_at timestamptz not null default now()
);
create table public.webhook_events (id text primary key, created_at timestamptz not null default now());
create table public.rate_limits (id text primary key, hits int not null, reset_at timestamptz not null);

-- SECURITY DEFINER helpers avoid recursive RLS. Every privileged helper pins its search path.
create function public.active_role() returns public.app_role language sql stable security definer set search_path=public as $$
 select role from public.profiles where id=auth.uid() and status='ACTIVE'
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(public.active_role()='ADMIN',false)
$$;
create function public.is_brand_member(b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select public.active_role()='BRAND' and exists(select 1 from public.brand_members where brand_id=b and user_id=auth.uid())
$$;
create function public.brand_visible(b uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.brand_members m join public.profiles p on p.id=m.user_id where m.brand_id=b and p.status='ACTIVE')
$$;
create function public.creator_visible(c uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=c and status='ACTIVE')
$$;

do $$ declare t text; begin
 foreach t in array array['profiles','creator_profiles','creator_contacts','brands','brand_members','brand_contacts','invitations','opportunities','portfolio_items','social_accounts','social_metric_snapshots','saved_opportunities','saved_creators','saved_brands','creator_campaigns','creator_earnings','plans','subscriptions','feature_flags','audit_logs','analytics_events','webhook_events','rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;

create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_admin on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
create policy creator_read on public.creator_profiles for select to authenticated using(public.active_role() is not null and (public.creator_visible(id) or public.is_admin()));
create policy creator_edit on public.creator_profiles for update to authenticated using((id=auth.uid() and public.active_role()='CREATOR') or public.is_admin());
create policy contacts_read on public.creator_contacts for select to authenticated using(public.active_role() is not null and (id=auth.uid() or public.active_role() in ('BRAND','ADMIN')) and public.creator_visible(id));
create policy contacts_edit on public.creator_contacts for all to authenticated using((id=auth.uid() and public.active_role()='CREATOR') or public.is_admin()) with check((id=auth.uid() and public.active_role()='CREATOR') or public.is_admin());
create policy brand_read on public.brands for select to authenticated using(public.active_role() is not null and (public.brand_visible(id) or public.is_admin()));
create policy brand_edit on public.brands for update to authenticated using(public.is_brand_member(id) or public.is_admin());
create policy member_read on public.brand_members for select to authenticated using((user_id=auth.uid() and public.active_role() is not null) or public.is_admin());
create policy brand_contacts_read on public.brand_contacts for select to authenticated using(public.active_role() is not null and public.brand_visible(id));
create policy brand_contacts_edit on public.brand_contacts for all to authenticated using(public.is_brand_member(id) or public.is_admin()) with check(public.is_brand_member(id) or public.is_admin());
create policy invitation_admin on public.invitations for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy opportunity_read on public.opportunities for select to authenticated using(public.active_role() is not null and ((status='LIVE' and public.brand_visible(brand_id) and (deadline is null or deadline>=current_date)) or public.is_brand_member(brand_id) or public.is_admin()));
create policy opportunity_insert on public.opportunities for insert to authenticated with check((public.is_brand_member(brand_id) and status='DRAFT' and not featured and approved_at is null) or public.is_admin());
create policy opportunity_edit on public.opportunities for update to authenticated using((public.is_brand_member(brand_id) and status in ('DRAFT','REJECTED')) or public.is_admin()) with check(public.is_brand_member(brand_id) or public.is_admin());

do $$ declare t text; begin
 foreach t in array array['portfolio_items','social_accounts'] loop
 execute format('create policy discover on public.%I for select to authenticated using(public.active_role() is not null and (public.creator_visible(creator_id) or public.is_admin()))',t);
 execute format('create policy manage on public.%I for all to authenticated using((creator_id=auth.uid() and public.active_role()=''CREATOR'') or public.is_admin()) with check((creator_id=auth.uid() and public.active_role()=''CREATOR'') or public.is_admin())',t);
 end loop;
 foreach t in array array['creator_campaigns','creator_earnings'] loop
 execute format('create policy own on public.%I for all to authenticated using((creator_id=auth.uid() and public.active_role()=''CREATOR'') or public.is_admin()) with check((creator_id=auth.uid() and public.active_role()=''CREATOR'') or public.is_admin())',t);
 end loop;
 foreach t in array array['saved_opportunities','saved_brands','saved_creators'] loop
 execute format('create policy own on public.%I for all to authenticated using(user_id=auth.uid() and public.active_role()=%L) with check(user_id=auth.uid() and public.active_role()=%L)',t,case when t='saved_creators' then 'BRAND' else 'CREATOR' end,case when t='saved_creators' then 'BRAND' else 'CREATOR' end);
 end loop;
end $$;
create policy metrics_read on public.social_metric_snapshots for select to authenticated using(exists(select 1 from public.social_accounts s where s.id=social_account_id));
create policy metrics_manage on public.social_metric_snapshots for all to authenticated using(public.is_admin() or (public.active_role()='CREATOR' and exists(select 1 from public.social_accounts s where s.id=social_account_id and s.creator_id=auth.uid()))) with check(public.is_admin() or (source='MANUAL' and public.active_role()='CREATOR' and exists(select 1 from public.social_accounts s where s.id=social_account_id and s.creator_id=auth.uid())));
create policy plans_read on public.plans for select to authenticated using(public.active_role() is not null);
create policy plans_admin on public.plans for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy flags_read on public.feature_flags for select to authenticated using(public.active_role() is not null);
create policy flags_admin on public.feature_flags for update to authenticated using(public.is_admin());
create policy subscriptions_read on public.subscriptions for select to authenticated using(public.is_brand_member(brand_id) or public.is_admin());
create policy audit_read on public.audit_logs for select to authenticated using(public.is_admin());
create policy events_read on public.analytics_events for select to authenticated using(public.is_admin());
create policy events_insert on public.analytics_events for insert to authenticated with check(user_id=auth.uid() and public.active_role() is not null and event in ('PROFILE_VIEWED','BRAND_VIEWED','OPPORTUNITY_VIEWED','OPPORTUNITY_SAVED','OPPORTUNITY_UNSAVED','CREATOR_SAVED','CREATOR_UNSAVED','BRAND_SAVED','BRAND_UNSAVED','EXTERNAL_APPLICATION_CLICKED'));

-- Column invariants apply even when a browser talks directly to the REST API.
create function public.protect_columns() returns trigger language plpgsql set search_path=public as $$
begin
 if auth.role()='service_role' then return new; end if;
 if tg_table_name='profiles' then
  if new.id<>old.id or new.role<>old.role or new.email<>old.email or new.can_invite_admin<>old.can_invite_admin then raise exception 'Protected identity'; end if;
  if new.id=auth.uid() and new.status<>old.status then raise exception 'Cannot change own account state'; end if;
 end if;
 if public.is_admin() then return new; end if;
 if tg_table_name='creator_profiles' then if (new.id<>old.id or new.verified is distinct from old.verified or new.badges is distinct from old.badges or new.academy_status is distinct from old.academy_status or new.cohort is distinct from old.cohort or new.academy_tier is distinct from old.academy_tier or new.graduation_date is distinct from old.graduation_date or new.verified_at is distinct from old.verified_at) then raise exception 'Verification is admin-controlled'; end if; end if;
 if tg_table_name='brands' then if (new.id<>old.id or new.verified<>old.verified) then raise exception 'Verification is admin-controlled'; end if; end if;
 if tg_table_name='opportunities' then if (new.brand_id<>old.brand_id or new.featured<>old.featured or new.approved_at is distinct from old.approved_at or new.rejection_reason is distinct from old.rejection_reason or new.status not in ('DRAFT','PENDING')) then raise exception 'Moderation is admin-controlled'; end if; end if;
 return new;
end $$;
do $$ declare t text; begin foreach t in array array['profiles','creator_profiles','brands','opportunities'] loop
 execute format('create trigger protect before update on public.%I for each row execute function public.protect_columns()',t);
end loop; end $$;
create function public.protect_manual() returns trigger language plpgsql set search_path=public as $$
begin
 if auth.role()='service_role' or public.is_admin() then return new; end if;
 if tg_table_name='social_accounts' then if (new.connection_method<>'MANUAL' or new.oauth_status<>'NOT_CONFIGURED' or new.last_synced_at is not null or new.platform_user_id is not null) then raise exception 'API fields are protected'; end if; end if;
 if tg_table_name='creator_earnings' then if (new.verified or new.data_source<>'MANUAL') then raise exception 'Cannot verify self-reported earnings'; end if; end if;
 return new;
end $$;
create trigger manual_social before insert or update on public.social_accounts for each row execute function public.protect_manual();
create trigger manual_earnings before insert or update on public.creator_earnings for each row execute function public.protect_manual();

create function public.guard_invitation() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if auth.role()='service_role' then return new; end if;
 if new.role='ADMIN' and not exists(select 1 from public.profiles where id=auth.uid() and status='ACTIVE' and role='ADMIN' and can_invite_admin) then raise exception 'Privileged administrator required'; end if;
 if tg_op='UPDATE' and (new.accepted_at is distinct from old.accepted_at or new.role<>old.role or new.email<>old.email) then raise exception 'Invitation identity cannot change'; end if;
 new.invited_by=auth.uid(); return new;
end $$;
create trigger guard_invite before insert or update on public.invitations for each row execute function public.guard_invitation();

-- Auth creation and invitation consumption are one PostgreSQL transaction.
create function public.accept_invited_user() returns trigger language plpgsql security definer set search_path=public as $$
declare inv public.invitations; b uuid;
begin
 select * into inv from public.invitations where token_hash=new.raw_app_meta_data->>'invitation_hash' and email=lower(new.email) and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if inv.id is null then raise exception 'Valid invitation required'; end if;
 update public.invitations set accepted_at=now() where id=inv.id;
 insert into public.profiles(id,email,display_name,role) values(new.id,lower(new.email),coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'New member'),inv.role);
 if inv.role='CREATOR' then
  insert into public.creator_profiles(id,display_name) values(new.id,coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'New creator'));
  insert into public.creator_contacts(id,contact_email) values(new.id,new.email);
 elsif inv.role='BRAND' then
  insert into public.brands(name,slug) values(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'New brand'),new.id::text) returning id into b;
  insert into public.brand_members(brand_id,user_id) values(b,new.id);
  insert into public.brand_contacts(id,contact_email) values(b,new.email);
  insert into public.subscriptions(brand_id,plan_id) select b,id from public.plans where is_default;
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(new.id,'ACCOUNT_CREATED','profiles',new.id::text);
 return new;
end $$;
create trigger invited_auth_user after insert on auth.users for each row execute function public.accept_invited_user();

create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$
declare entity jsonb; previous jsonb; begin
 entity=to_jsonb(new); previous=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),tg_table_name||'_'||tg_op,tg_table_name,entity->>'id',jsonb_build_object('status',entity->>'status','previous_status',previous->>'status','verified',entity->>'verified','enabled',entity->>'enabled','reason',entity->>'rejection_reason'));
 return new;
end $$;
do $$ declare t text; begin foreach t in array array['profiles','creator_profiles','brands','invitations','opportunities','plans','feature_flags'] loop
 execute format('create trigger audit after insert or update on public.%I for each row execute function public.audit_change()',t);
end loop; end $$;

create function public.consume_rate_limit(key text, maximum int, seconds int) returns boolean language plpgsql security definer set search_path=public as $$
declare n int; begin
 insert into public.rate_limits(id,hits,reset_at) values(key,1,now()+make_interval(secs=>seconds))
 on conflict(id) do update set hits=case when rate_limits.reset_at<now() then 1 else rate_limits.hits+1 end,
 reset_at=case when rate_limits.reset_at<now() then now()+make_interval(secs=>seconds) else rate_limits.reset_at end returning hits into n;
 return n<=maximum;
end $$;
revoke all on function public.consume_rate_limit(text,int,int) from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,int,int) to service_role;
revoke all on function public.accept_invited_user() from public,anon,authenticated;

create index profiles_role_status on public.profiles(role,status);
create index opportunities_discovery on public.opportunities(status,created_at desc);
create index opportunities_brand on public.opportunities(brand_id);
create index opportunities_niches on public.opportunities using gin(niches);
create index creators_niches on public.creator_profiles using gin(niches);
create index creator_availability on public.creator_profiles(availability);
create index invitation_lookup on public.invitations(email,expires_at);
create index brand_member_user on public.brand_members(user_id);
create index social_creator on public.social_accounts(creator_id);
create index snapshot_history on public.social_metric_snapshots(social_account_id,created_at desc);
create index portfolio_creator on public.portfolio_items(creator_id);
create index audit_time on public.audit_logs(created_at desc);
create index events_time on public.analytics_events(created_at desc);

-- Explicit grants; RLS still gates all user queries. No client access to operational tables.
grant usage on schema public to authenticated,service_role;
grant select,insert,update,delete on all tables in schema public to authenticated;
revoke all on public.webhook_events,public.rate_limits from authenticated;
revoke insert,update,delete on public.audit_logs from authenticated;
grant all on all tables in schema public to service_role;

