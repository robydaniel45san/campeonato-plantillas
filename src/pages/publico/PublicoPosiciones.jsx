import { useOutletContext } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Loader2, Table2 } from 'lucide-react'

function usePosicionesPublico(campeonatoId) {
  return useQuery({
    queryKey: ['pub_posiciones', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posiciones')
        .select('*')
        .eq('campeonato_id', campeonatoId)
      if (error) throw error

      // Agrupar por grupo_id
      const grupos = new Map()
      for (const row of data) {
        const key = row.grupo_id ?? '__general__'
        if (!grupos.has(key)) grupos.set(key, [])
        grupos.get(key).push(row)
      }
      return grupos
    },
  })
}

function useFasesPublico(campeonatoId) {
  return useQuery({
    queryKey: ['pub_fases', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const { data } = await supabase
        .from('fases')
        .select('*, grupos(id, nombre)')
        .eq('campeonato_id', campeonatoId)
        .order('orden')
      return data ?? []
    },
  })
}

function TablaEquipos({ rows }) {
  if (!rows?.length) return (
    <p className="text-gray-600 text-sm py-4 text-center">Sin datos aún</p>
  )
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <th className="text-left px-3 py-2 w-7">#</th>
            <th className="text-left px-2 py-2">Equipo</th>
            <th className="text-center px-2 py-2">PJ</th>
            <th className="text-center px-2 py-2">PG</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">PE</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">PP</th>
            <th className="text-center px-2 py-2 hidden md:table-cell">DG</th>
            <th className="text-center px-2 py-2 font-bold text-gray-400">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {rows.map((e, i) => {
            const dg = Number(e.dg)
            const pos = i + 1
            return (
              <tr key={e.equipo_id} className={`hover:bg-gray-800/30 transition-colors ${pos === 1 ? 'bg-green-900/10' : ''}`}>
                <td className="px-3 py-3">
                  <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                    pos === 1 ? 'bg-green-600 text-white' :
                    pos === 2 ? 'bg-gray-600 text-white' :
                    pos === 3 ? 'bg-orange-700 text-white' : 'text-gray-500'
                  }`}>{pos}</span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2">
                    {e.escudo_url
                      ? <img src={e.escudo_url} alt={e.nombre} className="w-6 h-6 object-contain rounded flex-shrink-0" />
                      : <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color_principal ?? '#4b5563' }} />
                    }
                    <span className="font-semibold text-sm truncate max-w-28 sm:max-w-none">{e.nombre}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-3 text-gray-400">{e.pj}</td>
                <td className="text-center px-2 py-3 text-gray-400">{e.pg}</td>
                <td className="text-center px-2 py-3 text-gray-400 hidden sm:table-cell">{e.pe}</td>
                <td className="text-center px-2 py-3 text-gray-400 hidden sm:table-cell">{e.pp}</td>
                <td className={`text-center px-2 py-3 font-medium hidden md:table-cell ${dg > 0 ? 'text-green-400' : dg < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {dg > 0 ? `+${dg}` : dg}
                </td>
                <td className="text-center px-2 py-3 font-black text-lg text-white">{e.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function PublicoPosiciones() {
  const { camp } = useOutletContext()
  const { data: grupos, isLoading } = usePosicionesPublico(camp.id)
  const { data: fases } = useFasesPublico(camp.id)

  if (isLoading) return (
    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-500" /></div>
  )

  if (!grupos || grupos.size === 0) return (
    <div className="flex flex-col items-center py-16 text-center">
      <Table2 size={40} className="text-gray-700 mb-3" />
      <p className="text-gray-500">Sin partidos finalizados aún</p>
    </div>
  )

  // Construir mapa grupoId → nombre
  const grupoNombres = new Map()
  fases?.forEach(f => f.grupos?.forEach(g => grupoNombres.set(g.id, `${f.nombre} — ${g.nombre}`)))

  const tieneGrupos = !grupos.has('__general__') || grupos.size > 1

  return (
    <div className="space-y-6">
      {tieneGrupos && grupos.has('__general__') && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="font-bold text-sm text-gray-300">Tabla General</h3>
          </div>
          <TablaEquipos rows={grupos.get('__general__')} />
        </div>
      )}

      {!tieneGrupos && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <TablaEquipos rows={grupos.get('__general__')} />
        </div>
      )}

      {Array.from(grupos.entries())
        .filter(([k]) => k !== '__general__')
        .map(([grupoId, rows]) => (
          <div key={grupoId} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h3 className="font-bold text-sm text-gray-300">
                {grupoNombres.get(grupoId) ?? 'Grupo'}
              </h3>
            </div>
            <TablaEquipos rows={rows} />
          </div>
        ))
      }

      <p className="text-xs text-gray-700 text-center">
        PJ Jugados · PG Ganados · PE Empatados · PP Perdidos · DG Diferencia · PTS Puntos
      </p>
    </div>
  )
}
