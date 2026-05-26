import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role, setRole] = useState<UserRole>('restaurant')
  const [restaurantSlug, setRestaurantSlug] = useState('cafe-central')
  const [customerCardCode, setCustomerCardCode] = useState('GW-ANA-001')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    login({
      role,
      restaurantSlug: role !== 'super_admin' ? restaurantSlug : undefined,
      customerCardCode: role === 'client' ? customerCardCode : undefined,
    })

    if (role === 'restaurant') {
      navigate('/restaurant')
      return
    }

    if (role === 'client') {
      navigate('/client')
      return
    }

    navigate('/super-admin')
  }

  return (
    <section className="page-block narrow">
      <h2>Ingreso rapido por perfil</h2>
      <p>
        Este MVP usa un acceso rapido por rol. En produccion se recomienda activar Auth real de Supabase
        con email/password u OTP.
      </p>

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Perfil
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            <option value="restaurant">Restaurante</option>
            <option value="client">Cliente</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </label>

        {role !== 'super_admin' && (
          <label>
            Slug restaurante
            <input
              value={restaurantSlug}
              onChange={(event) => setRestaurantSlug(event.target.value)}
              placeholder="cafe-central"
            />
          </label>
        )}

        {role === 'client' && (
          <label>
            Codigo de Whokey
            <input
              value={customerCardCode}
              onChange={(event) => setCustomerCardCode(event.target.value)}
              placeholder="GW-ANA-001"
            />
          </label>
        )}

        <button className="primary-btn" type="submit">
          Continuar
        </button>
      </form>
    </section>
  )
}
