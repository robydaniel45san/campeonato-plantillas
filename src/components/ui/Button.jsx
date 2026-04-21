import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-green-600 hover:bg-green-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm',
  danger:    'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost:     'hover:bg-gray-100 text-gray-600',
  link:      'text-green-600 hover:underline p-0 h-auto',
}

const sizes = {
  sm:  'h-8  px-3 text-xs gap-1.5',
  md:  'h-9  px-4 text-sm gap-2',
  lg:  'h-10 px-5 text-sm gap-2',
  icon:'h-9  w-9  p-0',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
