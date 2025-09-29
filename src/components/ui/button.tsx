import * as React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={`
          inline-flex items-center justify-center rounded-lg font-medium transition-colors
          ${variant === 'primary' ? 'bg-primary text-white hover:bg-primary/90' : ''}
          ${variant === 'secondary' ? 'bg-surface text-text-primary hover:bg-surface/80' : ''}
          ${variant === 'outline' ? 'border border-border-light bg-background hover:bg-surface' : ''}
          ${size === 'sm' ? 'h-9 px-3 text-sm' : ''}
          ${size === 'md' ? 'h-10 px-4 py-2' : ''}
          ${size === 'lg' ? 'h-11 px-8' : ''}
          ${className}
        `}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }