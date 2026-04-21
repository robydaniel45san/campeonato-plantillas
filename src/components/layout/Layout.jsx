import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'
import { useRealtimePartidos } from '@/hooks/useRealtime'
import { useCampeonato } from '@/context/CampeonatoContext'

const titles = {
  '/':             'Dashboard',
  '/campeonatos':  'Campeonatos',
  '/equipos':      'Equipos',
  '/jugadores':    'Jugadores',
  '/partidos':     'Partidos',
  '/fases':        'Fases y Grupos',
  '/posiciones':   'Posiciones',
  '/estadisticas': 'Estadísticas',
  '/configuracion':'Configuración',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Campeonato'
  const { campeonatoActivo } = useCampeonato()
  useRealtimePartidos(campeonatoActivo?.id)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-200', collapsed ? 'ml-16' : 'ml-60')}>
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
