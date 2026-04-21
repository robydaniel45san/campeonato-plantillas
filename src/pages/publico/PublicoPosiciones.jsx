import { useOutletContext } from 'react-router-dom'
import { usePosiciones } from '@/hooks/usePosiciones'
import { Loader2, Table2 } from 'lucide-react'

export default function PublicoPosiciones() {
  const { camp } = useOutletContext()
  const { data: posiciones, isLoading } = usePosiciones(camp.id)

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" /></div>
  )

  if (!posiciones?.length) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Table2 size={40} className="text-gray-700 mb-3" />
      <p className="text-gray-500">Aún no hay partidos finalizados</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Header tabla */}
        <div className="grid grid-cols-[auto_1fr_repeat(7,auto)] gap-0 px-4 py-3 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span className="w-7 text-center">#</span>
          <span className="ml-3">Equipo</span>
          <span className="w-8 text-center">PJ</span>
          <span className="w-8 text-center">PG</span>
          <span className="w-8 text-center hidden sm:block">PE</span>
          <span className="w-8 text-center hidden sm:block">PP</span>
          <span className="w-8 text-center hidden md:block">DG</span>
          <span className="w-10 text-center font-bold text-gray-400">PTS</span>
        </div>

        {posiciones.map((e, i) => {
          const pos = i + 1
          const dg = Number(e.dg)
          return (
            <div
              key={e.equipo_id}
              className={`grid grid-cols-[auto_1fr_repeat(7,auto)] gap-0 px-4 py-3.5 items-center border-b border-gray-800/50 last:border-0 transition-colors hover:bg-gray-800/40 ${
                pos === 1 ? 'bg-green-900/10' : ''
              }`}
            >
              {/* Posición */}
              <div className="w-7 flex justify-center">
                <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                  pos === 1 ? 'bg-green-600 text-white' :
                  pos === 2 ? 'bg-gray-600 text-white' :
                  pos === 3 ? 'bg-orange-700 text-white' :
                  'text-gray-500'
                }`}>{pos}</span>
              </div>

              {/* Equipo */}
              <div className="ml-3 flex items-center gap-2.5 min-w-0">
                {e.escudo_url
                  ? <img src={e.escudo_url} alt={e.nombre} className="w-7 h-7 object-contain rounded flex-shrink-0" />
                  : <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color_principal ?? '#4b5563' }} />
                }
                <span className="font-semibold text-sm truncate">{e.nombre}</span>
              </div>

              <span className="w-8 text-center text-sm text-gray-400">{e.pj}</span>
              <span className="w-8 text-center text-sm text-gray-400">{e.pg}</span>
              <span className="w-8 text-center text-sm text-gray-400 hidden sm:block">{e.pe}</span>
              <span className="w-8 text-center text-sm text-gray-400 hidden sm:block">{e.pp}</span>
              <span className={`w-8 text-center text-sm font-medium hidden md:block ${dg > 0 ? 'text-green-400' : dg < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                {dg > 0 ? `+${dg}` : dg}
              </span>
              <span className="w-10 text-center text-lg font-black text-white">{e.pts}</span>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 text-xs text-gray-600 px-1">
        <span>PJ: Jugados</span>
        <span>PG: Ganados</span>
        <span className="hidden sm:inline">PE: Empatados</span>
        <span className="hidden sm:inline">PP: Perdidos</span>
        <span className="hidden md:inline">DG: Dif. Goles</span>
        <span className="font-semibold text-gray-500">PTS: Puntos</span>
      </div>
    </div>
  )
}
