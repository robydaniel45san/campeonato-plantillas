import { useState } from 'react'
import { Plus, Pencil, Trash2, Trophy, Calendar, Link2 } from 'lucide-react'
import { useCampeonatos, useCampeonatoMutations } from '@/hooks/useCampeonatos'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { FORMATO_CAMPEONATO } from '@/lib/utils'

const ESTADO_COLOR = {
  activo:     'green',
  borrador:   'default',
  finalizado: 'blue',
  suspendido: 'red',
}

const EMPTY = { nombre: '', descripcion: '', formato: 'liga', estado: 'borrador', fecha_inicio: '', fecha_fin: '' }

export default function Campeonatos() {
  const { data: campeonatos, isLoading } = useCampeonatos()
  const { crear, actualizar, eliminar } = useCampeonatoMutations()
  const { campeonatoActivo, seleccionarCampeonato } = useCampeonato()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const abrirEditar = (c) => { setForm({ ...c, fecha_inicio: c.fecha_inicio ?? '', fecha_fin: c.fecha_fin ?? '' }); setEditId(c.id); setModal(true) }

  const guardar = async () => {
    try {
      const payload = { ...form }
      if (!payload.fecha_inicio) delete payload.fecha_inicio
      if (!payload.fecha_fin) delete payload.fecha_fin
      if (editId) await actualizar.mutateAsync({ id: editId, ...payload })
      else await crear.mutateAsync(payload)
      toast(editId ? 'Campeonato actualizado' : 'Campeonato creado')
      setModal(false)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const borrar = async () => {
    try {
      await eliminar.mutateAsync(confirmDelete)
      toast('Campeonato eliminado')
      setConfirmDelete(null)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{campeonatos?.length ?? 0} campeonatos registrados</p>
        <Button onClick={abrirNuevo}><Plus size={16} />Nuevo campeonato</Button>
      </div>

      {isLoading ? <TableSkeleton rows={4} cols={1} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campeonatos?.map(c => {
            const esActivo = campeonatoActivo?.id === c.id
            return (
            <Card key={c.id} className={`p-5 hover:shadow-md transition-shadow ${esActivo ? 'ring-2 ring-green-500 shadow-md shadow-green-100' : ''}`}>
              {esActivo && (
                <div className="flex items-center gap-1.5 mb-3 text-green-600 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Campeonato activo
                </div>
              )}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${esActivo ? 'bg-green-500' : 'bg-green-100'}`}>
                    <Trophy size={20} className={esActivo ? 'text-white' : 'text-green-600'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{c.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 capitalize">{FORMATO_CAMPEONATO[c.formato]}</p>
                  </div>
                </div>
                <Badge variant={ESTADO_COLOR[c.estado]}>{c.estado}</Badge>
              </div>

              {c.descripcion && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{c.descripcion}</p>
              )}

              {(c.fecha_inicio || c.fecha_fin) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Calendar size={12} />
                  <span>{c.fecha_inicio ?? '?'} → {c.fecha_fin ?? '?'}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                {esActivo ? (
                  <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 rounded-lg py-1.5 px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Activo
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => { seleccionarCampeonato(c); toast(`${c.nombre} seleccionado`) }}>
                    Seleccionar
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon"
                  title="Copiar enlace público"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/p/${c.id}/fixture`)
                    toast('Enlace copiado al portapapeles')
                  }}
                >
                  <Link2 size={15} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}>
                  <Pencil size={15} />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => setConfirmDelete(c.id)}>
                  <Trash2 size={15} />
                </Button>
              </div>
            </Card>
          )})}

          {campeonatos?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <Trophy size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Sin campeonatos</p>
              <p className="text-gray-400 text-sm">Crea el primer campeonato</p>
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar campeonato' : 'Nuevo campeonato'}>
        <div className="space-y-4">
          <Input label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Liga Municipal 2025" />
          <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} placeholder="Descripción opcional..." />
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3">
            <Select label="Formato" value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))}>
              {Object.entries(FORMATO_CAMPEONATO).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select label="Estado" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="suspendido">Suspendido</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha inicio" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
            <Input label="Fecha fin" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
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
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar campeonato" size="sm">
        <p className="text-sm text-gray-600 mb-5">¿Seguro que deseas eliminar este campeonato? Se eliminarán todos los partidos, fases y grupos asociados.</p>
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
