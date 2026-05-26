import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Store, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'

export function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [role, setRole] = useState<UserRole>('restaurant')
  const [restaurantSlug, setRestaurantSlug] = useState('cafe-central')
  const [customerCardCode, setCustomerCardCode] = useState('GW-ANA-001')
  const [error, setError] = useState('')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (role !== 'super_admin' && !restaurantSlug.trim()) {
      setError('Ingresa el slug del restaurante.')
      return
    }

    if (role === 'client' && !customerCardCode.trim()) {
      setError('Ingresa el codigo del Whokey para entrar como cliente.')
      return
    }

    setError('')

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
      <div className="auth-grid">
        <aside className="auth-side">
          <p className="eyebrow">Ingreso WhoKey</p>
          <h2>Accede en segundos</h2>
          <p>
            Elige el perfil de acceso para operar restaurante, consultar puntos de cliente o administrar
            locales desde el panel central.
          </p>
          <ul>
            <li>
              <Store size={16} /> Restaurante: carga NFC/QR y opera puntos.
            </li>
            <li>
              <UserRound size={16} /> Cliente: visualiza progreso y promociones.
            </li>
            <li>
              <Shield size={16} /> Super admin: da de alta nuevos restaurantes.
            </li>
          </ul>
        </aside>

        <form className="form-grid auth-form-card" onSubmit={onSubmit}>
          <div className="role-picker" role="tablist" aria-label="Seleccion de perfil">
            <button
              type="button"
              className={`role-btn ${role === 'restaurant' ? 'active' : ''}`}
              onClick={() => setRole('restaurant')}
            >
              Restaurante
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'client' ? 'active' : ''}`}
              onClick={() => setRole('client')}
            >
              Cliente
            </button>
            <button
              type="button"
              className={`role-btn ${role === 'super_admin' ? 'active' : ''}`}
              onClick={() => setRole('super_admin')}
            >
              Super admin
            </button>
          </div>

          {role !== 'super_admin' && (
            <label>
              Slug del restaurante
              <input
                value={restaurantSlug}
                onChange={(event) => setRestaurantSlug(event.target.value.toLowerCase())}
                placeholder="cafe-central"
              />
            </label>
          )}

          {role === 'client' && (
            <label>
              Codigo Whokey o QR
              <input
                value={customerCardCode}
                onChange={(event) => setCustomerCardCode(event.target.value.toUpperCase())}
                placeholder="GW-ANA-001"
              />
            </label>
          )}

          {error && <p className="error-box">{error}</p>}

          <button className="primary-btn" type="submit">
            Continuar al panel
          </button>
        </form>
      </div>
    </section>
  )
}
