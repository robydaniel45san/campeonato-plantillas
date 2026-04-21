import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useFases(campeonatoId) {
  return useQuery({
    queryKey: ['fases', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fases')
        .select('*, grupos(*, grupo_equipos(equipo:equipos(id,nombre,escudo_url,color_principal)))')
        .eq('campeonato_id', campeonatoId)
        .order('orden')
      if (error) throw error
      return data
    },
  })
}

export function useFaseMutations(campeonatoId) {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['fases', campeonatoId] })

  const crearFase = useMutation({
    mutationFn: async (data) => {
      const { data: row, error } = await supabase.from('fases').insert({ ...data, campeonato_id: campeonatoId }).select().single()
      if (error) throw error
      return row
    },
    onSuccess: invalidate,
  })

  const actualizarFase = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('fases').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const eliminarFase = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('fases').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const crearGrupo = useMutation({
    mutationFn: async ({ fase_id, nombre, orden }) => {
      const { data, error } = await supabase.from('grupos').insert({ fase_id, nombre, orden }).select().single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const eliminarGrupo = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('grupos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const agregarEquipoGrupo = useMutation({
    mutationFn: async ({ grupo_id, equipo_id }) => {
      const { error } = await supabase.from('grupo_equipos').upsert({ grupo_id, equipo_id })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const quitarEquipoGrupo = useMutation({
    mutationFn: async ({ grupo_id, equipo_id }) => {
      const { error } = await supabase.from('grupo_equipos').delete().eq('grupo_id', grupo_id).eq('equipo_id', equipo_id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { crearFase, actualizarFase, eliminarFase, crearGrupo, eliminarGrupo, agregarEquipoGrupo, quitarEquipoGrupo }
}
