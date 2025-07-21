import { ReactNode } from 'react'

interface PageTitleProps {
  children: ReactNode
  className?: string
  [key: string]: any
}

export default function PageTitle({ children, className = '', ...props }: PageTitleProps) {
  return (
    <h3 className={`font-title ${className}`} {...props}>
      {children}
    </h3>
  )
}
