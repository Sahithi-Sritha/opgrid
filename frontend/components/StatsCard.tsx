import { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'

type StatsCardProps = {
  title: string
  value: number
  icon: ReactNode
  sparkline?: Array<{ date: string; count: number }>
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple'
  alert?: boolean
}

export function StatsCard({ title, value, icon, sparkline, color, alert }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className={`
      p-6 rounded-lg border
      ${alert ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}
      hover:shadow-md transition-shadow
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {alert && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            Alert!
          </span>
        )}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="mt-4">
          <Sparkline data={sparkline} color={color} />
        </div>
      )}
    </div>
  )
}

function Sparkline({ data, color }: { data: Array<{ count: number }>; color: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const width = 100 / data.length

  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    amber: '#f59e0b',
    purple: '#8b5cf6'
  }

  return (
    <div className="flex items-end gap-1 h-8">
      {data.map((point, i) => (
        <div
          key={i}
          style={{
            width: `${width}%`,
            height: `${(point.count / max) * 100}%`,
            backgroundColor: colorMap[color],
            opacity: 0.7
          }}
          className="rounded-t"
        />
      ))}
    </div>
  )
}
