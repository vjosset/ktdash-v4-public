import { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'highlighted'
}

export default function Button({ children, className = '', variant = 'default', ...props }: ButtonProps) {
  const base = 'py-1 px-2 rounded text-md transition focus:outline-none inline-flex gap-2'

  const variants = {
    default: 'bg-main text-white hover:bg-main/90',
    ghost: 'bg-card text-muted border border-border hover:text-foreground hover:border-main',
    highlighted: 'bg-card bg-main text-white border border-main',
  }

  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}
