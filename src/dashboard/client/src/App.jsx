import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/UI'
import LoginPage from './pages/LoginPage'
import ServersPage from './pages/ServersPage'
import DashboardPage from './pages/DashboardPage'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/"                    element={user ? <Navigate to="/servers" replace /> : <LoginPage />} />
      <Route path="/servers"             element={user ? <ServersPage /> : <Navigate to="/" replace />} />
      <Route path="/server/:guildId/*"   element={user ? <DashboardPage /> : <Navigate to="/" replace />} />
      <Route path="*"                    element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  )
}
