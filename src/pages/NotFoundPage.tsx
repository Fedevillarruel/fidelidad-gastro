import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="page-block narrow">
      <h2>Ruta no encontrada</h2>
      <p>La pagina que buscaste no existe en Gastro Whokey.</p>
      <Link to="/" className="primary-btn">
        Volver al inicio
      </Link>
    </section>
  )
}
