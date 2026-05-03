import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Clock, Loader2 } from 'lucide-react'
import { formatDateTime, ESTADO_PARTIDO } from '@/lib/utils'

function usePartidosPublicos(campeonatoId) {
  return useQuery({
    queryKey: ['publico_partidos', campeonatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partidos')
        .select(`
          *,
          equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url, color_principal),
          equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url, color_principal),
          cancha:canchas(nombre),
          fase:fases(nombre)
        `)
        .eq('campeonato_id', campeonatoId)
        .order('fecha', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data
    },
  })
}

function EscudoEquipo({ equipo, size = 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10'
  if (equipo?.escudo_url) {
    return <img src={equipo.escudo_url} alt={equipo.nombre} className={`${s} object-contain rounded`} />
  }
  return (
    <div className={`${s} rounded-lg flex-shrink-0`} style={{ backgroundColor: (equipo?.color_principal ?? '#374151') + '33' }}>
      <div className="w-full h-full rounded-lg" style={{ backgroundColor: equipo?.color_principal ?? '#374151', opacity: 0.6 }} />
    </div>
  )
}

export default function PublicoFixture() {
  const { camp } = useOutletContext()
  const { data: partidos, isLoading } = usePartidosPublicos(camp.id)
  const [filtro, setFiltro] = useState('todos')

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" /></div>
  )

  // Agrupar por jornada
  const jornadasMap = new Map()
  for (const p of partidos ?? []) {
    const key = p.jornada ?? 0
    if (!jornadasMap.has(key)) jornadasMap.set(key, [])
    jornadasMap.get(key).push(p)
  }
  const jornadas = Array.from(jornadasMap.entries()).sort((a, b) => a[0] - b[0])

  const filtrados = filtro === 'todos'
    ? jornadas
    : jornadas.map(([j, ps]) => [j, ps.filter(p => p.estado === filtro)]).filter(([, ps]) => ps.length > 0)

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['todos', 'programado', 'en_curso', 'finalizado'].map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtro === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {f === 'todos' ? 'Todos' : ESTADO_PARTIDO[f]?.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Calendar size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-500">Sin partidos disponibles</p>
        </div>
      )}

      {filtrados.map(([jornada, ps]) => (
        <div key={jornada}>
          {jornada > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-gray-800" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {jornada === 0 ? 'Sin jornada' : `Jornada ${jornada}`}
              </span>
              <div className="h-px flex-1 bg-gray-800" />
            </div>
          )}

          <div className="space-y-2">
            {ps.map(p => {
              const est = ESTADO_PARTIDO[p.estado]
              const finalizado = p.estado === 'finalizado'
              const enCurso = p.estado === 'en_curso'

              return (
                <div
                  key={p.id}
                  className={`bg-gray-900 rounded-2xl p-4 border ${
                    enCurso ? 'border-green-500/50 shadow-lg shadow-green-900/20' : 'border-gray-800'
                  }`}
                >
                  {/* Estado badge — siempre visible */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      {enCurso && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        enCurso ? 'text-green-400' :
                        finalizado ? 'text-gray-500' :
                        'text-blue-400'
                      }`}>
                        {est?.label ?? p.estado}
                      </span>
                    </div>
                    {p.fase && (
                      <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                        {p.fase.nombre}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Equipo local */}
                    <div className="flex-1 flex flex-col items-end gap-1.5">
                      <EscudoEquipo equipo={p.equipo_local} />
                      <span className="text-sm font-semibold text-right leading-tight">{p.equipo_local?.nombre}</span>
                    </div>

                    {/* Marcador / vs */}
                    <div className="flex-shrink-0 text-center min-w-20">
                      {finalizado || enCurso ? (
                        <div className="bg-gray-800 rounded-xl px-3 py-2">
                          <span className="text-2xl font-black tabular-nums">
                            {p.goles_local} <span className="text-gray-500">—</span> {p.goles_visitante}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-gray-500 text-sm font-medium block">vs</span>
                          {p.fecha && (
                            <span className="text-xs text-gray-600 block">
                              {new Date(p.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Equipo visitante */}
                    <div className="flex-1 flex flex-col items-start gap-1.5">
                      <EscudoEquipo equipo={p.equipo_visitante} />
                      <span className="text-sm font-semibold text-left leading-tight">{p.equipo_visitante?.nombre}</span>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                    {p.fecha ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {formatDateTime(p.fecha)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-700 italic">Sin fecha programada</span>
                    )}
                    {p.cancha && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} />
                        {p.cancha.nombre}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
