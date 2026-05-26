-- Gastro Whokey unified safe SQL
-- Purpose: coexist in the same Supabase project without breaking other apps.
-- Strategy: isolate all objects in schema gastro_whokey.

begin;

create extension if not exists pgcrypto;
create schema if not exists gastro_whokey;

-- ----------
-- Base tables
-- ----------

create table if not exists gastro_whokey.restaurants (
  id uuid primary key default gen_random_uuid(),
  app_key text not null default 'gastro-whokey',
  slug text not null,
  name text not null,
  logo_url text,
  primary_color text not null default '#C24D2C',
  secondary_color text not null default '#F1DFC5',
  typography text not null default 'Sora',
  loyalty_goal integer not null default 10,
  loyalty_reward text not null default 'Cafe gratis',
  loyalty_unit text not null default 'cafes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_key, slug)
);

create table if not exists gastro_whokey.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references gastro_whokey.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create table if not exists gastro_whokey.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references gastro_whokey.restaurants(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  points integer not null default 0,
  visits integer not null default 0,
  last_visit timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gastro_whokey.whokeys (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references gastro_whokey.restaurants(id) on delete cascade,
  customer_id uuid not null references gastro_whokey.customers(id) on delete cascade,
  uid text not null,
  public_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, uid),
  unique (public_code)
);

create table if not exists gastro_whokey.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references gastro_whokey.restaurants(id) on delete cascade,
  title text not null,
  description text not null,
  banner_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists gastro_whokey.point_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references gastro_whokey.restaurants(id) on delete cascade,
  customer_id uuid not null references gastro_whokey.customers(id) on delete cascade,
  source text not null check (source in ('nfc', 'qr', 'manual')),
  type text not null check (type in ('add', 'subtract', 'reset')),
  amount integer not null,
  item_label text not null,
  created_at timestamptz not null default now()
);

-- ----------
-- Indexes
-- ----------

create index if not exists gw_restaurants_app_key_idx
  on gastro_whokey.restaurants (app_key, slug);

create index if not exists gw_members_user_idx
  on gastro_whokey.restaurant_members (user_id, restaurant_id);

create index if not exists gw_customers_restaurant_points_idx
  on gastro_whokey.customers (restaurant_id, points desc);

create index if not exists gw_whokeys_restaurant_uid_idx
  on gastro_whokey.whokeys (restaurant_id, uid);

create index if not exists gw_promotions_restaurant_idx
  on gastro_whokey.promotions (restaurant_id);

create index if not exists gw_point_events_restaurant_created_idx
  on gastro_whokey.point_events (restaurant_id, created_at desc);

-- ----------
-- Updated at trigger
-- ----------

create or replace function gastro_whokey.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurants_touch_updated_at on gastro_whokey.restaurants;
create trigger restaurants_touch_updated_at
before update on gastro_whokey.restaurants
for each row
execute function gastro_whokey.touch_updated_at();

drop trigger if exists customers_touch_updated_at on gastro_whokey.customers;
create trigger customers_touch_updated_at
before update on gastro_whokey.customers
for each row
execute function gastro_whokey.touch_updated_at();

-- ----------
-- Helper functions for RLS
-- ----------

create or replace function gastro_whokey.current_app_key()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.app_key', true), ''),
    'gastro-whokey'
  );
$$;

create or replace function gastro_whokey.is_service_role()
returns boolean
language sql
stable
as $$
  select auth.role() = 'service_role';
$$;

create or replace function gastro_whokey.is_restaurant_member(target_restaurant_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from gastro_whokey.restaurant_members m
    where m.restaurant_id = target_restaurant_id
      and m.user_id = auth.uid()
  );
$$;

-- ----------
-- RLS
-- ----------

alter table gastro_whokey.restaurants enable row level security;
alter table gastro_whokey.restaurant_members enable row level security;
alter table gastro_whokey.customers enable row level security;
alter table gastro_whokey.whokeys enable row level security;
alter table gastro_whokey.promotions enable row level security;
alter table gastro_whokey.point_events enable row level security;

-- restaurants

drop policy if exists gw_restaurants_select on gastro_whokey.restaurants;
create policy gw_restaurants_select
on gastro_whokey.restaurants
for select
using (
  gastro_whokey.is_service_role()
  or app_key = gastro_whokey.current_app_key()
);

drop policy if exists gw_restaurants_insert on gastro_whokey.restaurants;
create policy gw_restaurants_insert
on gastro_whokey.restaurants
for insert
to authenticated
with check (app_key = gastro_whokey.current_app_key());

drop policy if exists gw_restaurants_update on gastro_whokey.restaurants;
create policy gw_restaurants_update
on gastro_whokey.restaurants
for update
to authenticated
using (gastro_whokey.is_restaurant_member(id))
with check (gastro_whokey.is_restaurant_member(id));

-- restaurant_members

drop policy if exists gw_members_select on gastro_whokey.restaurant_members;
create policy gw_members_select
on gastro_whokey.restaurant_members
for select
to authenticated
using (user_id = auth.uid() or gastro_whokey.is_restaurant_member(restaurant_id));

drop policy if exists gw_members_manage on gastro_whokey.restaurant_members;
create policy gw_members_manage
on gastro_whokey.restaurant_members
for all
to authenticated
using (gastro_whokey.is_restaurant_member(restaurant_id))
with check (gastro_whokey.is_restaurant_member(restaurant_id));

