import { InputHTMLAttributes } from 'react'

export default function Checkbox({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={`form-checkbox accent-main focus:ring-main border-border bg-card rounded-sm ${className}`}
      {...props}
    />
  )
}
