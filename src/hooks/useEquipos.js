import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useEquipos(campeonatoId) {
  return useQuery({
    queryKey: ['equipos', campeonatoId],
    queryFn: async () => {
      if (campeonatoId) {
        const { data, error } = await supabase
          .from('inscripciones')
          .select('equipo:equipos(*)')
          .eq('campeonato_id', campeonatoId)
        if (error) throw error
        return data.map(d => d.equipo)
      }
      const { data, error } = await supabase
        .from('equipos')
        .select('*')
        .order('nombre')
      if (error) throw error
      return data
    },
  })
}

export function useEquipoMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['equipos'] })

  const crear = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('equipos').insert(data)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const actualizar = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('equipos').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('equipos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const uploadEscudo = async (file, equipoId) => {
    const ext = file.name.split('.').pop()
    const path = `escudos/${equipoId}.${ext}`
    const { error: upErr } = await supabase.storage.from('campeonato').upload(path, file, { upsert: true })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('campeonato').getPublicUrl(path)
    return data.publicUrl
  }

  return { crear, actualizar, eliminar, uploadEscudo }
}
