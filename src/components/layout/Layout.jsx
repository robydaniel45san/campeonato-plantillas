import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { useRealtimePartidos } from '@/hooks/useRealtime'
import { useCampeonato } from '@/context/CampeonatoContext'

const titles = {
  '/':              'Dashboard',
  '/campeonatos':   'Campeonatos',
  '/equipos':       'Equipos',
  '/jugadores':     'Jugadores',
  '/partidos':      'Partidos',
  '/fases':         'Fases y Grupos',
  '/posiciones':    'Posiciones',
  '/estadisticas':  'Estadísticas',
  '/configuracion': 'Configuración',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Campeonato'
  const { campeonatoActivo } = useCampeonato()
  useRealtimePartidos(campeonatoActivo?.id)

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => { setMobileOpen(false) }, [pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Sidebar móvil (drawer) */}
      <div className={cn(
        'fixed top-0 left-0 h-screen z-30 lg:hidden transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <Sidebar collapsed={false} setCollapsed={() => {}} />
      </div>

      {/* Contenido principal */}
      <div className={cn(
        'flex-1 flex flex-col min-w-0 transition-all duration-200',
        'lg:' + (collapsed ? 'ml-16' : 'ml-60'),
      )}>
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
