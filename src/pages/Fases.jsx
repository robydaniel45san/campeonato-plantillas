import { useState } from 'react'
import { Plus, Trash2, Layers, Users, Zap, ChevronDown, ChevronRight, Shield } from 'lucide-react'
import { useFases, useFaseMutations } from '@/hooks/useFases'
import { useEquipos } from '@/hooks/useEquipos'
import { useGenerarFixture } from '@/hooks/useFixture'
import { useCampeonato } from '@/context/CampeonatoContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

const TIPO_COLOR = { grupos: 'blue', eliminacion: 'orange', liga: 'green' }

function GrupoCard({ grupo, equiposDisponibles, mutations }) {
  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState('')
  const { toast } = useToast()

  const equiposEnGrupo = grupo.grupo_equipos?.map(ge => ge.equipo) ?? []
  const idsEnGrupo = new Set(equiposEnGrupo.map(e => e?.id))
  const disponibles = equiposDisponibles?.filter(e => !idsEnGrupo.has(e.id)) ?? []

  const addEquipo = async () => {
    if (!selectedEquipo) return
    try {
      await mutations.agregarEquipoGrupo.mutateAsync({ grupo_id: grupo.id, equipo_id: selectedEquipo })
      setSelectedEquipo('')
      setAdding(false)
      toast('Equipo agregado al grupo')
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="font-semibold text-gray-800 text-sm">{grupo.nombre}</span>
          <Badge variant="default">{equiposEnGrupo.length} equipos</Badge>
        </div>
        <Button
          variant="ghost" size="icon"
          className="text-red-400 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); mutations.eliminarGrupo.mutateAsync(grupo.id).catch(err => toast(err.message, 'error')) }}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {open && (
        <div className="p-3 space-y-2">
          {equiposEnGrupo.map(e => e && (
            <div key={e.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-2">
                {e.escudo_url
                  ? <img src={e.escudo_url} alt={e.nombre} className="w-6 h-6 object-contain rounded" />
                  : <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color_principal ?? '#9ca3af' }} />
                }
                <span className="text-sm text-gray-700">{e.nombre}</span>
              </div>
              <button
                onClick={() => mutations.quitarEquipoGrupo.mutateAsync({ grupo_id: grupo.id, equipo_id: e.id }).catch(err => toast(err.message, 'error'))}
                className="text-xs text-red-400 hover:text-red-600 px-1"
              >✕</button>
            </div>
          ))}

          {adding ? (
            <div className="flex gap-2 mt-2">
              <select
                value={selectedEquipo}
                onChange={e => setSelectedEquipo(e.target.value)}
                className="flex-1 h-8 px-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Seleccionar equipo...</option>
                {disponibles.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <Button size="sm" onClick={addEquipo} disabled={!selectedEquipo}>OK</Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>✕</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="w-full text-gray-500 border border-dashed border-gray-200 mt-1" onClick={() => setAdding(true)}>
              <Plus size={13} />Agregar equipo
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function FaseCard({ fase, equiposInscritos, mutations }) {
  const [open, setOpen] = useState(true)
  const [nuevoGrupo, setNuevoGrupo] = useState('')
  const [modalFixture, setModalFixture] = useState(false)
  const { toast } = useToast()
  const { campeonatoActivo } = useCampeonato()
  const generarFixture = useGenerarFixture(campeonatoActivo?.id)

  const [fixtureOpts, setFixtureOpts] = useState({
    vuelta: false,
    fechaInicio: '',
    intervaloDias: '7',
    equiposSeleccionados: [],
  })

  const handleCrearGrupo = async () => {
    if (!nuevoGrupo.trim()) return
    try {
      await mutations.crearGrupo.mutateAsync({ fase_id: fase.id, nombre: nuevoGrupo.trim(), orden: (fase.grupos?.length ?? 0) + 1 })
      setNuevoGrupo('')
      toast('Grupo creado')
    } catch (e) { toast(e.message, 'error') }
  }

  const handleGenerarFixture = async () => {
    const equiposSelec = fixtureOpts.equiposSeleccionados.length > 0
      ? equiposInscritos?.filter(e => fixtureOpts.equiposSeleccionados.includes(e.id))
      : equiposInscritos

    if (!equiposSelec || equiposSelec.length < 2) {
      toast('Necesitas al menos 2 equipos', 'warning'); return
    }

    // Verificar si ya existen partidos para esta fase
    const { count } = await supabase
      .from('partidos')
      .select('id', { count: 'exact', head: true })
      .eq('fase_id', fase.id)
    if (count > 0) {
      toast(`Esta fase ya tiene ${count} partidos generados. Elimínalos primero si deseas regenerar.`, 'error')
      return
    }

    try {
      const total = await generarFixture.mutateAsync({
        equipos: equiposSelec,
        faseId: fase.id,
        vuelta: fixtureOpts.vuelta,
        fechaInicio: fixtureOpts.fechaInicio || null,
        intervaloDias: +fixtureOpts.intervaloDias || 7,
      })
      toast(`${total} partidos generados correctamente`)
      setModalFixture(false)
    } catch (e) { toast(e.message, 'error') }
  }

  const toggleEquipo = (id) => {
    setFixtureOpts(o => ({
      ...o,
      equiposSeleccionados: o.equiposSeleccionados.includes(id)
        ? o.equiposSeleccionados.filter(x => x !== id)
        : [...o.equiposSeleccionados, id],
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            <div>
              <h3 className="font-semibold text-gray-900">{fase.nombre}</h3>
              <p className="text-xs text-gray-400">Orden {fase.orden}</p>
            </div>
            <Badge variant={TIPO_COLOR[fase.tipo]} className="capitalize">{fase.tipo}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModalFixture(true)}>
              <Zap size={13} />Generar fixture
            </Button>
            <Button
              variant="ghost" size="icon" className="text-red-400 hover:bg-red-50"
              onClick={() => mutations.eliminarFase.mutateAsync(fase.id).catch(e => toast(e.message, 'error'))}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardBody>
          {fase.tipo === 'grupos' && (
            <div className="space-y-3">
              {fase.grupos?.map(g => (
                <GrupoCard key={g.id} grupo={g} equiposDisponibles={equiposInscritos} mutations={mutations} />
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  value={nuevoGrupo}
                  onChange={e => setNuevoGrupo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCrearGrupo()}
                  placeholder="Nombre del grupo (ej: Grupo A)..."
                  className="flex-1 h-9 px-3 rounded-lg border border-dashed border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Button variant="secondary" size="sm" onClick={handleCrearGrupo} disabled={!nuevoGrupo.trim()}>
                  <Plus size={13} />Crear grupo
                </Button>
              </div>
            </div>
          )}

          {fase.tipo !== 'grupos' && (
            <p className="text-sm text-gray-400">
              Fase de tipo <strong>{fase.tipo}</strong>. Genera el fixture con el botón de arriba.
            </p>
          )}
        </CardBody>
      )}

      {/* Modal generar fixture */}
      <Modal open={modalFixture} onClose={() => setModalFixture(false)} title={`Generar fixture — ${fase.nombre}`} size="lg">
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
            Se generarán todos los partidos round-robin para los equipos seleccionados.
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Equipos participantes <span className="text-gray-400 font-normal">(vacío = todos los inscritos)</span>
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin">
              {equiposInscritos?.map(e => {
                const sel = fixtureOpts.equiposSeleccionados.includes(e.id)
                return (
                  <button
                    key={e.id}
                    onClick={() => toggleEquipo(e.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                      sel ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color_principal ?? '#9ca3af' }} />
                    {e.nombre}
                    {sel && <span className="ml-auto text-green-500 text-xs">✓</span>}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {fixtureOpts.equiposSeleccionados.length === 0
                ? `${equiposInscritos?.length ?? 0} equipos seleccionados (todos)`
                : `${fixtureOpts.equiposSeleccionados.length} equipos seleccionados`
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fecha inicio (opcional)"
              type="date"
              value={fixtureOpts.fechaInicio}
              onChange={e => setFixtureOpts(o => ({ ...o, fechaInicio: e.target.value }))}
            />
            <Input
              label="Días entre jornadas"
              type="number"
              value={fixtureOpts.intervaloDias}
              onChange={e => setFixtureOpts(o => ({ ...o, intervaloDias: e.target.value }))}
              min="1"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fixtureOpts.vuelta}
              onChange={e => setFixtureOpts(o => ({ ...o, vuelta: e.target.checked }))}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm text-gray-700">Generar vuelta (partido de vuelta)</span>
          </label>

          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            Se generarán aproximadamente{' '}
            <strong>
              {(() => {
                const n = fixtureOpts.equiposSeleccionados.length || equiposInscritos?.length || 0
                const base = Math.floor(n / 2) * (n - 1 + (n % 2 !== 0 ? 0 : 0))
                const pairs = Math.floor(n * (n - 1) / 2)
                return fixtureOpts.vuelta ? pairs * 2 : pairs
              })()} partidos
            </strong>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setModalFixture(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleGenerarFixture} disabled={generarFixture.isPending}>
              <Zap size={15} />{generarFixture.isPending ? 'Generando...' : 'Generar fixture'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default function Fases() {
  const { campeonatoActivo } = useCampeonato()
  const { data: fases, isLoading } = useFases(campeonatoActivo?.id)
  const { data: equiposInscritos } = useEquipos(campeonatoActivo?.id)
  const mutations = useFaseMutations(campeonatoActivo?.id)
  const { toast } = useToast()
  const [modalFase, setModalFase] = useState(false)
  const [formFase, setFormFase] = useState({ nombre: '', tipo: 'grupos', orden: '1' })

  const crearFase = async () => {
    try {
      await mutations.crearFase.mutateAsync({ ...formFase, orden: +formFase.orden })
      toast('Fase creada')
      setModalFase(false)
    } catch (e) { toast(e.message, 'error') }
  }

  if (!campeonatoActivo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Layers size={48} className="text-gray-200 mb-3" />
        <p className="text-gray-500">Selecciona un campeonato</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{fases?.length ?? 0} fases configuradas</p>
        </div>
        <Button onClick={() => { setFormFase({ nombre: '', tipo: 'grupos', orden: String((fases?.length ?? 0) + 1) }); setModalFase(true) }}>
          <Plus size={16} />Nueva fase
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-40" />)}</div>
      ) : fases?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <Layers size={48} className="text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Sin fases configuradas</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Crea fases para organizar el campeonato en grupos o eliminatorias</p>
          <Button onClick={() => setModalFase(true)}><Plus size={16} />Crear primera fase</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {fases?.map(fase => (
            <FaseCard key={fase.id} fase={fase} equiposInscritos={equiposInscritos} mutations={mutations} />
          ))}
        </div>
      )}

      <Modal open={modalFase} onClose={() => setModalFase(false)} title="Nueva fase" size="sm">
        <div className="space-y-4">
          <Input
            label="Nombre de la fase *"
            value={formFase.nombre}
            onChange={e => setFormFase(f => ({ ...f, nombre: e.target.value }))}
            placeholder="Fase de Grupos, Octavos, Final..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={formFase.tipo} onChange={e => setFormFase(f => ({ ...f, tipo: e.target.value }))}>
              <option value="grupos">Grupos</option>
              <option value="eliminacion">Eliminación directa</option>
              <option value="liga">Liga</option>
            </Select>
            <Input
              label="Orden"
              type="number"
              value={formFase.orden}
              onChange={e => setFormFase(f => ({ ...f, orden: e.target.value }))}
              min="1"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalFase(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={crearFase} disabled={!formFase.nombre || mutations.crearFase.isPending}>
              {mutations.crearFase.isPending ? 'Creando...' : 'Crear fase'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
