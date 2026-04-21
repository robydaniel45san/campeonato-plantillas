import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimePartidos(campeonatoId) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!campeonatoId) return

    const channel = supabase
      .channel(`partidos:${campeonatoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partidos', filter: `campeonato_id=eq.${campeonatoId}` },
        () => {
          qc.invalidateQueries({ queryKey: ['partidos', campeonatoId] })
          qc.invalidateQueries({ queryKey: ['posiciones', campeonatoId] })
          qc.invalidateQueries({ queryKey: ['dashboard', campeonatoId] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goles' },
        () => {
          qc.invalidateQueries({ queryKey: ['goles'] })
          qc.invalidateQueries({ queryKey: ['posiciones', campeonatoId] })
          qc.invalidateQueries({ queryKey: ['goleadores', campeonatoId] })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campeonatoId, qc])
}
