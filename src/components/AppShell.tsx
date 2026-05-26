import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Shield, Store, User } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../context/AuthContext'

export function AppShell({ children }: PropsWithChildren) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-pill">
          Gastro Whokey
        </Link>
        <nav className="topnav">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/auth">Ingresar</NavLink>
          {session?.role === 'restaurant' && <NavLink to="/restaurant">Panel Restaurante</NavLink>}
          {session?.role === 'client' && <NavLink to="/client">Mi Fidelidad</NavLink>}
          {session?.role === 'super_admin' && <NavLink to="/super-admin">Super Admin</NavLink>}
        </nav>

        <div className="session-chip">
          {session?.role === 'restaurant' && <Store size={16} />}
          {session?.role === 'client' && <User size={16} />}
          {session?.role === 'super_admin' && <Shield size={16} />}
          <span>{session ? session.role.replace('_', ' ') : 'sin sesion'}</span>
          {session && (
            <button className="ghost-btn" type="button" onClick={onLogout}>
              <LogOut size={14} />
              Salir
            </button>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}
