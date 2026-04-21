import { useState } from 'react'
import { Settings, MapPin, User, Plus, Pencil, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

function useEntidad(tabla, orderBy = 'nombre') {
  const qc = useQueryClient()
  const key = [tabla]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from(tabla).select('*').order(orderBy)
      if (error) throw error
      return data
    },
  })

  const crear = useMutation({
    mutationFn: async (data) => { const { error } = await supabase.from(tabla).insert(data); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  const actualizar = useMutation({
    mutationFn: async ({ id, ...data }) => { const { error } = await supabase.from(tabla).update(data).eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })
  const eliminar = useMutation({
    mutationFn: async (id) => { const { error } = await supabase.from(tabla).delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { query, crear, actualizar, eliminar }
}

function SeccionCanchas() {
  const { query, crear, actualizar, eliminar } = useEntidad('canchas')
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', direccion: '', ciudad: '', capacidad: '' })
  const [editId, setEditId] = useState(null)

  const guardar = async () => {
    try {
      const payload = { ...form }
      if (!payload.capacidad) delete payload.capacidad
      if (editId) await actualizar.mutateAsync({ id: editId, ...payload })
      else await crear.mutateAsync(payload)
      toast(editId ? 'Cancha actualizada' : 'Cancha creada')
      setModal(false)
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={18} className="text-green-600" />Canchas / Estadios
          </h3>
          <Button size="sm" onClick={() => { setForm({ nombre: '', direccion: '', ciudad: '', capacidad: '' }); setEditId(null); setModal(true) }}>
            <Plus size={14} />Agregar
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-50">
          {query.data?.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900 text-sm">{c.nombre}</p>
                <p className="text-xs text-gray-400">{[c.ciudad, c.direccion].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setForm({ ...c, capacidad: c.capacidad ?? '' }); setEditId(c.id); setModal(true) }}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={async () => { try { await eliminar.mutateAsync(c.id); toast('Cancha eliminada') } catch (e) { toast(e.message, 'error') }}}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {query.data?.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Sin canchas registradas</p>}
        </div>
      </CardBody>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar cancha' : 'Nueva cancha'} size="sm">
        <div className="space-y-3">
          <Input label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Estadio Municipal" />
          <Input label="Ciudad" value={form.ciudad} onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))} />
          <Input label="Dirección" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
          <Input label="Capacidad" type="number" value={form.capacidad} onChange={e => setForm(f => ({ ...f, capacidad: e.target.value }))} />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={guardar} disabled={!form.nombre}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

function SeccionArbitros() {
  const { query, crear, actualizar, eliminar } = useEntidad('arbitros', 'apellido')
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', especialidad: '' })
  const [editId, setEditId] = useState(null)

  const guardar = async () => {
    try {
      if (editId) await actualizar.mutateAsync({ id: editId, ...form })
      else await crear.mutateAsync(form)
      toast(editId ? 'Árbitro actualizado' : 'Árbitro creado')
      setModal(false)
    } catch (e) { toast(e.message, 'error') }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <User size={18} className="text-green-600" />Árbitros
          </h3>
          <Button size="sm" onClick={() => { setForm({ nombre: '', apellido: '', especialidad: '' }); setEditId(null); setModal(true) }}>
            <Plus size={14} />Agregar
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-50">
          {query.data?.map(a => (
            <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-900 text-sm">{a.nombre} {a.apellido}</p>
                {a.especialidad && <p className="text-xs text-gray-400">{a.especialidad}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => { setForm(a); setEditId(a.id); setModal(true) }}><Pencil size={14} /></Button>
                <Button variant="ghost" size="icon" className="text-red-400" onClick={async () => { try { await eliminar.mutateAsync(a.id); toast('Árbitro eliminado') } catch (e) { toast(e.message, 'error') }}}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
          {query.data?.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Sin árbitros registrados</p>}
        </div>
      </CardBody>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar árbitro' : 'Nuevo árbitro'} size="sm">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input label="Apellido" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </div>
          <Input label="Especialidad" value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} placeholder="Principal, asistente..." />
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={guardar} disabled={!form.nombre}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </Card>
  )
}

export default function Configuracion() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Settings size={16} />
        <span>Gestiona canchas, árbitros y otros datos del sistema</span>
      </div>
      <SeccionCanchas />
      <SeccionArbitros />
    </div>
  )
}
