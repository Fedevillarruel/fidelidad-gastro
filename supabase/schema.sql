create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text,
  primary_color text not null default '#C24D2C',
  secondary_color text not null default '#F1DFC5',
  typography text not null default 'Space Grotesk',
  loyalty_goal integer not null default 10,
  loyalty_reward text not null default 'Cafe gratis',
  loyalty_unit text not null default 'cafes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  full_name text not null,
  phone text,
  points integer not null default 0,
  visits integer not null default 0,
  last_visit timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whokeys (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  uid text not null,
  public_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, uid)
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  title text not null,
  description text not null,
  banner_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  source text not null check (source in ('nfc', 'qr', 'manual')),
  type text not null check (type in ('add', 'subtract', 'reset')),
  amount integer not null,
  item_label text not null,
  created_at timestamptz not null default now()
);

create index if not exists customers_restaurant_points_idx on public.customers(restaurant_id, points desc);
create index if not exists whokeys_restaurant_uid_idx on public.whokeys(restaurant_id, uid);
create index if not exists promotions_restaurant_idx on public.promotions(restaurant_id);
create index if not exists point_events_restaurant_created_idx on public.point_events(restaurant_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists restaurants_touch_updated_at on public.restaurants;
create trigger restaurants_touch_updated_at
before update on public.restaurants
for each row
execute function public.touch_updated_at();

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
before update on public.customers
for each row
execute function public.touch_updated_at();

alter table public.restaurants enable row level security;
alter table public.customers enable row level security;
alter table public.whokeys enable row level security;
alter table public.promotions enable row level security;
alter table public.point_events enable row level security;

drop policy if exists "public read restaurants" on public.restaurants;
create policy "public read restaurants"
on public.restaurants
for select
using (true);

drop policy if exists "public read customers" on public.customers;
create policy "public read customers"
on public.customers
for select
using (true);

drop policy if exists "public read whokeys" on public.whokeys;
create policy "public read whokeys"
on public.whokeys
for select
using (true);

drop policy if exists "public read promotions" on public.promotions;
create policy "public read promotions"
on public.promotions
for select
using (true);

drop policy if exists "public read point events" on public.point_events;
create policy "public read point events"
on public.point_events
for select
using (true);

drop policy if exists "authenticated write restaurants" on public.restaurants;
create policy "authenticated write restaurants"
on public.restaurants
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write customers" on public.customers;
create policy "authenticated write customers"
on public.customers
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write whokeys" on public.whokeys;
create policy "authenticated write whokeys"
on public.whokeys
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write promotions" on public.promotions;
create policy "authenticated write promotions"
on public.promotions
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "authenticated write point events" on public.point_events;
create policy "authenticated write point events"
on public.point_events
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
