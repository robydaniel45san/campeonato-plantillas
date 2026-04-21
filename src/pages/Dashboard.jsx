import { useQuery } from '@tanstack/react-query'
import { Trophy, Shield, Users, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCampeonato } from '@/context/CampeonatoContext'
import { StatCard } from '@/components/ui/Card'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDateTime, ESTADO_PARTIDO } from '@/lib/utils'

function useResumen(campeonatoId) {
  return useQuery({
    queryKey: ['dashboard', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const [equipos, jugadores, partidos] = await Promise.all([
        supabase.from('inscripciones').select('id', { count: 'exact' }).eq('campeonato_id', campeonatoId),
        supabase.from('jugadores').select('id', { count: 'exact' }),
        supabase.from('partidos').select('*, equipo_local:equipos!partidos_equipo_local_id_fkey(nombre,color_principal), equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre,color_principal)').eq('campeonato_id', campeonatoId).order('fecha').limit(6),
      ])
      return {
        equipos: equipos.count ?? 0,
        jugadores: jugadores.count ?? 0,
        partidos: partidos.data ?? [],
        programados: partidos.data?.filter(p => p.estado === 'programado').length ?? 0,
        finalizados: partidos.data?.filter(p => p.estado === 'finalizado').length ?? 0,
      }
    },
  })
}

export default function Dashboard() {
  const { campeonatoActivo } = useCampeonato()
  const { data, isLoading } = useResumen(campeonatoActivo?.id)

  if (!campeonatoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Trophy size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">No hay campeonato seleccionado</p>
        <p className="text-gray-400 text-sm mt-1">Crea o selecciona un campeonato para comenzar</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Banner campeonato activo */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-200 text-sm font-medium uppercase tracking-wide">Campeonato activo</p>
            <h2 className="text-2xl font-bold mt-1">{campeonatoActivo.nombre}</h2>
            {campeonatoActivo.descripcion && (
              <p className="text-green-100 text-sm mt-1">{campeonatoActivo.descripcion}</p>
            )}
          </div>
          <div className="bg-white/20 rounded-xl p-3">
            <Trophy size={28} />
          </div>
        </div>
        <div className="flex gap-4 mt-4 text-sm">
          {campeonatoActivo.fecha_inicio && (
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Inicio: {new Date(campeonatoActivo.fecha_inicio).toLocaleDateString('es-BO')}
            </span>
          )}
          {campeonatoActivo.fecha_fin && (
            <span className="bg-white/20 px-3 py-1 rounded-full">
              Fin: {new Date(campeonatoActivo.fecha_fin).toLocaleDateString('es-BO')}
            </span>
          )}
          <span className="bg-white/20 px-3 py-1 rounded-full capitalize">{campeonatoActivo.formato}</span>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Equipos inscritos" value={data?.equipos ?? 0} icon={Shield} color="green" />
          <StatCard label="Jugadores" value={data?.jugadores ?? 0} icon={Users} color="blue" />
          <StatCard label="Partidos programados" value={data?.programados ?? 0} icon={Clock} color="orange" />
          <StatCard label="Partidos finalizados" value={data?.finalizados ?? 0} icon={CheckCircle2} color="purple" />
        </div>
      )}

      {/* Próximos partidos */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-green-600" />
            Próximos partidos
          </h3>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : data?.partidos.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No hay partidos registrados aún</p>
          ) : (
            <div className="space-y-2">
              {data?.partidos.map(p => {
                const est = ESTADO_PARTIDO[p.estado]
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="text-xs text-gray-400 w-32 flex-shrink-0">
                      {p.fecha ? formatDateTime(p.fecha) : 'Sin fecha'}
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3 text-sm">
                      <span className="font-medium text-gray-800 text-right flex-1">{p.equipo_local?.nombre}</span>
                      {p.estado === 'finalizado' ? (
                        <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg text-base">
                          {p.goles_local} — {p.goles_visitante}
                        </span>
                      ) : (
                        <span className="text-gray-400 px-3">vs</span>
                      )}
                      <span className="font-medium text-gray-800 text-left flex-1">{p.equipo_visitante?.nombre}</span>
                    </div>
                    <Badge className={est?.color}>{est?.label}</Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
