import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { ClientCardPage } from './pages/ClientCardPage'
import { ClientPortalPage } from './pages/ClientPortalPage'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RestaurantDashboardPage } from './pages/RestaurantDashboardPage'
import { RestaurantScanPage } from './pages/RestaurantScanPage'
import { SuperAdminPage } from './pages/SuperAdminPage'
import type { UserRole } from './types'

function RequireRole({ role, children }: { role: UserRole; children: ReactElement }) {
  const { session } = useAuth()

  if (!session || session.role !== role) {
    return <Navigate to="/auth" replace />
  }

  return children
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/restaurant"
          element={
            <RequireRole role="restaurant">
              <RestaurantDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/restaurant/scan"
          element={
            <RequireRole role="restaurant">
              <RestaurantScanPage />
            </RequireRole>
          }
        />
        <Route
          path="/client"
          element={
            <RequireRole role="client">
              <ClientPortalPage />
            </RequireRole>
          }
        />
        <Route path="/r/:slug/card/:cardCode" element={<ClientCardPage />} />
        <Route
          path="/super-admin"
          element={
            <RequireRole role="super_admin">
              <SuperAdminPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
