import { Table2 } from 'lucide-react'
import { usePosiciones } from '@/hooks/usePosiciones'
import { useCampeonato } from '@/context/CampeonatoContext'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

function TablaPosiciones({ datos }) {
  if (!datos?.length) {
    return (
      <div className="py-12 text-center text-gray-400">
        <Table2 size={36} className="mx-auto mb-2 text-gray-200" />
        Sin datos de posiciones
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Equipo</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">PJ</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase">PG</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">PE</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">PP</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">GF</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">GC</th>
            <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">DG</th>
            <th className="text-center px-3 py-3 text-xs font-bold text-gray-700 uppercase">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {datos.map((e, i) => {
            const pos = i + 1
            const zone = pos <= 1 ? 'bg-green-50' : pos <= 3 ? 'bg-blue-50/50' : ''
            return (
              <tr key={e.equipo_id} className={`hover:bg-gray-50 transition-colors ${zone}`}>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                    pos === 1 ? 'bg-green-600 text-white' :
                    pos === 2 ? 'bg-green-100 text-green-700' :
                    pos === 3 ? 'bg-blue-100 text-blue-700' :
                    'text-gray-500'
                  }`}>{pos}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {e.escudo_url ? (
                      <img src={e.escudo_url} alt={e.nombre} className="w-7 h-7 object-contain rounded" />
                    ) : (
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color_principal ?? '#6b7280' }} />
                    )}
                    <span className="font-medium text-gray-900">{e.nombre}</span>
                  </div>
                </td>
                <td className="text-center px-3 py-3 text-gray-600">{e.pj}</td>
                <td className="text-center px-3 py-3 text-gray-600">{e.pg}</td>
                <td className="text-center px-3 py-3 text-gray-600 hidden sm:table-cell">{e.pe}</td>
                <td className="text-center px-3 py-3 text-gray-600 hidden sm:table-cell">{e.pp}</td>
                <td className="text-center px-3 py-3 text-gray-600 hidden md:table-cell">{e.gf}</td>
                <td className="text-center px-3 py-3 text-gray-600 hidden md:table-cell">{e.gc}</td>
                <td className={`text-center px-3 py-3 hidden md:table-cell font-medium ${+e.dg > 0 ? 'text-green-600' : +e.dg < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                  {+e.dg > 0 ? `+${e.dg}` : e.dg}
                </td>
                <td className="text-center px-3 py-3 font-bold text-gray-900 text-base">{e.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-50 border border-green-200" /> Campeón</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" /> Clasificación</span>
      </div>
    </div>
  )
}

export default function Posiciones() {
  const { campeonatoActivo } = useCampeonato()
  const { data: posiciones, isLoading } = usePosiciones(campeonatoActivo?.id)

  if (!campeonatoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Table2 size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500">Selecciona un campeonato</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-gray-800">{campeonatoActivo.nombre}</h2>
        <span className="text-gray-400">·</span>
        <span className="text-sm text-gray-500 capitalize">{campeonatoActivo.formato}</span>
      </div>

      <Card>
        <div className="px-5 pt-5 pb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Table2 size={18} className="text-green-600" />
            Tabla de posiciones
          </h3>
        </div>
        {isLoading ? (
          <div className="px-5 pb-5 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : (
          <TablaPosiciones datos={posiciones} />
        )}
      </Card>

      <p className="text-xs text-gray-400">
        PJ: Partidos Jugados · PG: Ganados · PE: Empatados · PP: Perdidos · GF: Goles a Favor · GC: Goles en Contra · DG: Diferencia de Goles · PTS: Puntos
      </p>
    </div>
  )
}
