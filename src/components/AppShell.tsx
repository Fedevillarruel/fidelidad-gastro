import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Shield, Store, User, X } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { useAuth } from '../context/AuthContext'

export function AppShell({ children }: PropsWithChildren) {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function onLogout() {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand-pill" onClick={closeMenu}>
          <strong>Gastro Whokey</strong>
          <span>Loyalty NFC + QR</span>
        </Link>

        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>

        <nav className={`topnav ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/" end onClick={closeMenu}>
            Inicio
          </NavLink>
          <NavLink to="/auth" onClick={closeMenu}>
            Ingresar
          </NavLink>
          {session?.role === 'restaurant' && (
            <NavLink to="/restaurant" onClick={closeMenu}>
              Panel Restaurante
            </NavLink>
          )}
          {session?.role === 'client' && (
            <NavLink to="/client" onClick={closeMenu}>
              Mi Fidelidad
            </NavLink>
          )}
          {session?.role === 'super_admin' && (
            <NavLink to="/super-admin" onClick={closeMenu}>
              Super Admin
            </NavLink>
          )}
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
