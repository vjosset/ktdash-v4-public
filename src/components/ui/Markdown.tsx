'use client'

import clsx from 'clsx'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  children: string
  className?: string
}

export default function Markdown({ children, className }: Props) {
  return (
    <div className={clsx(
      'max-w-none text-foreground markdown',
      className
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
