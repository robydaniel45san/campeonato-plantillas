import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDisciplina(campeonatoId) {
  return useQuery({
    queryKey: ['disciplina', campeonatoId],
    enabled: !!campeonatoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarjetas')
        .select(`
          *,
          partido:partidos!inner(campeonato_id),
          jugador:jugadores(id, nombre, apellido, foto_url, posicion),
          equipo:equipos(id, nombre, escudo_url, color_principal)
        `)
        .eq('partido.campeonato_id', campeonatoId)
      if (error) throw error

      // Agrupar por jugador
      const map = new Map()
      for (const t of data) {
        const key = t.jugador_id ?? `eq-${t.equipo_id}`
        if (!map.has(key)) {
          map.set(key, {
            jugador_id: t.jugador_id,
            jugador: t.jugador,
            equipo: t.equipo,
            amarillas: 0, rojas: 0, doble_amarilla: 0,
          })
        }
        const r = map.get(key)
        if (t.tipo === 'amarilla') r.amarillas++
        if (t.tipo === 'roja') r.rojas++
        if (t.tipo === 'doble_amarilla') { r.doble_amarilla++; r.rojas++ }
      }
      return Array.from(map.values()).sort((a, b) => b.rojas - a.rojas || b.amarillas - a.amarillas)
    },
  })
}
