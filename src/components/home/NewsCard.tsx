import React from 'react'
import Markdown from '@/components/ui/Markdown'

type NewsItem = {
  date: string
  title: string
  description: string
}

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="border border-border bg-card rounded p-2 mb-2 shadow-sm">
      <h5 className="text-main font-bold">{item.title}</h5>
      <p className="text-muted text-sm p-0 m-0">
        {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
      </p>
      <div className="p-0 m-0">
        <Markdown>{item.description}</Markdown>
      </div>
    </div>
  )
}