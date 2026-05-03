import { useState } from 'react'
import { Plus, Pencil, Trash2, Calendar, CheckCircle, Play } from 'lucide-react'
import { usePartidos, usePartidoMutations, useGoles, useGoalMutations } from '@/hooks/usePartidos'
import { useEquipos } from '@/hooks/useEquipos'
import { useJugadores } from '@/hooks/useJugadores'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatDateTime, ESTADO_PARTIDO } from '@/lib/utils'

const EMPTY_PARTIDO = { equipo_local_id: '', equipo_visitante_id: '', fecha: '', jornada: '', estado: 'programado', cancha_id: '', arbitro_id: '' }
const EMPTY_RESULTADO = { goles_local: 0, goles_visitante: 0, estado: 'finalizado' }

function useCanchasArbitros() {
  return useQuery({
    queryKey: ['canchas_arbitros'],
    queryFn: async () => {
      const [c, a] = await Promise.all([
        supabase.from('canchas').select('*').eq('activa', true).order('nombre'),
        supabase.from('arbitros').select('*').eq('activo', true).order('apellido'),
      ])
      return { canchas: c.data ?? [], arbitros: a.data ?? [] }
    },
  })
}

function ModalResultado({ partido, onClose }) {
  const { data: goles } = useGoles(partido?.id)
  const { cargarResultado } = usePartidoMutations()
  const { agregar: agregarGol, eliminar: eliminarGol } = useGoalMutations()
  const { data: jugadoresLocal } = useJugadores(partido?.equipo_local_id)
  const { data: jugadoresVisitante } = useJugadores(partido?.equipo_visitante_id)
  const { toast } = useToast()
  const [res, setRes] = useState({ goles_local: partido?.goles_local ?? 0, goles_visitante: partido?.goles_visitante ?? 0, estado: 'finalizado' })
  const [gol, setGol] = useState({ jugador_id: '', equipo_id: '', minuto: '', tipo: 'normal' })

  const guardarResultado = async () => {
    try {
      await cargarResultado.mutateAsync({ id: partido.id, ...res })
      toast('Resultado guardado')
      onClose()
    } catch (e) { toast(e.message, 'error') }
  }

  const addGol = async () => {
    try {
      await agregarGol.mutateAsync({ ...gol, partido_id: partido.id, equipo_id: gol.equipo_id || partido.equipo_local_id })
      setGol({ jugador_id: '', equipo_id: '', minuto: '', tipo: 'normal' })
      toast('Gol registrado')
    } catch (e) { toast(e.message, 'error') }
  }

  if (!partido) return null
  return (
    <div className="space-y-5">
      {/* Marcador */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-4 text-lg font-bold text-gray-900">
          <span className="flex-1 text-right truncate">{partido.equipo_local?.nombre}</span>
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm">
            <input type="number" min="0" value={res.goles_local} onChange={e => setRes(r => ({ ...r, goles_local: +e.target.value }))}
              className="w-8 text-center text-xl font-bold border-0 focus:outline-none" />
            <span className="text-gray-400">—</span>
            <input type="number" min="0" value={res.goles_visitante} onChange={e => setRes(r => ({ ...r, goles_visitante: +e.target.value }))}
              className="w-8 text-center text-xl font-bold border-0 focus:outline-none" />
          </div>
          <span className="flex-1 text-left truncate">{partido.equipo_visitante?.nombre}</span>
        </div>
        <Select className="mt-3 max-w-xs mx-auto" value={res.estado} onChange={e => setRes(r => ({ ...r, estado: e.target.value }))}>
          <option value="en_curso">En curso</option>
          <option value="finalizado">Finalizado</option>
          <option value="suspendido">Suspendido</option>
          <option value="postergado">Postergado</option>
        </Select>
      </div>

      {/* Goles registrados */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Goles registrados</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin">
          {goles?.length === 0 && <p className="text-xs text-gray-400 py-2">Sin goles registrados</p>}
          {goles?.map(g => (
            <div key={g.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-400 w-8">{g.minuto ? `${g.minuto}'` : '—'}</span>
                <span className="font-medium">{g.jugador?.nombre} {g.jugador?.apellido}</span>
                <span className="text-xs text-gray-400">({g.equipo?.nombre})</span>
                {g.tipo !== 'normal' && <Badge variant="orange" className="text-xs">{g.tipo}</Badge>}
              </div>
              <button onClick={() => eliminarGol.mutateAsync({ id: g.id, partido_id: partido.id })} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Agregar gol */}
      <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Registrar gol</h4>
        <div className="grid grid-cols-2 gap-2">
          <Select value={gol.equipo_id} onChange={e => setGol(g => ({ ...g, equipo_id: e.target.value, jugador_id: '' }))}>
            <option value={partido.equipo_local_id}>{partido.equipo_local?.nombre}</option>
            <option value={partido.equipo_visitante_id}>{partido.equipo_visitante?.nombre}</option>
          </Select>
          <Select value={gol.jugador_id} onChange={e => setGol(g => ({ ...g, jugador_id: e.target.value }))}>
            <option value="">Jugador (opc.)</option>
            {(gol.equipo_id === partido.equipo_visitante_id ? jugadoresVisitante : jugadoresLocal)?.map(j => (
              <option key={j.id} value={j.id}>{j.nombre} {j.apellido}</option>
            ))}
          </Select>
          <Input placeholder="Minuto" type="number" value={gol.minuto} onChange={e => setGol(g => ({ ...g, minuto: e.target.value }))} />
          <Select value={gol.tipo} onChange={e => setGol(g => ({ ...g, tipo: e.target.value }))}>
            <option value="normal">Normal</option>
            <option value="penal">Penal</option>
            <option value="autogol">Autogol</option>
            <option value="tiempo_extra">T. Extra</option>
          </Select>
        </div>
        <Button variant="secondary" size="sm" onClick={addGol} disabled={agregarGol.isPending}>
          <Plus size={13} />Agregar gol
        </Button>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
        <Button className="flex-1" onClick={guardarResultado} disabled={cargarResultado.isPending}>
          <CheckCircle size={15} />{cargarResultado.isPending ? 'Guardando...' : 'Guardar resultado'}
        </Button>
      </div>
    </div>
  )
}

export default function Partidos() {
  const { campeonatoActivo } = useCampeonato()
  const { data: partidos, isLoading } = usePartidos(campeonatoActivo?.id)
  const { data: equipos } = useEquipos(campeonatoActivo?.id)
  const { data: extras } = useCanchasArbitros()
  const { crear, eliminar } = usePartidoMutations()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [modalRes, setModalRes] = useState(null)
  const [form, setForm] = useState(EMPTY_PARTIDO)
  const [filtroEstado, setFiltroEstado] = useState('')

  const partidosFiltrados = filtroEstado ? partidos?.filter(p => p.estado === filtroEstado) : partidos

  const guardar = async () => {
    try {
      // Validar duplicados: mismo par de equipos ya en este campeonato
      const duplicado = partidos?.find(p =>
        (p.equipo_local_id === form.equipo_local_id && p.equipo_visitante_id === form.equipo_visitante_id) ||
        (p.equipo_local_id === form.equipo_visitante_id && p.equipo_visitante_id === form.equipo_local_id)
      )
      if (duplicado) {
        const jornada = duplicado.jornada ? ` (J${duplicado.jornada})` : ''
        toast(`Este enfrentamiento ya existe${jornada}`, 'error')
        return
      }
      const payload = { ...form, campeonato_id: campeonatoActivo.id }
      if (!payload.fecha) delete payload.fecha
      if (!payload.cancha_id) delete payload.cancha_id
      if (!payload.arbitro_id) delete payload.arbitro_id
      if (!payload.jornada) delete payload.jornada
      await crear.mutateAsync(payload)
      toast('Partido creado')
      setModal(false)
      setForm(EMPTY_PARTIDO)
    } catch (e) { toast(e.message, 'error') }
  }

  if (!campeonatoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Calendar size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500">Selecciona un campeonato para ver los partidos</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_PARTIDO).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <p className="text-sm text-gray-400 flex-1">{partidosFiltrados?.length ?? 0} partidos</p>
        <Button onClick={() => setModal(true)}><Plus size={16} />Programar partido</Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="space-y-2">
          {partidosFiltrados?.map(p => {
            const est = ESTADO_PARTIDO[p.estado]
            return (
              <Card key={p.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Jornada - solo desktop */}
                  {p.jornada && (
                    <div className="hidden sm:flex flex-col items-center text-xs text-gray-400 w-10 flex-shrink-0">
                      <span className="font-semibold text-gray-600">J{p.jornada}</span>
                    </div>
                  )}

                  {/* Equipos y marcador */}
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <div className="flex-1 text-right min-w-0">
                      <div className="flex items-center justify-end gap-1.5 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm truncate">{p.equipo_local?.nombre}</span>
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.equipo_local?.color_principal }} />
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-14 sm:min-w-20 text-center">
                      {p.estado === 'finalizado' || p.estado === 'en_curso' ? (
                        <span className="font-bold text-base sm:text-lg text-gray-900 bg-gray-100 px-2 py-1 rounded-lg whitespace-nowrap">
                          {p.goles_local}—{p.goles_visitante}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm font-medium">vs</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.equipo_visitante?.color_principal }} />
                        <span className="font-semibold text-gray-900 text-sm truncate">{p.equipo_visitante?.nombre}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta info - solo desktop */}
                  <div className="hidden md:flex flex-col items-end gap-1 text-xs text-gray-400 flex-shrink-0">
                    {p.fecha && <span>{formatDateTime(p.fecha)}</span>}
                    {p.cancha && <span>{p.cancha.nombre}</span>}
                  </div>

                  <Badge className={`${est?.color} hidden xs:inline-flex sm:inline-flex`}>{est?.label}</Badge>

                  {/* Acciones */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setModalRes(p)} title="Cargar resultado">
                      {p.estado === 'finalizado' ? <Pencil size={14} /> : <Play size={14} className="text-green-600" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-50"
                      onClick={async () => { try { await eliminar.mutateAsync(p.id); toast('Partido eliminado') } catch (e) { toast(e.message, 'error') } }}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Info secundaria en móvil */}
                <div className="flex items-center gap-2 mt-1.5 sm:hidden flex-wrap">
                  <Badge className={est?.color}>{est?.label}</Badge>
                  {p.jornada && <span className="text-xs text-gray-400">J{p.jornada}</span>}
                  {p.fecha && <span className="text-xs text-gray-400">{formatDateTime(p.fecha)}</span>}
                  {p.cancha && <span className="text-xs text-gray-400">· {p.cancha.nombre}</span>}
                </div>
              </Card>
            )
          })}
          {partidosFiltrados?.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <Calendar size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500">Sin partidos registrados</p>
              <p className="text-gray-400 text-sm">Programa el primer partido del campeonato</p>
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo partido */}
      <Modal open={modal} onClose={() => { setModal(false); setForm(EMPTY_PARTIDO) }} title="Programar partido">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Equipo local *" value={form.equipo_local_id} onChange={e => setForm(f => ({ ...f, equipo_local_id: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {equipos?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
            <Select label="Equipo visitante *" value={form.equipo_visitante_id} onChange={e => setForm(f => ({ ...f, equipo_visitante_id: e.target.value }))}>
              <option value="">Seleccionar...</option>
              {equipos?.filter(e => e.id !== form.equipo_local_id).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha y hora" type="datetime-local" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            <Input label="Jornada" type="number" value={form.jornada} onChange={e => setForm(f => ({ ...f, jornada: e.target.value }))} placeholder="1" min="1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Cancha" value={form.cancha_id} onChange={e => setForm(f => ({ ...f, cancha_id: e.target.value }))}>
              <option value="">Sin cancha</option>
              {extras?.canchas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <Select label="Árbitro" value={form.arbitro_id} onChange={e => setForm(f => ({ ...f, arbitro_id: e.target.value }))}>
              <option value="">Sin árbitro</option>
              {extras?.arbitros.map(a => <option key={a.id} value={a.id}>{a.nombre} {a.apellido}</option>)}
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => { setModal(false); setForm(EMPTY_PARTIDO) }}>Cancelar</Button>
            <Button className="flex-1" onClick={guardar}
              disabled={!form.equipo_local_id || !form.equipo_visitante_id || form.equipo_local_id === form.equipo_visitante_id || crear.isPending}>
              {crear.isPending ? 'Guardando...' : 'Programar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal resultado */}
      <Modal open={!!modalRes} onClose={() => setModalRes(null)} title="Resultado del partido" size="lg">
        <ModalResultado partido={modalRes} onClose={() => setModalRes(null)} />
      </Modal>
    </div>
  )
}
