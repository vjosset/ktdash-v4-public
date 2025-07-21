import { LabelHTMLAttributes } from 'react'

export default function Label({ children, className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`text-muted m-1 ${className}`} {...props}>
      {children}
    </label>
  )
}
