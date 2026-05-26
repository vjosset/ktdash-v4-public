'use client'

import { KillteamPlain } from '@/types'
import clsx from 'clsx'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { FiEdit, FiThumbsDown, FiThumbsUp } from 'react-icons/fi'
import { toast } from 'sonner'
import { UserLink } from '../shared/Links'
import Markdown from '../ui/Markdown'

type KillteamCardProps = {
  killteam: KillteamPlain
}

export default function KillteamCard({ killteam }: KillteamCardProps) {
  const { data: session } = useSession()
  const canEdit = !!session?.user?.userId && !!killteam.userId && session.user.userId === killteam.userId
  const [voteSummary, setVoteSummary] = useState(killteam.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(
    typeof killteam.userVote === 'undefined' ? null : killteam.userVote
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!killteam.isHomebrew) return
    const needsSummary = !killteam.voteSummary
    const needsUserVote = !!session?.user?.userId && typeof killteam.userVote === 'undefined'
    if (!needsSummary && !needsUserVote) return

    let cancelled = false
    fetch(`/api/killteams/${killteam.killteamId}/vote`)
      .then(res => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setVoteSummary(data.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
        setUserVote(typeof data.userVote === 'undefined' ? null : data.userVote)
      })
      .catch(() => {
        /* ignore */
      })
    return () => { cancelled = true }
  }, [killteam.killteamId, killteam.isHomebrew, killteam.voteSummary, killteam.userVote, session?.user?.userId])

  const handleVote = useCallback(async (choice: 'up' | 'down') => {
    if (!killteam.isHomebrew) return
    if (!session?.user) {
      toast.info('Log in to vote on homebrew teams')
      return
    }
    if (isSubmitting) return

    setIsSubmitting(true)
    const sameSelection = userVote === choice
    const method = sameSelection ? 'DELETE' : 'POST'
    const body = sameSelection ? undefined : JSON.stringify({ value: choice })

    try {
      const res = await fetch(`/api/killteams/${killteam.killteamId}/vote`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body,
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const data = await res.json()
      setVoteSummary(data.voteSummary ?? { upvotes: 0, downvotes: 0, total: 0, ratio: 0 })
      setUserVote(typeof data.userVote === 'undefined' ? null : data.userVote)
    } catch (err: any) {
      toast.error(err?.message || 'Could not update vote')
    } finally {
      setIsSubmitting(false)
    }
  }, [killteam.killteamId, killteam.isHomebrew, session?.user, userVote, isSubmitting])

  const ratio = voteSummary.total > 0 ? Math.round((voteSummary.ratio ?? 0) * 100) : 0

  return (
    <div className="group grid grid-cols-[120px_1fr] md:grid-cols-[150px_1fr] bg-card border border-border rounded overflow-hidden hover:border-main transition min-h-[110px]">
      {/* Image section - left side */}
      <Link href={`/killteams/${killteam.killteamId}`} className="relative overflow-hidden">
        <div 
          className="absolute inset-0 border-r border-border bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
          style={{
            backgroundImage: killteam.isHomebrew && killteam.userId
              ? `url(/api/killteams/${killteam.killteamId}/portrait?thumb=1)`
              : `url(/img/killteams/${killteam.killteamId}_thumb.webp)`
          }}
        />
      </Link>

      {/* Content section - right side */}
      <div className="relative px-3 py-2 flex flex-col h-full min-w-0">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-x-1 min-h-[1.5rem]">
            <Link href={`/killteams/${killteam.killteamId}`} className="block overflow-hidden">
              <h6 className="font-heading text-main truncate leading-snug whitespace-nowrap">{killteam.killteamName}</h6>
            </Link>
            {canEdit && (
              <Link
                href={`/killteams/${killteam.killteamId}/edit`}
                className="ml-auto p-1 text-muted hover:text-main"
                title="Edit"
              >
                <FiEdit className="w-4 h-4" />
              </Link>
            )}
          </div>
          {killteam.isHomebrew && (
            <div className="truncate min-w-0 text-sm text-muted flex items-center gap-1.5">
              <div>
                Homebrew
                {killteam.isHomebrew && !killteam.isPublished && (' (Unpublished)')}
                {killteam.user && (
                  <> by <UserLink userName={killteam.user.userName ?? 'Unknown'} /></>
                )}
              </div>
              {killteam.user && killteam.isPublished && (
                <div className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                  {`${killteam.rosterCount ?? 0} Roster${(killteam.rosterCount ?? 0) === 1 ? '' : 's'}`}
                </div>
              )}
            </div>
          )}
          <Markdown className={clsx('text-sm leading-tight', killteam.isHomebrew ? 'line-clamp-1' : 'line-clamp-3')}>
            {killteam.description}
          </Markdown>
        </div>
        {killteam.isHomebrew && killteam.isPublished && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <div className="flex flex-col">
              <span className="text-muted">
                {voteSummary.total > 0 ? `${ratio}% positive` : 'No votes yet'}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                className={clsx(
                  'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition',
                  userVote === 'up'
                    ? 'border-main bg-main/10 text-main'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
                disabled={isSubmitting}
                onClick={() => handleVote('up')}
                title="Thumbs up"
              >
                <FiThumbsUp className="h-3.5 w-3.5" />
                {voteSummary.upvotes}
              </button>
              <button
                type="button"
                className={clsx(
                  'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs transition',
                  userVote === 'down'
                    ? 'border-red-500 bg-red-500/10 text-red-500'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
                disabled={isSubmitting}
                onClick={() => handleVote('down')}
                title="Thumbs down"
              >
                <FiThumbsDown className="h-3.5 w-3.5" />
                {voteSummary.downvotes}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
