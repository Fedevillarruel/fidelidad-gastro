import { differenceInCalendarDays } from 'date-fns'
import { DEMO_METRICS, readLocalDb, writeLocalDb } from './demo-data'
import { hasSupabaseConfig, supabase } from './supabase'
import type { Customer, DashboardMetrics, PointEvent, Promotion, Restaurant, Whokey } from '../types'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function safe<T>(value: T, fallback: T): T {
  return value ?? fallback
}

export async function getRestaurants(): Promise<Restaurant[]> {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.from('restaurants').select('*').order('name')
    if (!error && data) {
      return data as Restaurant[]
    }
  }

  return readLocalDb().restaurants
}

export async function createRestaurant(payload: {
  name: string
  slug: string
  primaryColor: string
  secondaryColor: string
  loyaltyGoal: number
  loyaltyReward: string
  loyaltyUnit: string
}) {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name: payload.name,
        slug: payload.slug,
        primary_color: payload.primaryColor,
        secondary_color: payload.secondaryColor,
        loyalty_goal: payload.loyaltyGoal,
        loyalty_reward: payload.loyaltyReward,
        loyalty_unit: payload.loyaltyUnit,
        typography: 'Space Grotesk',
      })
      .select('*')
      .single()

    if (!error && data) {
      return data as Restaurant
    }
  }

  const db = readLocalDb()
  const created: Restaurant = {
    id: `resto-${uid()}`,
    slug: payload.slug,
    name: payload.name,
    primary_color: payload.primaryColor,
    secondary_color: payload.secondaryColor,
    typography: 'Space Grotesk',
    loyalty_goal: payload.loyaltyGoal,
    loyalty_reward: payload.loyaltyReward,
    loyalty_unit: payload.loyaltyUnit,
  }

  db.restaurants = [created, ...db.restaurants]
  writeLocalDb(db)
  return created
}

export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const restaurants = await getRestaurants()
  return restaurants.find((r) => r.slug === slug) ?? null
}

export async function getRestaurantCustomers(restaurantId: string): Promise<Customer[]> {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('points', { ascending: false })

    if (!error && data) {
      return data as Customer[]
    }
  }

  return readLocalDb()
    .customers.filter((c) => c.restaurant_id === restaurantId)
    .sort((a, b) => b.points - a.points)
}

export async function getRestaurantPromotions(restaurantId: string): Promise<Promotion[]> {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      return data as Promotion[]
    }
  }

  return readLocalDb().promotions.filter((p) => p.restaurant_id === restaurantId)
}

export async function getRestaurantMetrics(restaurantId: string): Promise<DashboardMetrics> {
  const customers = await getRestaurantCustomers(restaurantId)

  if (!customers.length) {
    return {
      activeCustomers: 0,
      visitsThisWeek: 0,
      avgRecurrenceDays: 0,
      loyaltyRedemptions: 0,
    }
  }

  const recurrence = customers
    .map((c) => (c.last_visit ? differenceInCalendarDays(new Date(), new Date(c.last_visit)) : 0))
    .reduce((acc, days) => acc + days, 0)

  return {
    activeCustomers: safe(customers.length, DEMO_METRICS.activeCustomers),
    visitsThisWeek: customers.reduce((acc, c) => acc + c.visits, 0),
    avgRecurrenceDays: Math.max(1, Math.round(recurrence / customers.length)),
    loyaltyRedemptions: Math.floor(customers.reduce((acc, c) => acc + c.visits, 0) / 10),
  }
}

export async function upsertWhokeyAndMaybeCustomer(input: {
  restaurantId: string
  uid: string
  customerName: string
  phone?: string
}) {
  if (hasSupabaseConfig && supabase) {
    const existing = await supabase
      .from('whokeys')
      .select('*')
      .eq('restaurant_id', input.restaurantId)
      .eq('uid', input.uid)
      .single()

    if (!existing.error && existing.data) {
      return existing.data as Whokey
    }

    const customerInsert = await supabase
      .from('customers')
      .insert({
        restaurant_id: input.restaurantId,
        full_name: input.customerName,
        phone: input.phone,
        points: 0,
        visits: 0,
      })
      .select('*')
      .single()

    if (customerInsert.error || !customerInsert.data) {
      throw new Error(customerInsert.error?.message ?? 'No se pudo crear cliente en Supabase')
    }

    const whokeyInsert = await supabase
      .from('whokeys')
      .insert({
        restaurant_id: input.restaurantId,
        customer_id: customerInsert.data.id,
        uid: input.uid,
        public_code: `GW-${uid().toUpperCase()}`,
        is_active: true,
      })
      .select('*')
      .single()

    if (whokeyInsert.error || !whokeyInsert.data) {
      throw new Error(whokeyInsert.error?.message ?? 'No se pudo crear Whokey en Supabase')
    }

    return whokeyInsert.data as Whokey
  }

  const db = readLocalDb()
  const existing = db.whokeys.find(
    (w) => w.restaurant_id === input.restaurantId && w.uid.toLowerCase() === input.uid.toLowerCase(),
  )

  if (existing) {
    return existing
  }

  const customer: Customer = {
    id: `cust-${uid()}`,
    restaurant_id: input.restaurantId,
    full_name: input.customerName,
    phone: input.phone,
    points: 0,
    visits: 0,
    last_visit: new Date().toISOString(),
  }

  const whokey: Whokey = {
    id: `wk-${uid()}`,
    restaurant_id: input.restaurantId,
    customer_id: customer.id,
    uid: input.uid,
    public_code: `GW-${uid().toUpperCase()}`,
    is_active: true,
    created_at: new Date().toISOString(),
  }

  db.customers.unshift(customer)
  db.whokeys.unshift(whokey)
  writeLocalDb(db)
  return whokey
}

