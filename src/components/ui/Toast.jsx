import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const icons = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error:   <XCircle    size={16} className="text-red-500" />,
  warning: <AlertCircle size={16} className="text-yellow-500" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const dismiss = (id) => setToasts(t => t.filter(x => x.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 bg-white rounded-xl shadow-lg border px-4 py-3 animate-in slide-in-from-right-4',
              t.type === 'error'   && 'border-red-200',
              t.type === 'success' && 'border-green-200',
              t.type === 'warning' && 'border-yellow-200',
            )}
          >
            {icons[t.type]}
            <p className="flex-1 text-sm text-gray-800">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
