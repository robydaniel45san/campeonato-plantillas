import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Trophy, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { FORMATO_CAMPEONATO } from '@/lib/utils'

const estadoColor = {
  activo:     'bg-green-500/20 text-green-400 border-green-500/30',
  finalizado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  borrador:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  suspendido: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function PublicoIndex() {
  const [campeonatos, setCampeonatos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('campeonatos')
      .select('*')
      .in('estado', ['activo', 'finalizado'])
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCampeonatos(data ?? []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 bg-green-600 rounded-2xl items-center justify-center mb-4 shadow-xl shadow-green-900/40">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-black">Campeonatos</h1>
          <p className="text-gray-500 mt-2 text-sm">Selecciona un campeonato para ver el fixture y posiciones</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-green-500" /></div>
        ) : campeonatos.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Trophy size={40} className="mx-auto mb-3 text-gray-800" />
            No hay campeonatos disponibles aún
          </div>
        ) : (
          <div className="space-y-3">
            {campeonatos.map(c => (
              <Link
                key={c.id}
                to={`/p/${c.id}/fixture`}
                className="flex items-center gap-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-all group"
              >
                <div className="w-12 h-12 bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-green-600/20 transition-colors">
                  <Trophy size={22} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-base truncate">{c.nombre}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${estadoColor[c.estado]}`}>
                      {c.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="capitalize">{FORMATO_CAMPEONATO[c.formato]}</span>
                    {c.fecha_inicio && (
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(c.fecha_inicio).toLocaleDateString('es-BO')}
                        {c.fecha_fin && ` → ${new Date(c.fecha_fin).toLocaleDateString('es-BO')}`}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-700 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
