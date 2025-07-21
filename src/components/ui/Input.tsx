import { InputHTMLAttributes } from 'react'

export default function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`bg-card text-foreground border border-border rounded p-1 my-2 focus:outline-none focus:ring-2 focus:ring-main w-full ${className}`}
      {...props}
    />
  )
}
