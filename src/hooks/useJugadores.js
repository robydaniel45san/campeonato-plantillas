import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useJugadores(campeonatoId) {
  return useQuery({
    queryKey: ['jugadores', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      // Obtener equipos inscritos en el campeonato
      const { data: inscripciones, error: errInsc } = await supabase
        .from('inscripciones')
        .select('equipo_id')
        .eq('campeonato_id', campeonatoId)
      if (errInsc) throw errInsc

      const equipoIds = inscripciones.map(i => i.equipo_id)
      if (equipoIds.length === 0) return []

      const { data, error } = await supabase
        .from('jugadores')
        .select('*, equipo:equipos(id, nombre, escudo_url, color_principal)')
        .in('equipo_id', equipoIds)
        .order('apellido')
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
