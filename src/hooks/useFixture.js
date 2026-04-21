import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function generarRoundRobin(equipos) {
  const n = equipos.length
  const list = n % 2 === 0 ? [...equipos] : [...equipos, null]
  const total = list.length
  const jornadas = total - 1
  const partidos = []

  for (let j = 0; j < jornadas; j++) {
    for (let i = 0; i < total / 2; i++) {
      const local = list[i]
      const visitante = list[total - 1 - i]
      if (local && visitante) {
        partidos.push({ local, visitante, jornada: j + 1 })
      }
    }
    // Rotar (primer elemento fijo)
    const ultimo = list.pop()
    list.splice(1, 0, ultimo)
  }
  return partidos
}

export function useGenerarFixture(campeonatoId) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ equipos, faseId, vuelta = false, fechaInicio, intervaloDias = 7 }) => {
      const emparejamientos = generarRoundRobin(equipos)

      const vuelta2 = vuelta
        ? emparejamientos.map(p => ({ local: p.visitante, visitante: p.local, jornada: p.jornada + emparejamientos[emparejamientos.length - 1].jornada }))
        : []

      const todos = [...emparejamientos, ...vuelta2]

      const registros = todos.map(({ local, visitante, jornada }) => {
        let fecha = null
        if (fechaInicio) {
          const d = new Date(fechaInicio)
          d.setDate(d.getDate() + (jornada - 1) * intervaloDias)
          fecha = d.toISOString()
        }
        return {
          campeonato_id: campeonatoId,
          fase_id: faseId || null,
          equipo_local_id: local.id,
          equipo_visitante_id: visitante.id,
          jornada,
          fecha,
          estado: 'programado',
        }
      })

      const { error } = await supabase.from('partidos').insert(registros)
      if (error) throw error
      return registros.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partidos', campeonatoId] }),
  })
}
