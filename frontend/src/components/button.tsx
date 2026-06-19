import * as React from "react"

import { cn } from "@/lib/utils"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'secondary' | 'ghost' | 'outline'
    size?: 'sm' | 'md' | 'lg'
  }
>(({ className, variant = 'default', size = 'md', ...props }, ref) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2 font-semibold
    transition-all duration-200 ease-out
    disabled:pointer-events-none disabled:opacity-50
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
    active:scale-[0.98]
  `

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs rounded-md',
    md: 'h-10 px-4 text-sm rounded-lg',
    lg: 'h-12 px-6 text-base rounded-xl'
  }

  const variantClasses = {
    default: `
      bg-primary text-primary-foreground shadow-sm
      hover:bg-primary/90 hover:shadow-md
    `,
    secondary: `
      bg-secondary text-secondary-foreground border border-border shadow-sm
      hover:bg-accent/10 hover:text-accent
    `,
    ghost: `
      text-foreground shadow-none hover:bg-accent/10 hover:text-accent
    `,
    outline: `
      border border-input bg-background text-foreground shadow-sm
      hover:bg-accent hover:text-accent-foreground
    `
  }

  return (
    <button
      ref={ref}
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
