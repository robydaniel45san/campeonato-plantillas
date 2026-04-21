import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePosiciones(campeonatoId, grupoId) {
  return useQuery({
    queryKey: ['posiciones', campeonatoId, grupoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      let q = supabase
        .from('posiciones')
        .select('*')
        .eq('campeonato_id', campeonatoId)

      if (grupoId) q = q.eq('grupo_id', grupoId)
      else q = q.is('grupo_id', null)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function useGoleadores(campeonatoId) {
  return useQuery({
    queryKey: ['goleadores', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goleadores')
        .select('*')
        .eq('campeonato_id', campeonatoId)
        .order('goles', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}
