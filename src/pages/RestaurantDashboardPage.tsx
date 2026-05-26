import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Link } from 'react-router-dom'
import { getRestaurantBySlug, getRestaurantCustomers, getRestaurantMetrics } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Customer, DashboardMetrics, Restaurant } from '../types'

const EMPTY_METRICS: DashboardMetrics = {
  activeCustomers: 0,
  visitsThisWeek: 0,
  avgRecurrenceDays: 0,
  loyaltyRedemptions: 0,
}

export function RestaurantDashboardPage() {
  const { session } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadData() {
      if (!session?.restaurantSlug) {
        return
      }

      const found = await getRestaurantBySlug(session.restaurantSlug)
      if (!found) {
        setError('No se encontro ese restaurante. Revisa el slug en Ingresar.')
        return
      }

      setRestaurant(found)
      const [rows, metricsData] = await Promise.all([
        getRestaurantCustomers(found.id),
        getRestaurantMetrics(found.id),
      ])
      setCustomers(rows)
      setMetrics(metricsData)
    }

    loadData().catch((unknownError) => {
      setError(unknownError instanceof Error ? unknownError.message : 'Error cargando dashboard')
    })
  }, [session?.restaurantSlug])

  const ranking = useMemo(() => customers.slice(0, 8), [customers])

  return (
    <section className="page-block">
      <div className="section-head">
        <div>
          <h2>Panel restaurante</h2>
          <p>Visualiza clientes, recurrencia y rendimiento de tu programa de fidelidad.</p>
        </div>
        <Link to="/restaurant/scan" className="primary-btn">
          Ir a escaneo NFC / QR
        </Link>
      </div>

      {error && <p className="error-box">{error}</p>}

      {restaurant && (
        <>
          <div className="card-grid four">
            <article className="stat-card">
              <span>Clientes activos</span>
              <strong>{metrics.activeCustomers}</strong>
            </article>
            <article className="stat-card">
              <span>Visitas acumuladas</span>
              <strong>{metrics.visitsThisWeek}</strong>
            </article>
            <article className="stat-card">
              <span>Recurrencia promedio</span>
              <strong>{metrics.avgRecurrenceDays} dias</strong>
            </article>
            <article className="stat-card">
              <span>Canjes estimados</span>
              <strong>{metrics.loyaltyRedemptions}</strong>
            </article>
          </div>

          <div className="split-grid">
            <article className="panel-card">
              <h3>Ranking clientes</h3>
              <p>Top por puntos acumulados.</p>
              <ol className="ranking-list">
                {ranking.map((customer) => (
                  <li key={customer.id}>
                    <span>{customer.full_name}</span>
                    <strong>{customer.points} pts</strong>
                  </li>
                ))}
              </ol>
            </article>

            <article className="panel-card">
              <h3>Actividad por cliente</h3>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={ranking}>
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="full_name" hide />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="visits" fill={restaurant.primary_color} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  )
}
