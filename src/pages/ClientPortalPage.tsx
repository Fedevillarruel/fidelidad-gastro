import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClientCardData } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { Promotion, Restaurant } from '../types'

export function ClientPortalPage() {
  const { session } = useAuth()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [points, setPoints] = useState(0)
  const [goal, setGoal] = useState(10)
  const [reward, setReward] = useState('Cafe gratis')
  const [promotions, setPromotions] = useState<Promotion[]>([])

  useEffect(() => {
    async function loadData() {
      if (!session?.restaurantSlug || !session.customerCardCode) {
        return
      }

      const cardData = await getClientCardData(session.restaurantSlug, session.customerCardCode)
      if (!cardData || !cardData.customer) {
        return
      }

      setRestaurant(cardData.restaurant)
      setPoints(cardData.customer.points)
      setGoal(cardData.restaurant.loyalty_goal)
      setReward(cardData.restaurant.loyalty_reward)
      setPromotions(cardData.promotions)
    }

    loadData().catch(() => undefined)
  }, [session?.customerCardCode, session?.restaurantSlug])

  const missing = Math.max(goal - points, 0)

  return (
    <section className="page-block">
      <div className="section-head">
        <div>
          <h2>Mi fidelidad</h2>
          <p>Tus puntos y promociones del restaurante.</p>
        </div>
        <Link to="/auth" className="secondary-btn">
          Cambiar perfil
        </Link>
      </div>

      <div className="progress-hero">
        <strong>{points}</strong>
        <span>puntos acumulados</span>
        <p>
          Te faltan <b>{missing}</b> para obtener: <b>{reward}</b>
        </p>
      </div>

      <div className="promo-grid">
        {promotions.map((promo) => (
          <article key={promo.id} className="promo-card">
            <h3>{promo.title}</h3>
            <p>{promo.description}</p>
          </article>
        ))}
      </div>

      {restaurant && (
        <p className="helper-text">
          Consejo: si tu llavero NFC tiene una URL escrita como
          <code>{` https://gastro-whokey.app/r/${restaurant.slug}/card/${session?.customerCardCode}`}</code>,
          al apoyarlo en el celular podras abrir directamente esta vista.
        </p>
      )}
    </section>
  )
}
