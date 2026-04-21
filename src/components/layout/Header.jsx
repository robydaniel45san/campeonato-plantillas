import { ChevronDown, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useCampeonato } from '@/context/CampeonatoContext'
import { cn } from '@/lib/utils'

export function Header({ title }) {
  const { campeonatoActivo, campeonatos, seleccionarCampeonato } = useCampeonato()
  const [open, setOpen] = useState(false)

  const estadoColor = {
    activo:      'bg-green-100 text-green-700',
    borrador:    'bg-gray-100 text-gray-600',
    finalizado:  'bg-blue-100 text-blue-700',
    suspendido:  'bg-red-100 text-red-700',
  }

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>

      {campeonatos.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
          >
            <Trophy size={14} className="text-green-600" />
            <span className="font-medium text-gray-700 max-w-40 truncate">
              {campeonatoActivo?.nombre ?? 'Seleccionar'}
            </span>
            {campeonatoActivo && (
              <span className={cn('px-1.5 py-0.5 rounded-full text-xs font-medium', estadoColor[campeonatoActivo.estado])}>
                {campeonatoActivo.estado}
              </span>
            )}
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-56 py-1 overflow-hidden">
                {campeonatos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { seleccionarCampeonato(c); setOpen(false) }}
                    className={cn(
                      'flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors',
                      campeonatoActivo?.id === c.id && 'bg-green-50 text-green-700 font-medium',
                    )}
                  >
                    <span className="truncate">{c.nombre}</span>
                    <span className={cn('ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium', estadoColor[c.estado])}>
                      {c.estado}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
