import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CampeonatoContext = createContext(null)

export function CampeonatoProvider({ children }) {
  const [campeonatoActivo, setCampeonatoActivo] = useState(null)
  const [campeonatos, setCampeonatos] = useState([])

  useEffect(() => {
    supabase
      .from('campeonatos')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setCampeonatos(data)
          const saved = localStorage.getItem('campeonato_activo')
          const found = saved && data.find(c => c.id === saved)
          const activo = found || data.find(c => c.estado === 'activo') || data[0]
          if (activo) setCampeonatoActivo(activo)
        }
      })
  }, [])

  const seleccionarCampeonato = (c) => {
    setCampeonatoActivo(c)
    localStorage.setItem('campeonato_activo', c.id)
  }

  return (
    <CampeonatoContext.Provider value={{ campeonatoActivo, campeonatos, seleccionarCampeonato, setCampeonatos }}>
      {children}
    </CampeonatoContext.Provider>
  )
}

export const useCampeonato = () => useContext(CampeonatoContext)
