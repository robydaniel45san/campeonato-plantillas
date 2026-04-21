import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useCampeonatos() {
  return useQuery({
    queryKey: ['campeonatos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campeonatos')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useCampeonatoMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['campeonatos'] })

  const crear = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('campeonatos').insert(data)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const actualizar = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('campeonatos').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('campeonatos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { crear, actualizar, eliminar }
}
