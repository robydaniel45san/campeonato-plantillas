import { NavLink } from 'react-router-dom'
import {
  Trophy, LayoutDashboard, Shield, Users, Calendar,
  BarChart2, Table2, Settings, ChevronLeft, ChevronRight,
  LogOut, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useCampeonato } from '@/context/CampeonatoContext'

const nav = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campeonatos',  icon: Trophy,          label: 'Campeonatos' },
  { to: '/equipos',      icon: Shield,          label: 'Equipos' },
  { to: '/jugadores',    icon: Users,           label: 'Jugadores' },
  { to: '/partidos',     icon: Calendar,        label: 'Partidos' },
  { to: '/fases',        icon: Layers,          label: 'Fases' },
  { to: '/posiciones',   icon: Table2,          label: 'Posiciones' },
  { to: '/estadisticas', icon: BarChart2,       label: 'Estadísticas' },
  { to: '/configuracion',icon: Settings,        label: 'Configuración' },
]

export function Sidebar({ collapsed, setCollapsed }) {
  const { signOut, user } = useAuth()
  const { campeonatoActivo } = useCampeonato()

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col z-30 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-gray-800', collapsed && 'justify-center px-0')}>
        <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
          <Trophy size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">Campeonato</p>
            {campeonatoActivo && (
              <p className="text-xs text-gray-400 truncate">{campeonatoActivo.nombre}</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5',
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
                collapsed && 'justify-center px-0 mx-1',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-2 space-y-1">
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors',
            collapsed && 'justify-center px-0',
          )}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        {!collapsed && user && (
          <p className="px-3 text-xs text-gray-600 truncate">{user.email}</p>
        )}
      </div>

      {/* Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-gray-900 border border-gray-700 rounded-full p-1 text-gray-400 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
