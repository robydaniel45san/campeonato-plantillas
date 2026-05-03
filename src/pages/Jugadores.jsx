import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Users, Upload, Search } from 'lucide-react'
import { useJugadores, useJugadorMutations } from '@/hooks/useJugadores'
import { useEquipos } from '@/hooks/useEquipos'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { POSICION_JUGADOR } from '@/lib/utils'

const POSICION_COLOR = {
  Portero:       'blue',
  Defensa:       'green',
  Centrocampista:'orange',
  Delantero:     'red',
}

const EMPTY = { nombre: '', apellido: '', equipo_id: '', numero_dorsal: '', posicion: '', nacionalidad: '', fecha_nacimiento: '' }

export default function Jugadores() {
  const { campeonatoActivo } = useCampeonato()
  const { data: jugadores, isLoading } = useJugadores(campeonatoActivo?.id)
  // Equipos inscritos en el campeonato activo (para filtros y modal)
  const { data: equipos } = useEquipos(campeonatoActivo?.id)
  const { crear, actualizar, eliminar, uploadFoto } = useJugadorMutations()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEquipo, setFiltroEquipo] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const abrirEditar = (j) => { setForm({ ...j, fecha_nacimiento: j.fecha_nacimiento ?? '', numero_dorsal: j.numero_dorsal ?? '' }); setEditId(j.id); setModal(true) }

  const jugadoresFiltrados = jugadores?.filter(j => {
    const nombre = `${j.nombre} ${j.apellido}`.toLowerCase()
    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false
    if (filtroEquipo && j.equipo_id !== filtroEquipo) return false
    return true
  }) ?? []

  const guardar = async () => {
    try {
      const payload = { ...form }
      if (!payload.numero_dorsal) delete payload.numero_dorsal
      if (!payload.equipo_id) delete payload.equipo_id
      if (!payload.posicion) delete payload.posicion
      if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento
      if (editId) await actualizar.mutateAsync({ id: editId, ...payload })
      else await crear.mutateAsync(payload)
      toast(editId ? 'Jugador actualizado' : 'Jugador creado')
      setModal(false)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editId) return
    setUploading(true)
    try {
      const url = await uploadFoto(file, editId)
      await actualizar.mutateAsync({ id: editId, foto_url: url })
      setForm(f => ({ ...f, foto_url: url }))
      toast('Foto actualizada')
    } catch (err) {
      toast(err.message, 'error')
    }
    setUploading(false)
  }

  const borrar = async () => {
    try {
      await eliminar.mutateAsync(confirmDelete)
      toast('Jugador eliminado')
      setConfirmDelete(null)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  if (!campeonatoActivo) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users size={48} className="text-gray-200 mb-3" />
      <p className="text-gray-500 font-medium">Selecciona un campeonato</p>
      <p className="text-gray-400 text-sm">Ve a Campeonatos y presiona "Seleccionar"</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar jugador..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={filtroEquipo}
          onChange={e => setFiltroEquipo(e.target.value)}
          className="h-9 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Todos los equipos</option>
          {equipos?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
        <p className="text-sm text-gray-400">{jugadoresFiltrados.length} {jugadoresFiltrados.length === 1 ? 'jugador' : 'jugadores'}</p>
        <Button onClick={abrirNuevo}><Plus size={16} />Nuevo jugador</Button>
      </div>

      {isLoading ? <TableSkeleton rows={6} cols={5} /> : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Jugador</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Equipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Posición</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {jugadoresFiltrados.map(j => (
                <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nombre} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                          {j.nombre[0]}{j.apellido?.[0]}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{j.nombre} {j.apellido}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {j.equipo?.color_principal && (
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: j.equipo.color_principal }} />
                      )}
                      <span className="text-gray-600 text-sm">{j.equipo?.nombre ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {j.posicion ? (
                      <Badge variant={POSICION_COLOR[j.posicion]}>{j.posicion}</Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 font-mono">
                    {j.numero_dorsal ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(j)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-50" onClick={() => setConfirmDelete(j.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {jugadoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 text-gray-200" />
                    Sin jugadores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar jugador' : 'Nuevo jugador'}>
        <div className="space-y-4">
          {editId && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              {form.foto_url ? (
                <img src={form.foto_url} alt="foto" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users size={24} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Foto del jugador</p>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload size={13} />{uploading ? 'Subiendo...' : 'Subir foto'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Juan" />
            <Input label="Apellido" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Pérez" />
          </div>
          <Select label="Equipo" value={form.equipo_id} onChange={e => setForm(f => ({ ...f, equipo_id: e.target.value }))}>
            <option value="">Sin equipo</option>
            {equipos?.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Posición" value={form.posicion} onChange={e => setForm(f => ({ ...f, posicion: e.target.value }))}>
              <option value="">Sin posición</option>
              {POSICION_JUGADOR.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Input label="Dorsal" type="number" value={form.numero_dorsal} onChange={e => setForm(f => ({ ...f, numero_dorsal: e.target.value }))} placeholder="10" min="1" max="99" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nacionalidad" value={form.nacionalidad} onChange={e => setForm(f => ({ ...f, nacionalidad: e.target.value }))} placeholder="Bolivia" />
            <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={guardar} disabled={!form.nombre || crear.isPending || actualizar.isPending}>
              {(crear.isPending || actualizar.isPending) ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar jugador" size="sm">
        <p className="text-sm text-gray-600 mb-5">¿Eliminar este jugador? Sus estadísticas históricas se mantendrán.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={borrar} disabled={eliminar.isPending}>
            {eliminar.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
