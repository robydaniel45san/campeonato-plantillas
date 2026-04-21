import { BarChart2 } from 'lucide-react'
import { useState } from 'react'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useGoleadores } from '@/hooks/usePosiciones'
import { useDisciplina } from '@/hooks/useTarjetas'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const POSICION_COLOR_HEX = {
  Portero:        '#3b82f6',
  Defensa:        '#16a34a',
  Centrocampista: '#ea580c',
  Delantero:      '#dc2626',
}

const TABS = ['Goleadores', 'Disciplina']

export default function Estadisticas() {
  const { campeonatoActivo } = useCampeonato()
  const [tab, setTab] = useState(0)
  const { data: goleadores, isLoading } = useGoleadores(campeonatoActivo?.id)
  const { data: disciplina, isLoading: loadingDisc } = useDisciplina(campeonatoActivo?.id)

  if (!campeonatoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <BarChart2 size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500">Selecciona un campeonato</p>
      </div>
    )
  }

  const top10 = goleadores?.slice(0, 10) ?? []

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === 1 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-800">Tabla de disciplina</h3>
          </CardHeader>
          <CardBody className="p-0">
            {loadingDisc ? (
              <div className="px-5 pb-5 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jugador</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Equipo</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-yellow-600 uppercase">🟡</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-red-600 uppercase">🔴</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {disciplina?.map((d, i) => (
                    <tr key={d.jugador_id ?? i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {d.jugador ? `${d.jugador.nombre} ${d.jugador.apellido ?? ''}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-sm">{d.equipo?.nombre}</td>
                      <td className="text-center px-4 py-3 font-bold text-yellow-600">{d.amarillas}</td>
                      <td className="text-center px-4 py-3 font-bold text-red-600">{d.rojas}</td>
                    </tr>
                  ))}
                  {!disciplina?.length && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Sin tarjetas registradas</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 0 && (<>
      {/* Gráfica top goleadores */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <BarChart2 size={18} className="text-green-600" />
            Top 10 Goleadores
          </h3>
        </CardHeader>
        <CardBody>
          {isLoading ? <Skeleton className="h-56 w-full" /> : top10.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin goles registrados</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top10} layout="vertical" margin={{ left: 100, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v, i) => `${top10[i]?.nombre} ${top10[i]?.apellido ?? ''}`}
                  width={100}
                />
                <Tooltip
                  formatter={(v) => [`${v} goles`, 'Goles']}
                  labelFormatter={(_, payload) => {
                    const d = payload?.[0]?.payload
                    return d ? `${d.nombre} ${d.apellido ?? ''} — ${d.equipo_nombre}` : ''
                  }}
                />
                <Bar dataKey="goles" radius={[0, 6, 6, 0]}>
                  {top10.map((e, i) => (
                    <Cell key={i} fill={POSICION_COLOR_HEX[e.posicion] ?? '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>

      {/* Tabla goleadores */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-800">Tabla de goleadores</h3>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="px-5 pb-5 space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jugador</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Equipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Posición</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Penales</th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-gray-700 uppercase">Goles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {goleadores?.map((g, i) => (
                  <tr key={g.jugador_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-gray-700' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'text-gray-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {g.foto_url ? (
                          <img src={g.foto_url} alt={g.nombre} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                            {g.nombre?.[0]}{g.apellido?.[0]}
                          </div>
                        )}
                        <span className="font-medium text-gray-900">{g.nombre} {g.apellido}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {g.equipo_escudo ? (
                          <img src={g.equipo_escudo} alt={g.equipo_nombre} className="w-5 h-5 object-contain" />
                        ) : null}
                        <span className="text-gray-600 text-sm">{g.equipo_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {g.posicion && (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: POSICION_COLOR_HEX[g.posicion] ?? '#6b7280' }}
                        >
                          {g.posicion}
                        </span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3 text-gray-500 hidden md:table-cell">{g.penales}</td>
                    <td className="text-center px-4 py-3 font-bold text-xl text-gray-900">{g.goles}</td>
                  </tr>
                ))}
                {!goleadores?.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Sin goles registrados en este campeonato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      </>)}
    </div>
  )
}