-- customers

drop policy if exists gw_customers_select on gastro_whokey.customers;
create policy gw_customers_select
on gastro_whokey.customers
for select
using (
  gastro_whokey.is_service_role()
  or gastro_whokey.is_restaurant_member(restaurant_id)
  or client_user_id = auth.uid()
);

drop policy if exists gw_customers_manage on gastro_whokey.customers;
create policy gw_customers_manage
on gastro_whokey.customers
for all
to authenticated
using (gastro_whokey.is_restaurant_member(restaurant_id))
with check (gastro_whokey.is_restaurant_member(restaurant_id));

-- whokeys

drop policy if exists gw_whokeys_select on gastro_whokey.whokeys;
create policy gw_whokeys_select
on gastro_whokey.whokeys
for select
using (
  gastro_whokey.is_service_role()
  or gastro_whokey.is_restaurant_member(restaurant_id)
  or exists (
    select 1
    from gastro_whokey.customers c
    where c.id = customer_id
      and c.client_user_id = auth.uid()
  )
);

drop policy if exists gw_whokeys_manage on gastro_whokey.whokeys;
create policy gw_whokeys_manage
on gastro_whokey.whokeys
for all
to authenticated
using (gastro_whokey.is_restaurant_member(restaurant_id))
with check (gastro_whokey.is_restaurant_member(restaurant_id));

-- promotions

drop policy if exists gw_promotions_select on gastro_whokey.promotions;
create policy gw_promotions_select
on gastro_whokey.promotions
for select
using (
  gastro_whokey.is_service_role()
  or exists (
    select 1
    from gastro_whokey.restaurants r
    where r.id = restaurant_id
      and r.app_key = gastro_whokey.current_app_key()
  )
);

drop policy if exists gw_promotions_manage on gastro_whokey.promotions;
create policy gw_promotions_manage
on gastro_whokey.promotions
for all
to authenticated
using (gastro_whokey.is_restaurant_member(restaurant_id))
with check (gastro_whokey.is_restaurant_member(restaurant_id));

-- point_events

drop policy if exists gw_events_select on gastro_whokey.point_events;
create policy gw_events_select
on gastro_whokey.point_events
for select
using (
  gastro_whokey.is_service_role()
  or gastro_whokey.is_restaurant_member(restaurant_id)
  or exists (
    select 1
    from gastro_whokey.customers c
    where c.id = customer_id
      and c.client_user_id = auth.uid()
  )
);

drop policy if exists gw_events_manage on gastro_whokey.point_events;
create policy gw_events_manage
on gastro_whokey.point_events
for all
to authenticated
using (gastro_whokey.is_restaurant_member(restaurant_id))
with check (gastro_whokey.is_restaurant_member(restaurant_id));

-- ----------
-- Grants
-- ----------

grant usage on schema gastro_whokey to anon, authenticated, service_role;
grant select on all tables in schema gastro_whokey to anon;
grant select, insert, update, delete on all tables in schema gastro_whokey to authenticated;
grant all privileges on all tables in schema gastro_whokey to service_role;

-- ----------
-- Seed (idempotent)
-- ----------

insert into gastro_whokey.restaurants (
  app_key,
  slug,
  name,
  primary_color,
  secondary_color,
  typography,
  loyalty_goal,
  loyalty_reward,
  loyalty_unit
)
values (
  'gastro-whokey',
  'cafe-central',
  'Cafe Central',
  '#C24D2C',
  '#F1DFC5',
  'Sora',
  10,
  'Cafe gratis',
  'cafes'
)
on conflict (app_key, slug) do update
set
  name = excluded.name,
  primary_color = excluded.primary_color,
  secondary_color = excluded.secondary_color,
  typography = excluded.typography,
  loyalty_goal = excluded.loyalty_goal,
  loyalty_reward = excluded.loyalty_reward,
  loyalty_unit = excluded.loyalty_unit,
  updated_at = now();

with resto as (
  select id
  from gastro_whokey.restaurants
  where app_key = 'gastro-whokey'
    and slug = 'cafe-central'
  limit 1
),
ins_customer as (
  insert into gastro_whokey.customers (
    restaurant_id,
    full_name,
    phone,
    points,
    visits,
    last_visit
  )
  select
    r.id,
    'Ana Torres',
    '+5491160001111',
    6,
    11,
    now()
  from resto r
  where not exists (
    select 1
    from gastro_whokey.customers c
    where c.restaurant_id = r.id
      and c.phone = '+5491160001111'
  )
  returning id, restaurant_id
)
insert into gastro_whokey.whokeys (
  restaurant_id,
  customer_id,
  uid,
  public_code,
  is_active
)
select
  c.restaurant_id,
  c.id,
  '04A11BC92F7780',
  'GW-ANA-001',
  true
from ins_customer c
on conflict (public_code) do nothing;

insert into gastro_whokey.promotions (restaurant_id, title, description)
select
  r.id,
  'Happy Hour de Merienda',
  '2x1 en cafe + cookie de 16:00 a 18:00.'
from gastro_whokey.restaurants r
where r.app_key = 'gastro-whokey'
  and r.slug = 'cafe-central'
  and not exists (
    select 1
    from gastro_whokey.promotions p
    where p.restaurant_id = r.id
      and p.title = 'Happy Hour de Merienda'
  );

commit;
