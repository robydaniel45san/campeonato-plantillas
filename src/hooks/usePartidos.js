import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

const PARTIDO_SELECT = `
  *,
  equipo_local:equipos!partidos_equipo_local_id_fkey(id, nombre, escudo_url, color_principal),
  equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(id, nombre, escudo_url, color_principal),
  cancha:canchas(id, nombre),
  arbitro:arbitros(id, nombre, apellido),
  fase:fases(id, nombre),
  grupo:grupos(id, nombre)
`

export function usePartidos(campeonatoId, filtros = {}) {
  return useQuery({
    queryKey: ['partidos', campeonatoId, filtros],
    enabled: !!campeonatoId,
    queryFn: async () => {
      let q = supabase
        .from('partidos')
        .select(PARTIDO_SELECT)
        .eq('campeonato_id', campeonatoId)
        .order('fecha', { ascending: true })

      if (filtros.estado) q = q.eq('estado', filtros.estado)
      if (filtros.jornada) q = q.eq('jornada', filtros.jornada)
      if (filtros.equipo_id) {
        q = q.or(`equipo_local_id.eq.${filtros.equipo_id},equipo_visitante_id.eq.${filtros.equipo_id}`)
      }

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

export function usePartidoMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['partidos'] })

  const crear = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('partidos').insert(data)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const actualizar = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { error } = await supabase.from('partidos').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const eliminar = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('partidos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const cargarResultado = useMutation({
    mutationFn: async ({ id, goles_local, goles_visitante, estado = 'finalizado' }) => {
      const { error } = await supabase
        .from('partidos')
        .update({ goles_local, goles_visitante, estado })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { crear, actualizar, eliminar, cargarResultado }
}

export function useGoles(partidoId) {
  return useQuery({
    queryKey: ['goles', partidoId],
    enabled: !!partidoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goles')
        .select('*, jugador:jugadores(id, nombre, apellido), equipo:equipos(id, nombre)')
        .eq('partido_id', partidoId)
        .order('minuto')
      if (error) throw error
      return data
    },
  })
}

export function useTarjetas(partidoId) {
  return useQuery({
    queryKey: ['tarjetas', partidoId],
    enabled: !!partidoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarjetas')
        .select('*, jugador:jugadores(id, nombre, apellido), equipo:equipos(id, nombre)')
        .eq('partido_id', partidoId)
        .order('minuto')
      if (error) throw error
      return data
    },
  })
}

export function useGoalMutations() {
  const qc = useQueryClient()
  const invalidate = (pid) => {
    qc.invalidateQueries({ queryKey: ['goles', pid] })
    qc.invalidateQueries({ queryKey: ['posiciones'] })
  }

  const agregar = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('goles').insert(data)
      if (error) throw error
      return data.partido_id
    },
    onSuccess: (pid) => invalidate(pid),
  })

  const eliminar = useMutation({
    mutationFn: async ({ id, partido_id }) => {
      const { error } = await supabase.from('goles').delete().eq('id', id)
      if (error) throw error
      return partido_id
    },
    onSuccess: (pid) => invalidate(pid),
  })

  return { agregar, eliminar }
}
