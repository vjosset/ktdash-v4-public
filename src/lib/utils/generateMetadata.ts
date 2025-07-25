import { GAME } from '@/lib/config/game_config'
import { Metadata } from 'next'
import { headers } from 'next/headers'

interface MetadataParams {
  title?: string
  description?: string
  image?: {
    url: string
    width?: number
    height?: number
    alt?: string
  }
  keywords?: string[],
  pagePath: string
}

export async function generatePageMetadata({
  title,
  description,
  image,
  keywords = [],
  pagePath = '/'
}: MetadataParams): Promise<Metadata> {
  const headersList = headers()
  const host = (await headersList).get('host')
  const baseUrl = `https://${host}`

  const canonicalUrl = baseUrl + pagePath

  // Default values
  const pageTitle = title ? `${title} - ${GAME.NAME}` : GAME.NAME
  const pageDescription = description || `${GAME.NAME} is a web-based application for running your KillTeam games.`
  const pageImage = image ? {
    url: image.url.startsWith('http') ? image.url : `${baseUrl}${image.url}`,
    width: image.width || 1200,
    height: image.height || 630,
    alt: image.alt || pageTitle,
  } : null

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'killteam',
      'list builder',
      'battle tracker',
      'dashboard',
      ...keywords,  // Page-specific keywords,
      'skirmish game',
      'wargame',
      'free',
      'compendium',
      'grimdark',
      'sci-fi',
      'miniatures'
    ],

    // Canonical URL for SEO
    alternates: {
      canonical: canonicalUrl,
    },
    
    // OpenGraph
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: baseUrl,
      siteName: GAME.NAME,
      images: pageImage ? [pageImage] : [],
      type: 'website',
      locale: 'en_US',
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: pageImage ? [pageImage.url] : []
    },

    // Additional metadata
    robots: {
      index: true,
      follow: true,
    },
    
    metadataBase: new URL(baseUrl),
  }
}
