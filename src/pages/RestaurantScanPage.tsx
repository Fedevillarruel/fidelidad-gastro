import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ScanQrCode, SmartphoneNfc } from 'lucide-react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { applyPointsEvent, getRestaurantBySlug, upsertWhokeyAndMaybeCustomer } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { PointEvent } from '../types'

function supportsWebNfc() {
  return 'NDEFReader' in window
}

export function RestaurantScanPage() {
  const { session } = useAuth()

  const [manualCode, setManualCode] = useState('GW-ANA-001')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [itemLabel, setItemLabel] = useState('Cafe')
  const [amount, setAmount] = useState(1)
  const [eventType, setEventType] = useState<PointEvent['type']>('add')
  const [source, setSource] = useState<PointEvent['source']>('nfc')
  const [feedback, setFeedback] = useState('')
  const [nfcAvailable] = useState(supportsWebNfc())
  const [showQrCamera, setShowQrCamera] = useState(false)

  const restaurantSlug = session?.restaurantSlug ?? ''

  const isReady = useMemo(
    () => Boolean(restaurantSlug && manualCode.trim().length > 0),
    [manualCode, restaurantSlug],
  )

  async function ensureRestaurant() {
    const restaurant = await getRestaurantBySlug(restaurantSlug)

    if (!restaurant) {
      throw new Error('No se encontro restaurante. Reingresa desde Ingresar.')
    }

    return restaurant
  }

  async function onRegisterNewWhokey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const restaurant = await ensureRestaurant()
      const created = await upsertWhokeyAndMaybeCustomer({
        restaurantId: restaurant.id,
        uid: manualCode,
        customerName: customerName || 'Cliente sin nombre',
        phone: customerPhone,
      })

      if (nfcAvailable && supportsWebNfc()) {
        const payload = JSON.stringify({
          app: 'Gastro Whokey',
          cardCode: created.public_code,
          restaurant: restaurant.slug,
          url: `${window.location.origin}/r/${restaurant.slug}/card/${created.public_code}`,
        })

        const writer = new NDEFReader()
        await writer.write(payload)
      }

      setFeedback(`Whokey vinculado. Codigo publico: ${created.public_code}`)
      setManualCode(created.public_code)
    } catch (unknownError) {
      setFeedback(unknownError instanceof Error ? unknownError.message : 'No se pudo registrar el Whokey')
    }
  }

  async function onApplyEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isReady) {
      return
    }

    try {
      const restaurant = await ensureRestaurant()
      const updated = await applyPointsEvent({
        restaurantId: restaurant.id,
        codeOrUid: manualCode,
        type: eventType,
        amount,
        source,
        itemLabel,
      })

      setFeedback(
        `Operacion OK para ${updated.full_name}: ${updated.points} puntos totales.`,
      )
    } catch (unknownError) {
      setFeedback(unknownError instanceof Error ? unknownError.message : 'No se pudo aplicar evento')
    }
  }

  return (
    <section className="page-block">
      <div className="section-head">
        <div>
          <h2>Operacion NFC / QR</h2>
          <p>Alta de llavero nuevo y carga de puntos en un mismo flujo.</p>
        </div>
        <Link to="/restaurant" className="secondary-btn">
          Volver al dashboard
        </Link>
      </div>

      <div className="split-grid">
        <article className="panel-card">
          <h3>
            <SmartphoneNfc size={18} /> Alta o grabacion de Whokey
          </h3>
          <form className="form-grid" onSubmit={onRegisterNewWhokey}>
            <label>
              UID NFC o codigo temporal
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="04A11BC92F7780"
              />
            </label>
            <label>
              Nombre cliente
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Ana Torres"
              />
            </label>
            <label>
              Telefono
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+54911..."
              />
            </label>
            <button className="primary-btn" type="submit">
              Registrar / Escribir Whokey
            </button>
            {!nfcAvailable && (
              <p className="helper-text">
                Este navegador no soporta Web NFC. Puedes registrar igual por UID/codigo y usar QR como backup.
              </p>
            )}
          </form>
        </article>

        <article className="panel-card">
          <h3>
            <ScanQrCode size={18} /> Sumar, restar o reiniciar puntos
          </h3>
          <form className="form-grid" onSubmit={onApplyEvent}>
            <label>
              Codigo Whokey o UID
              <input value={manualCode} onChange={(event) => setManualCode(event.target.value)} />
            </label>
            <label>
              Operacion
              <select value={eventType} onChange={(event) => setEventType(event.target.value as PointEvent['type'])}>
                <option value="add">Sumar</option>
                <option value="subtract">Restar</option>
                <option value="reset">Reiniciar</option>
              </select>
            </label>
            <label>
              Cantidad
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label>
              Producto / Item
              <input value={itemLabel} onChange={(event) => setItemLabel(event.target.value)} />
            </label>
            <label>
              Fuente
              <select value={source} onChange={(event) => setSource(event.target.value as PointEvent['source'])}>
                <option value="nfc">NFC</option>
                <option value="qr">QR</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <button className="primary-btn" type="submit">
              Aplicar movimiento
            </button>
          </form>

          <button className="ghost-btn" type="button" onClick={() => setShowQrCamera((v) => !v)}>
            {showQrCamera ? 'Ocultar camara QR' : 'Abrir camara QR'}
          </button>

          {showQrCamera && (
            <div className="scanner-wrap">
              <Scanner
                onScan={(detectedCodes) => {
                  const raw = detectedCodes[0]?.rawValue
                  if (raw) {
                    setManualCode(raw)
                    setSource('qr')
                    setFeedback(`QR detectado: ${raw}`)
                  }
                }}
                onError={() => setFeedback('No se pudo leer QR con la camara')}
              />
            </div>
          )}
        </article>
      </div>

      {feedback && <p className="success-box">{feedback}</p>}
    </section>
  )
}
