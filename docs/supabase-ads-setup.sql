-- Campaign table
create table if not exists public.ad_campaigns (
  id text primary key,
  advertiser text not null,
  title text not null,
  description text not null,
  target_url text not null,
  image_url text,
  slots text[] not null default '{}',
  category_slugs text[],
  start_at timestamptz,
  end_at timestamptz,
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_active_idx on public.ad_campaigns (active);
create index if not exists ad_campaigns_priority_idx on public.ad_campaigns (priority desc);
create index if not exists ad_campaigns_dates_idx on public.ad_campaigns (start_at, end_at);

-- Audit table
create table if not exists public.ad_campaign_audit_logs (
  id bigint generated always as identity primary key,
  action text not null check (action in ('create', 'update', 'delete')),
  actor text not null,
  campaign_id text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ad_campaign_audit_campaign_idx on public.ad_campaign_audit_logs (campaign_id, created_at desc);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_ad_campaigns on public.ad_campaigns;
create trigger trg_set_updated_at_ad_campaigns
before update on public.ad_campaigns
for each row
execute procedure public.set_updated_at();

-- RLS hardening:
-- 1) No direct anonymous/public access (frontend uses Next.js server with service role key)
alter table public.ad_campaigns enable row level security;
alter table public.ad_campaign_audit_logs enable row level security;

drop policy if exists ad_campaigns_no_anon_select on public.ad_campaigns;
create policy ad_campaigns_no_anon_select on public.ad_campaigns
for select
to anon
using (false);

drop policy if exists ad_campaigns_no_anon_write on public.ad_campaigns;
create policy ad_campaigns_no_anon_write on public.ad_campaigns
for all
to anon
using (false)
with check (false);

drop policy if exists ad_campaign_audit_no_anon_select on public.ad_campaign_audit_logs;
create policy ad_campaign_audit_no_anon_select on public.ad_campaign_audit_logs
for select
to anon
using (false);

drop policy if exists ad_campaign_audit_no_anon_write on public.ad_campaign_audit_logs;
create policy ad_campaign_audit_no_anon_write on public.ad_campaign_audit_logs
for all
to anon
using (false)
with check (false);

-- Note:
-- Service role key bypasses RLS by design.
-- Keep SUPABASE_SERVICE_ROLE_KEY only on server env (never NEXT_PUBLIC_).

