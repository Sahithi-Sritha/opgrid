type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'outline'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const styles = {
    default: 'bg-secondary text-secondary-foreground',
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    outline: 'border border-border bg-transparent',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}
