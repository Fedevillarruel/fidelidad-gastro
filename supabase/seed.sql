insert into public.restaurants (
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
  'cafe-central',
  'Cafe Central',
  '#C24D2C',
  '#F1DFC5',
  'Fraunces',
  10,
  'Cafe gratis',
  'cafes'
)
on conflict (slug) do nothing;

with resto as (
  select id from public.restaurants where slug = 'cafe-central' limit 1
),
created_customer as (
  insert into public.customers (restaurant_id, full_name, phone, points, visits, last_visit)
  select id, 'Ana Torres', '+5491160001111', 6, 11, now()
  from resto
  returning id, restaurant_id
)
insert into public.whokeys (restaurant_id, customer_id, uid, public_code, is_active)
select restaurant_id, id, '04A11BC92F7780', 'GW-ANA-001', true
from created_customer
on conflict (public_code) do nothing;

insert into public.promotions (restaurant_id, title, description)
select id, 'Happy Hour de Merienda', '2x1 en cafe + cookie de 16:00 a 18:00.'
from public.restaurants
where slug = 'cafe-central';
