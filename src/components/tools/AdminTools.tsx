'use client'

import { format } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { FaBolt, FaUsers } from 'react-icons/fa6'
import { FiCheck, FiLock, FiRotateCw, FiStar } from 'react-icons/fi'
import { RosterLink, UserLink } from '../shared/Links'
import { SectionTitle } from '../ui'
import Button from '../ui/Button'
import ResetUserPasswordModal from './ResetUserPasswordModal'

export default function AdminTools() {
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Admin modal state
  const [showResetUserPwd, setShowResetUserPwd] = useState(false)
  
  const refreshStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/adminstats', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch admin stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
      setError('Could not load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  if (loading) return <p className="text-sm text-muted">Loading stats...</p>
  if (error) return <p className="text-sm text-red-500">{error}</p>
  if (!stats) return null

  return  (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <SectionTitle>
          <button
            onClick={refreshStats}
            title="Refresh stats"
            className="cursor-pointer"
          >
            {stats.datestamp &&
              format(stats.datestamp, 'yyyy-MM-dd HH:mm')
            }
            <FiRotateCw className="inline ml-1 mb-1 text-sm" />
          </button>
        </SectionTitle>

        {/* Right-aligned quick stats */}
        <div className="flex items-center gap-4 text-main">
          <div className="flex items-center gap-1">
            <FaUsers />
            <span>{stats.activeUsers30min}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaBolt />
            <span>{stats.events30min}</span>
          </div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-center font-bold">
            <td>Users</td>
            <td>Rosters</td>
            <td>Ops</td>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center">
            <td>{stats.totals.users.toLocaleString()}</td>
            <td>{stats.totals.rosters.toLocaleString()}</td>
            <td>{stats.totals.ops.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <SectionTitle>Stats</SectionTitle>
      <table className="w-full">
        <thead>
          <tr className="font-bold">
            <td>Date</td>
            <td className="text-right">Users (L/A)</td>
            <td className="text-right">Signups</td>
            <td className="text-right">Views</td>
          </tr>
        </thead>
        <tbody>
          {stats.dailyStats.map((dat: any) => (
            <tr key={`dailyStats_${dat.date}`}>
              <td>{dat.date}</td>
              <td className="text-right">{(dat.uniqueLoggedInUsers ?? 0).toLocaleString()} | {(dat.uniqueAnonymousUsers ?? 0).toLocaleString()}</td>
              <td className="text-right">{dat.signups.toLocaleString()}</td>
              <td className="text-right">{dat.views.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <SectionTitle>Recent Portraits</SectionTitle>
      {stats.portraitEvents.length === 0 ? (
        <p className="text-muted">No fully custom rosters uploaded recently.</p>
      ) : (
        <div className="space-y-2">
          {stats.portraitEvents.map((e: any) => (
            <div key={e.rosterId}>
              <h6>{format(new Date(e.latestEventAt), 'yyyy-MM-dd HH:mm')}</h6>
              <div key={e.rosterId} className="flex items-center gap-2 text-sm">
                {e.isPrivate
                  ? <FiLock className="text-muted" title="User has set their rosters to private" />
                  : e.isSpotlight
                    ? <FiStar className="text-main" />
                    : e.isComplete
                      ? <FiCheck />
                      : <FiStar className="invisible" />
                }
                <RosterLink rosterId={e.rosterId} rosterName={e.rosterName} toGallery={true} newTab={true} />
                {' by '}
                <UserLink userName={e.userName} newTab={true} />
                (
                  {e.hasCustomPortrait ? '1 - ' : '0 - '}
                  {e.customOps}/{e.totalOps}
                )
              </div>
            </div>
          ))}
        </div>
      )}

      <hr/>
      
      <div className="p-3 space-y-3">
        <Button onClick={() => setShowResetUserPwd(true)}>Reset User Password</Button>
      </div>
      {showResetUserPwd && (
        <ResetUserPasswordModal onClose={() => setShowResetUserPwd(false)} />
      )}
    </div>
  )
}
