import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Shield, Upload, Loader2 } from 'lucide-react'
import { useEquipos, useEquipoMutations } from '@/hooks/useEquipos'
import { useCampeonato } from '@/context/CampeonatoContext'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

const EMPTY = { nombre: '', color_principal: '#16a34a', color_secundario: '#ffffff', ciudad: '', fundado_en: '' }

export default function Equipos() {
  const { campeonatoActivo } = useCampeonato()
  // Solo equipos inscritos en el campeonato activo
  const { data: equipos, isLoading } = useEquipos(campeonatoActivo?.id)
  const { crear, actualizar, eliminar, uploadEscudo } = useEquipoMutations()
  const qc = useQueryClient()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingCardId, setUploadingCardId] = useState(null)
  const fileRef = useRef()
  const cardFileRefs = useRef({})

  const abrirNuevo = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const abrirEditar = (e) => { setForm({ ...e, fundado_en: e.fundado_en ?? '' }); setEditId(e.id); setModal(true) }

  const guardar = async () => {
    try {
      const payload = { ...form }
      if (!payload.fundado_en) delete payload.fundado_en
      if (editId) {
        await actualizar.mutateAsync({ id: editId, ...payload })
      } else {
        // Crear equipo e inscribirlo automáticamente en el campeonato activo
        const { data: nuevo, error } = await supabase.from('equipos').insert(payload).select().single()
        if (error) throw error
        await supabase.from('inscripciones').insert({ campeonato_id: campeonatoActivo.id, equipo_id: nuevo.id })
        qc.invalidateQueries({ queryKey: ['equipos'] })
      }
      toast(editId ? 'Equipo actualizado' : 'Equipo creado e inscrito')
      setModal(false)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  // Upload desde el modal de edición
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

  // Upload directo desde la card
  const handleEscudoCard = async (e, equipoId) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCardId(equipoId)
    try {
      const url = await uploadEscudo(file, equipoId)
      await actualizar.mutateAsync({ id: equipoId, escudo_url: url })
      toast('Escudo actualizado')
    } catch (err) {
      toast(err.message, 'error')
    }
    setUploadingCardId(null)
    // reset input para permitir subir el mismo archivo de nuevo
    if (cardFileRefs.current[equipoId]) cardFileRefs.current[equipoId].value = ''
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

  if (!campeonatoActivo) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Shield size={48} className="text-gray-200 mb-3" />
      <p className="text-gray-500 font-medium">Selecciona un campeonato</p>
      <p className="text-gray-400 text-sm">Ve a Campeonatos y presiona "Seleccionar"</p>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{equipos?.length ?? 0} equipos en <span className="font-medium text-gray-700">{campeonatoActivo.nombre}</span></p>
        <Button onClick={abrirNuevo}><Plus size={16} />Nuevo equipo</Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={1} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {equipos?.map(e => {
            const isUploadingThis = uploadingCardId === e.id
            const inicial = (e.nombre?.[0] ?? '?').toUpperCase()

            return (
              <Card key={e.id} className="overflow-hidden p-0 hover:shadow-lg transition-shadow">
                {/* Zona del escudo */}
                <div
                  className="relative flex flex-col items-center pt-7 pb-5 px-4"
                  style={{
                    background: `linear-gradient(135deg, ${e.color_principal}28 0%, ${e.color_secundario}14 100%)`,
                    borderBottom: `2px solid ${e.color_principal}30`,
                  }}
                >
                  {/* Puntos de color arriba-derecha */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: e.color_principal }} title="Color principal" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: e.color_secundario }} title="Color secundario" />
                  </div>

                  {/* Escudo con overlay de upload */}
                  <div className="relative group">
                    {e.escudo_url ? (
                      <img
                        src={e.escudo_url}
                        alt={e.nombre}
                        className="w-20 h-20 object-contain rounded-2xl bg-white shadow-md border border-white/60"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-md border border-white/40"
                        style={{ backgroundColor: e.color_principal + '33', color: e.color_principal }}
                      >
                        {inicial}
                      </div>
                    )}

                    {/* Overlay hover para subir escudo */}
                    <label
                      className="absolute inset-0 rounded-2xl bg-black/55 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Cambiar escudo"
                    >
                      <Upload size={18} className="text-white" />
                      <span className="text-white text-[10px] font-semibold">Subir</span>
                      <input
                        ref={el => { cardFileRefs.current[e.id] = el }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={ev => handleEscudoCard(ev, e.id)}
                      />
                    </label>

                    {/* Spinner mientras sube */}
                    {isUploadingThis && (
                      <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                        <Loader2 size={22} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Nombre y ciudad */}
                  <h3 className="font-bold text-gray-900 text-base text-center truncate w-full mt-3 leading-tight">{e.nombre}</h3>
                  {e.ciudad && <p className="text-xs text-gray-500 text-center mt-0.5">{e.ciudad}</p>}
                  {e.fundado_en && <p className="text-xs text-gray-400 text-center">Fundado {e.fundado_en}</p>}
                </div>

                {/* Acciones */}
                <div className="flex gap-1.5 p-3">
                  <Button variant="ghost" size="icon" className="flex-1" onClick={() => abrirEditar(e)}><Pencil size={14} /></Button>
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

      {/* Modal edición */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar equipo' : 'Nuevo equipo'}>
        <div className="space-y-4">
          {/* Escudo centrado en modal */}
          {editId && (
            <div className="flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-2xl">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current?.click()}
                title="Cambiar escudo"
              >
                {form.escudo_url ? (
                  <img
                    src={form.escudo_url}
                    alt="escudo"
                    className="w-24 h-24 object-contain rounded-2xl bg-white shadow border border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-200 flex items-center justify-center shadow-inner">
                    <Shield size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/45 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={20} className="text-white" />
                  <span className="text-white text-xs font-semibold">Cambiar</span>
                </div>
                {uploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/55 flex items-center justify-center">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Escudo del equipo</p>
                <p className="text-xs text-gray-400 mt-0.5">Haz clic en el escudo o usa el botón</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
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
        <p className="text-sm text-gray-600 mb-5">¿Eliminar este equipo del campeonato? Se eliminará el equipo y todos sus datos (jugadores, partidos).</p>
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
