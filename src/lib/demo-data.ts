import type { Customer, DashboardMetrics, PointEvent, Promotion, Restaurant, Whokey } from '../types'

const todayIso = new Date().toISOString()

export const DEMO_RESTAURANTS: Restaurant[] = [
  {
    id: 'resto-1',
    slug: 'cafe-central',
    name: 'Cafe Central',
    primary_color: '#C24D2C',
    secondary_color: '#F1DFC5',
    typography: 'Fraunces',
    loyalty_goal: 10,
    loyalty_reward: 'Cafe gratis',
    loyalty_unit: 'cafes',
    logo_url:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&q=80&auto=format&fit=crop',
  },
]

export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    restaurant_id: 'resto-1',
    full_name: 'Ana Torres',
    points: 6,
    visits: 11,
    phone: '+5491160001111',
    last_visit: todayIso,
  },
  {
    id: 'cust-2',
    restaurant_id: 'resto-1',
    full_name: 'Leo Martinez',
    points: 9,
    visits: 15,
    phone: '+5491160002222',
    last_visit: todayIso,
  },
]

export const DEMO_WHOKEYS: Whokey[] = [
  {
    id: 'wk-1',
    restaurant_id: 'resto-1',
    customer_id: 'cust-1',
    uid: '04A11BC92F7780',
    public_code: 'GW-ANA-001',
    is_active: true,
    created_at: todayIso,
  },
  {
    id: 'wk-2',
    restaurant_id: 'resto-1',
    customer_id: 'cust-2',
    uid: '04A13BC92F9911',
    public_code: 'GW-LEO-002',
    is_active: true,
    created_at: todayIso,
  },
]

export const DEMO_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    restaurant_id: 'resto-1',
    title: 'Happy Hour de Merienda',
    description: '2x1 en cafe + cookie de 16:00 a 18:00.',
  },
  {
    id: 'promo-2',
    restaurant_id: 'resto-1',
    title: 'Doble puntaje martes',
    description: 'Cada consumo del martes suma puntos dobles.',
  },
]

export const DEMO_EVENTS: PointEvent[] = [
  {
    id: 'evt-1',
    restaurant_id: 'resto-1',
    customer_id: 'cust-1',
    source: 'nfc',
    type: 'add',
    amount: 1,
    item_label: 'Cafe latte',
    created_at: todayIso,
  },
]

export const DEMO_METRICS: DashboardMetrics = {
  activeCustomers: 84,
  visitsThisWeek: 212,
  avgRecurrenceDays: 5,
  loyaltyRedemptions: 17,
}

const STORAGE_KEY = 'gastro-whokey-localdb'

interface LocalDb {
  restaurants: Restaurant[]
  customers: Customer[]
  whokeys: Whokey[]
  promotions: Promotion[]
  events: PointEvent[]
}

export function readLocalDb(): LocalDb {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return {
      restaurants: DEMO_RESTAURANTS,
      customers: DEMO_CUSTOMERS,
      whokeys: DEMO_WHOKEYS,
      promotions: DEMO_PROMOTIONS,
      events: DEMO_EVENTS,
    }
  }

  try {
    return JSON.parse(raw) as LocalDb
  } catch {
    return {
      restaurants: DEMO_RESTAURANTS,
      customers: DEMO_CUSTOMERS,
      whokeys: DEMO_WHOKEYS,
      promotions: DEMO_PROMOTIONS,
      events: DEMO_EVENTS,
    }
  }
}

export function writeLocalDb(db: LocalDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}
