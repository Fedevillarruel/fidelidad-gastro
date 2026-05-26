import { createContext, useContext, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { UserRole } from '../types'

interface SessionData {
  role: UserRole
  restaurantSlug?: string
  customerCardCode?: string
}

interface AuthContextValue {
  session: SessionData | null
  login: (session: SessionData) => void
  logout: () => void
}

const STORAGE_KEY = 'gastro-whokey-session'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<SessionData | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw) as SessionData
    } catch {
      return null
    }
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login: (nextSession) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
        setSession(nextSession)
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY)
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
