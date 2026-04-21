import { cn } from '@/lib/utils'

const variants = {
  default:  'bg-gray-100 text-gray-700',
  green:    'bg-green-100 text-green-700',
  blue:     'bg-blue-100 text-blue-700',
  red:      'bg-red-100 text-red-700',
  yellow:   'bg-yellow-100 text-yellow-700',
  orange:   'bg-orange-100 text-orange-700',
  purple:   'bg-purple-100 text-purple-700',
}

export function Badge({ variant = 'default', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
