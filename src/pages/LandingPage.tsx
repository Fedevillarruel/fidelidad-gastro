import { Link } from 'react-router-dom'
import { QrCode, Radio, Shield, Store, UserRound } from 'lucide-react'

export function LandingPage() {
  return (
    <section className="hero-layout">
      <div className="orb orb-a" aria-hidden="true" />
      <div className="orb orb-b" aria-hidden="true" />

      <div className="hero-copy">
        <p className="eyebrow">Fidelidad gastronomica con NFC + QR</p>
        <h1>Gastro Whokey</h1>
        <p>
          Una app para restaurantes que registra consumos con llaveros NFC 215 o QR,
          premia recurrencia y da visibilidad en tiempo real al cliente sobre sus puntos.
        </p>
        <div className="hero-highlights">
          <span>Whokey NFC 215</span>
          <span>QR backup</span>
          <span>Panel multirol</span>
        </div>
        <div className="hero-actions">
          <Link to="/auth" className="primary-btn">
            Entrar a la plataforma
          </Link>
          <a className="secondary-btn" href="#roles">
            Ver perfiles
          </a>
        </div>
      </div>

      <div className="hero-panel">
        <div className="metric-stack">
          <strong>+34%</strong>
          <span>retencion mensual</span>
        </div>
        <div className="metric-stack">
          <strong>2.1x</strong>
          <span>recurrencia por cliente</span>
        </div>
        <div className="metric-stack">
          <strong>NFC 215</strong>
          <span>alta y carga en segundos</span>
        </div>
      </div>

      <div id="roles" className="roles-grid">
        <article>
          <Store size={20} />
          <h3>Perfil Restaurante</h3>
          <p>Configura branding, productos, promociones, puntos y opera NFC/QR.</p>
        </article>
        <article>
          <UserRound size={20} />
          <h3>Perfil Cliente</h3>
          <p>Ve progreso, puntos restantes y promociones activas del local.</p>
        </article>
        <article>
          <Shield size={20} />
          <h3>Super Admin</h3>
          <p>Da de alta restaurantes y monitorea salud general de la red.</p>
        </article>
        <article>
          <Radio size={20} />
          <h3>Flujo NFC</h3>
          <p>Detecta llave nueva, la inicializa y la vincula a un cliente.</p>
        </article>
        <article>
          <QrCode size={20} />
          <h3>Flujo QR</h3>
          <p>Alternativa exacta para sumar/restar/reiniciar puntos por escaneo.</p>
        </article>
      </div>
    </section>
  )
}
