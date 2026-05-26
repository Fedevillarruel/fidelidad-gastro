import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getClientCardData } from '../lib/api'
import type { Promotion } from '../types'

export function ClientCardPage() {
  const { slug = '', cardCode = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [points, setPoints] = useState(0)
  const [goal, setGoal] = useState(10)
  const [reward, setReward] = useState('Cafe gratis')
  const [promotions, setPromotions] = useState<Promotion[]>([])

  useEffect(() => {
    async function load() {
      const data = await getClientCardData(slug, cardCode)
      if (!data || !data.customer) {
        setLoading(false)
        return
      }

      setName(data.customer.full_name)
      setPoints(data.customer.points)
      setGoal(data.restaurant.loyalty_goal)
      setReward(data.restaurant.loyalty_reward)
      setPromotions(data.promotions)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [slug, cardCode])

  if (loading) {
    return <section className="page-block">Cargando tarjeta...</section>
  }

  const missing = Math.max(goal - points, 0)

  return (
    <section className="page-block narrow">
      <h2>Hola {name || 'cliente'}!</h2>
      <div className="progress-hero compact">
        <strong>{points}</strong>
        <span>puntos</span>
        <p>
          Te faltan <b>{missing}</b> para: <b>{reward}</b>
        </p>
      </div>

      <div className="promo-grid">
        {promotions.map((promotion) => (
          <article className="promo-card" key={promotion.id}>
            <h3>{promotion.title}</h3>
            <p>{promotion.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
