'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import NewsCard from '../home/NewsCard'
import Modal from '../ui/Modal'

const NEWS_STORAGE_KEY = 'lastSeenNewsTimestamp'

type NewsItem = {
  date: string
  title: string
  description: string
}

export default function NewsPopup() {
  // news: array of { title, body, date }
  const [unseenNews, setUnseenNews] = useState<NewsItem[]>([])
  const [allnews, setAllnews] = useState<NewsItem[]>([])
  const pathname = usePathname()

  useEffect(() => {
    
    fetch('/news.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setAllnews(data))
      .catch((err) => console.error('Failed to fetch news:', err))
  }, [pathname])

  useEffect(() => {
    const lastSeen = localStorage.getItem(NEWS_STORAGE_KEY)
    const unseen = allnews
      .filter(item => !lastSeen || new Date(item.date) > new Date(lastSeen))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3)
    setUnseenNews(unseen)
  }, [allnews])

  const handleDismiss = () => {
    if (unseenNews.length > 0) {
      localStorage.setItem(NEWS_STORAGE_KEY, unseenNews[0].date)
    }
    setUnseenNews([])
  }

  return unseenNews.length > 0 && (
    <Modal
      title="What's New"
      children={(
        <div className="space-y-4 max-h-[90vh] overflow-y-auto news">
          {unseenNews.map((item, idx) => (
            <NewsCard key={idx} item={item} />
          ))}
        </div>)}
      onClose={handleDismiss}
    />
  )
}
