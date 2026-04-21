import { useOutletContext } from 'react-router-dom'
import { useGoleadores } from '@/hooks/usePosiciones'
import { Loader2, BarChart2 } from 'lucide-react'

const MEDALLA = ['🥇', '🥈', '🥉']

const POSICION_COLOR = {
  Portero:        'bg-blue-500/20 text-blue-400',
  Defensa:        'bg-green-500/20 text-green-400',
  Centrocampista: 'bg-orange-500/20 text-orange-400',
  Delantero:      'bg-red-500/20 text-red-400',
}

export default function PublicoGoleadores() {
  const { camp } = useOutletContext()
  const { data: goleadores, isLoading } = useGoleadores(camp.id)

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" /></div>
  )

  if (!goleadores?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <BarChart2 size={40} className="text-gray-700 mb-3" />
      <p className="text-gray-500">Sin goles registrados aún</p>
    </div>
  )

  const max = goleadores[0]?.goles ?? 1

  return (
    <div className="space-y-2">
      {goleadores.map((g, i) => (
        <div
          key={g.jugador_id}
          className={`bg-gray-900 border rounded-2xl p-4 flex items-center gap-4 ${
            i === 0 ? 'border-yellow-500/40 shadow-lg shadow-yellow-900/10' : 'border-gray-800'
          }`}
        >
          {/* Posición */}
          <div className="w-8 text-center flex-shrink-0">
            {i < 3
              ? <span className="text-xl">{MEDALLA[i]}</span>
              : <span className="text-gray-600 font-bold text-sm">{i + 1}</span>
            }
          </div>

          {/* Foto */}
          {g.foto_url ? (
            <img src={g.foto_url} alt={g.nombre} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 flex-shrink-0">
              {g.nombre?.[0]}{g.apellido?.[0]}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{g.nombre} {g.apellido}</span>
              {g.posicion && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${POSICION_COLOR[g.posicion]}`}>
                  {g.posicion}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {g.equipo_escudo && (
                <img src={g.equipo_escudo} alt={g.equipo_nombre} className="w-4 h-4 object-contain" />
              )}
              <span className="text-xs text-gray-500 truncate">{g.equipo_nombre}</span>
              {g.penales > 0 && (
                <span className="text-xs text-gray-600">· {g.penales}P pen.</span>
              )}
            </div>

            {/* Barra de progreso */}
            <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${i === 0 ? 'bg-yellow-500' : 'bg-green-600'}`}
                style={{ width: `${(g.goles / max) * 100}%` }}
              />
            </div>
          </div>

          {/* Goles */}
          <div className="text-right flex-shrink-0">
            <span className={`text-3xl font-black tabular-nums ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
              {g.goles}
            </span>
            <p className="text-xs text-gray-600">goles</p>
          </div>
        </div>
      ))}
    </div>
  )
}