export async function findCustomerByWhokey(restaurantId: string, codeOrUid: string) {
  if (hasSupabaseConfig && supabase) {
    const { data: whokey } = await supabase
      .from('whokeys')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .or(`uid.eq.${codeOrUid},public_code.eq.${codeOrUid}`)
      .single()

    if (!whokey) {
      return null
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', whokey.customer_id)
      .single()

    return customer as Customer | null
  }

  const db = readLocalDb()
  const whokey = db.whokeys.find(
    (w) =>
      w.restaurant_id === restaurantId &&
      (w.uid.toLowerCase() === codeOrUid.toLowerCase() ||
        w.public_code.toLowerCase() === codeOrUid.toLowerCase()),
  )

  if (!whokey) {
    return null
  }

  return db.customers.find((c) => c.id === whokey.customer_id) ?? null
}

export async function applyPointsEvent(input: {
  restaurantId: string
  codeOrUid: string
  type: PointEvent['type']
  amount: number
  source: PointEvent['source']
  itemLabel: string
}) {
  const customer = await findCustomerByWhokey(input.restaurantId, input.codeOrUid)
  if (!customer) {
    throw new Error('No se encontro un cliente para ese Whokey/QR')
  }

  if (hasSupabaseConfig && supabase) {
    const nextPoints =
      input.type === 'reset'
        ? 0
        : input.type === 'add'
          ? customer.points + input.amount
          : Math.max(0, customer.points - input.amount)

    const nextVisits = input.type === 'add' ? customer.visits + 1 : customer.visits

    const customerUpdate = await supabase
      .from('customers')
      .update({ points: nextPoints, visits: nextVisits, last_visit: new Date().toISOString() })
      .eq('id', customer.id)

    if (customerUpdate.error) {
      throw new Error(customerUpdate.error.message)
    }

    const eventInsert = await supabase.from('point_events').insert({
      restaurant_id: input.restaurantId,
      customer_id: customer.id,
      source: input.source,
      type: input.type,
      amount: input.amount,
      item_label: input.itemLabel,
    })

    if (eventInsert.error) {
      throw new Error(eventInsert.error.message)
    }

    return { ...customer, points: nextPoints, visits: nextVisits }
  }

  const db = readLocalDb()
  const customerIndex = db.customers.findIndex((c) => c.id === customer.id)

  if (customerIndex >= 0) {
    if (input.type === 'reset') {
      db.customers[customerIndex].points = 0
    }
    if (input.type === 'add') {
      db.customers[customerIndex].points += input.amount
      db.customers[customerIndex].visits += 1
    }
    if (input.type === 'subtract') {
      db.customers[customerIndex].points = Math.max(0, db.customers[customerIndex].points - input.amount)
    }

    db.customers[customerIndex].last_visit = new Date().toISOString()
  }

  db.events.unshift({
    id: `evt-${uid()}`,
    restaurant_id: input.restaurantId,
    customer_id: customer.id,
    source: input.source,
    type: input.type,
    amount: input.amount,
    item_label: input.itemLabel,
    created_at: new Date().toISOString(),
  })

  writeLocalDb(db)
  return db.customers[customerIndex]
}

export async function getClientCardData(restaurantSlug: string, cardCode: string) {
  const restaurant = await getRestaurantBySlug(restaurantSlug)

  if (!restaurant) {
    return null
  }

  const customer = await findCustomerByWhokey(restaurant.id, cardCode)

  return {
    restaurant,
    customer,
    promotions: await getRestaurantPromotions(restaurant.id),
  }
}
