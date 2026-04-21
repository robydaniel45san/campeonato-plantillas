import { useEffect, useState } from 'react'
import { Outlet, NavLink, useParams, Navigate } from 'react-router-dom'
import { Trophy, Calendar, Table2, BarChart2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const tabs = [
  { to: 'fixture',    icon: Calendar, label: 'Fixture' },
  { to: 'posiciones', icon: Table2,   label: 'Posiciones' },
  { to: 'goleadores', icon: BarChart2, label: 'Goleadores' },
]

export default function PublicoLayout() {
  const { campeonatoId } = useParams()
  const [camp, setCamp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('campeonatos')
      .select('*')
      .eq('id', campeonatoId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setCamp(data)
        setLoading(false)
      })
  }, [campeonatoId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 size={32} className="text-green-500 animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-3">
      <Trophy size={48} className="text-gray-600" />
      <p className="text-lg font-semibold">Campeonato no encontrado</p>
      <p className="text-gray-500 text-sm">Verifica el enlace con el organizador</p>
    </div>
  )

  const estadoColor = {
    activo:     'bg-green-500/20 text-green-400 border-green-500/30',
    finalizado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    borrador:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
    suspendido: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-900/40">
              <Trophy size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{camp.nombre}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${estadoColor[camp.estado]}`}>
                  {camp.estado}
                </span>
                <span className="text-xs text-gray-500 capitalize">{camp.formato}</span>
                {camp.fecha_inicio && (
                  <span className="text-xs text-gray-500">
                    {new Date(camp.fecha_inicio).toLocaleDateString('es-BO')}
                    {camp.fecha_fin && ` → ${new Date(camp.fecha_fin).toLocaleDateString('es-BO')}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet context={{ camp }} />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-700 border-t border-gray-900 mt-8">
        Vista pública · Solo lectura
      </footer>
    </div>
  )
}
