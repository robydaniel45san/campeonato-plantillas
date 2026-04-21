import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CampeonatoProvider } from '@/context/CampeonatoContext'
import { ToastProvider } from '@/components/ui/Toast'
import Layout from '@/components/layout/Layout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Campeonatos from '@/pages/Campeonatos'
import Equipos from '@/pages/Equipos'
import Jugadores from '@/pages/Jugadores'
import Partidos from '@/pages/Partidos'
import Fases from '@/pages/Fases'
import Posiciones from '@/pages/Posiciones'
import Estadisticas from '@/pages/Estadisticas'
import Configuracion from '@/pages/Configuracion'

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CampeonatoProvider>
              <Layout />
            </CampeonatoProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campeonatos"  element={<Campeonatos />} />
        <Route path="equipos"      element={<Equipos />} />
        <Route path="jugadores"    element={<Jugadores />} />
        <Route path="partidos"     element={<Partidos />} />
        <Route path="fases"        element={<Fases />} />
        <Route path="posiciones"   element={<Posiciones />} />
        <Route path="estadisticas" element={<Estadisticas />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
