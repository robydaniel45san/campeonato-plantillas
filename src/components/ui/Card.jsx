import { cn } from '@/lib/utils'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-5 pt-5 pb-3', className)}>{children}</div>
}

export function CardBody({ className, children }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>
}

export function StatCard({ label, value, icon: Icon, color = 'green', sub }) {
  const colors = {
    green:  'bg-green-50 text-green-600',
    blue:   'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red:    'bg-red-50 text-red-600',
  }
  return (
    <Card className="flex items-center gap-4 p-5">
      {Icon && (
        <div className={cn('p-3 rounded-xl', colors[color])}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}
