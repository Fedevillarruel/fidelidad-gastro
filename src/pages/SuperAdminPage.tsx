import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createRestaurant, getRestaurants } from '../lib/api'
import type { Restaurant } from '../types'

export function SuperAdminPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [feedback, setFeedback] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#C24D2C')
  const [secondaryColor, setSecondaryColor] = useState('#F1DFC5')
  const [loyaltyGoal, setLoyaltyGoal] = useState(10)
  const [reward, setReward] = useState('Cafe gratis')
  const [unit, setUnit] = useState('cafes')

  async function refresh() {
    const data = await getRestaurants()
    setRestaurants(data)
  }

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [])

  async function onCreateRestaurant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const created = await createRestaurant({
        name,
        slug,
        primaryColor,
        secondaryColor,
        loyaltyGoal,
        loyaltyReward: reward,
        loyaltyUnit: unit,
      })

      setFeedback(`Restaurante creado: ${created.name}`)
      setName('')
      setSlug('')
      await refresh()
    } catch (unknownError) {
      setFeedback(unknownError instanceof Error ? unknownError.message : 'No se pudo crear el restaurante')
    }
  }

  return (
    <section className="page-block">
      <div className="section-head">
        <div>
          <h2>Super Admin</h2>
          <p>Alta de restaurantes y configuracion inicial de fidelidad.</p>
        </div>
      </div>

      <div className="split-grid">
        <article className="panel-card">
          <h3>Crear restaurante</h3>
          <form className="form-grid" onSubmit={onCreateRestaurant}>
            <label>
              Nombre
              <input required value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Slug unico
              <input required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} />
            </label>
            <label>
              Color primario
              <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
            </label>
            <label>
              Color secundario
              <input type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
            </label>
            <label>
              Meta de puntos
              <input
                type="number"
                min={1}
                value={loyaltyGoal}
                onChange={(event) => setLoyaltyGoal(Number(event.target.value))}
              />
            </label>
            <label>
              Recompensa
              <input value={reward} onChange={(event) => setReward(event.target.value)} />
            </label>
            <label>
              Unidad
              <input value={unit} onChange={(event) => setUnit(event.target.value)} />
            </label>
            <button className="primary-btn" type="submit">
              Dar de alta
            </button>
          </form>
          {feedback && <p className="success-box">{feedback}</p>}
        </article>

        <article className="panel-card">
          <h3>Restaurantes registrados</h3>
          <ul className="restaurant-list">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <div className="swatch" style={{ background: restaurant.primary_color }} />
                <div>
                  <strong>{restaurant.name}</strong>
                  <p>/{restaurant.slug}</p>
                </div>
                <span>
                  {restaurant.loyalty_goal} {restaurant.loyalty_unit}
                </span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
