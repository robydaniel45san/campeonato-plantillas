import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Shield, Upload, Users } from 'lucide-react'
import { useEquipos, useEquipoMutations } from '@/hooks/useEquipos'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const EMPTY = { nombre: '', color_principal: '#16a34a', color_secundario: '#ffffff', ciudad: '', fundado_en: '' }

function useInscripcion(campeonatoId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (equipo_id) => {
      const { error } = await supabase.from('inscripciones').upsert({ campeonato_id: campeonatoId, equipo_id })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipos'] }),
  })
}

export default function Equipos() {
  const { campeonatoActivo } = useCampeonato()
  const { data: equipos, isLoading } = useEquipos()
  const { data: inscritos } = useEquipos(campeonatoActivo?.id)
  const { crear, actualizar, eliminar, uploadEscudo } = useEquipoMutations()
  const inscribir = useInscripcion(campeonatoActivo?.id)
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const inscritosIds = new Set(inscritos?.map(e => e.id) ?? [])

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const abrirEditar = (e) => { setForm({ ...e, fundado_en: e.fundado_en ?? '' }); setEditId(e.id); setModal(true) }

  const guardar = async () => {
    try {
      const payload = { ...form }
      if (!payload.fundado_en) delete payload.fundado_en
      if (editId) await actualizar.mutateAsync({ id: editId, ...payload })
      else await crear.mutateAsync(payload)
      toast(editId ? 'Equipo actualizado' : 'Equipo creado')
      setModal(false)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const handleEscudo = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !editId) return
    setUploading(true)
    try {
      const url = await uploadEscudo(file, editId)
      await actualizar.mutateAsync({ id: editId, escudo_url: url })
      setForm(f => ({ ...f, escudo_url: url }))
      toast('Escudo actualizado')
    } catch (err) {
      toast(err.message, 'error')
    }
    setUploading(false)
  }

  const borrar = async () => {
    try {
      await eliminar.mutateAsync(confirmDelete)
      toast('Equipo eliminado')
      setConfirmDelete(null)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  const toggleInscripcion = async (equipo) => {
    try {
      if (inscritosIds.has(equipo.id)) {
        await supabase.from('inscripciones')
          .delete()
          .eq('campeonato_id', campeonatoActivo.id)
          .eq('equipo_id', equipo.id)
        toast(`${equipo.nombre} desinscrito`)
      } else {
        await inscribir.mutateAsync(equipo.id)
        toast(`${equipo.nombre} inscrito en ${campeonatoActivo.nombre}`)
      }
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{equipos?.length ?? 0} equipos registrados</p>
        <Button onClick={abrirNuevo}><Plus size={16} />Nuevo equipo</Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={1} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipos?.map(e => {
            const inscrito = inscritosIds.has(e.id)
            return (
              <Card key={e.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  {e.escudo_url ? (
                    <img src={e.escudo_url} alt={e.nombre} className="w-12 h-12 object-contain rounded-lg bg-gray-50" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: e.color_principal + '22' }}
                    >
                      <Shield size={24} style={{ color: e.color_principal }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{e.nombre}</h3>
                    {e.ciudad && <p className="text-xs text-gray-400">{e.ciudad}</p>}
                    <div className="flex gap-1 mt-1">
                      <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: e.color_principal }} />
                      <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: e.color_secundario }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  {campeonatoActivo && (
                    <button
                      onClick={() => toggleInscripcion(e)}
                      className={`flex-1 text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                        inscrito
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {inscrito ? '✓ Inscrito' : '+ Inscribir'}
                    </button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(e)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-50" onClick={() => setConfirmDelete(e.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            )
          })}

          {equipos?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <Shield size={48} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">Sin equipos</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar equipo' : 'Nuevo equipo'}>
        <div className="space-y-4">
          {editId && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
              {form.escudo_url ? (
                <img src={form.escudo_url} alt="escudo" className="w-14 h-14 object-contain rounded-lg bg-white" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center">
                  <Shield size={24} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Escudo del equipo</p>
                <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload size={13} />{uploading ? 'Subiendo...' : 'Subir imagen'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleEscudo} />
              </div>
            </div>
          )}
          <Input label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="FC Ejemplo" />
          <Input label="Ciudad" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} placeholder="La Paz" />
          <Input label="Año de fundación" type="number" value={form.fundado_en} onChange={e => setForm(f => ({ ...f, fundado_en: e.target.value }))} placeholder="2000" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Color principal</label>
              <div className="flex items-center gap-2 h-9 border border-gray-300 rounded-lg px-2">
                <input type="color" value={form.color_principal} onChange={e => setForm(f => ({ ...f, color_principal: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-sm text-gray-600">{form.color_principal}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Color secundario</label>
              <div className="flex items-center gap-2 h-9 border border-gray-300 rounded-lg px-2">
                <input type="color" value={form.color_secundario} onChange={e => setForm(f => ({ ...f, color_secundario: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-sm text-gray-600">{form.color_secundario}</span>
              </div>
            </div>
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
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Eliminar equipo" size="sm">
        <p className="text-sm text-gray-600 mb-5">¿Eliminar este equipo? Se eliminará su historial y jugadores asociados.</p>
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
