import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  })
}

export const ESTADO_PARTIDO = {
  programado: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  en_curso:   { label: 'En curso',   color: 'bg-green-100 text-green-700' },
  finalizado: { label: 'Finalizado', color: 'bg-gray-100 text-gray-600' },
  suspendido: { label: 'Suspendido', color: 'bg-red-100 text-red-700' },
  postergado: { label: 'Postergado', color: 'bg-yellow-100 text-yellow-700' },
}

export const POSICION_JUGADOR = [
  'Portero', 'Defensa', 'Centrocampista', 'Delantero',
]

export const FORMATO_CAMPEONATO = {
  liga:       'Liga (todos contra todos)',
  copa:       'Copa (eliminación directa)',
  grupos:     'Grupos + Eliminatorias',
  mixto:      'Mixto',
}
