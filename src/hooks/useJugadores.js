import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useJugadores(equipoId) {
  return useQuery({
    queryKey: ['jugadores', equipoId],
    queryFn: async () => {
      let q = supabase
        .from('jugadores')
        .select('*, equipo:equipos(id, nombre, escudo_url, color_principal)')
        .order('apellido')
      if (equipoId) q = q.eq('equipo_id', equipoId)
      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useJugadorMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['jugadores'] })

  const crear = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('jugadores').insert(data)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const actualizar = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('jugadores').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('jugadores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const uploadFoto = async (file, jugadorId) => {
    const ext = file.name.split('.').pop()
    const path = `jugadores/${jugadorId}.${ext}`
    const { error } = await supabase.storage.from('campeonato').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('campeonato').getPublicUrl(path)
    return data.publicUrl
  }

  return { crear, actualizar, eliminar, uploadFoto }
}
