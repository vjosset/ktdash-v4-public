import AuthButtons from '@/components/home/HomeAuthButtons'
import KillteamCard from '@/components/killteam/KillteamCard'
import { authOptions } from '@/lib/auth'
import { GAME } from '@/lib/config/game_config'
import { generatePageMetadata } from '@/lib/utils/generateMetadata'
import news from '@/public/news.json'
import { KillteamService } from '@/services/killteam.service'
import NewsCard from '@/src/components/home/NewsCard'
import { getServerSession } from "next-auth"
import Link from 'next/link'

export async function generateMetadata() {
  return generatePageMetadata({
    title: 'Home',
    description: `${GAME.NAME} is a web-based application for running your KillTeam games.`,
    image: {
      url: '/img/homesplash_5.jpg',
    },
    keywords: ['home', 'roster builder', 'battle tracker'],
    pagePath: '/'
  })
}

export default async function Home() {
  const session = await getServerSession(authOptions)
  const isLoggedIn = !!session

  const killteams =  await KillteamService.getAllKillteams()

  return (
    <>
      <div
        className="relative m-0 p-0"
        style={{
          backgroundImage: 'url(\'/img/homesplash_5.jpg\')',
          backgroundPosition: 'center top',
          WebkitBackgroundSize: 'cover',
          MozBackgroundSize: 'cover',
          backgroundSize: 'cover',
        }}>
        {/* Add an overlay div for the gradient */}
        <div className="absolute inset-0" 
          style={{
            background: 'linear-gradient(to bottom, rgba(16, 16, 16, 0.1), rgba(16, 16, 16, 0.75), rgba(16, 16, 16, 1))',
            pointerEvents: 'none',
          }}
        />
        
        <div className="relative pt-48 text-center text-muted max-w-lg mx-auto mt-2">
          <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
            {/*<div className="h-12 w-12 mb-2 rounded-2xl glowbox">
              <img className="h-12 w-12" src="/icons/icon-big.png" />
            </div>*/}
            <h1 className="glowtext">{GAME.NAME}</h1>
          </div>
          <p className="text-center mx-8">
            {GAME.NAME} is a free web-based application for running your KillTeam games. Manage rosters and operatives, keep track of Wounds, CP, TP, and MP, and explore other players' rosters.
            <br/><br/>
            Browse the <Link href="/killteams" style={{textDecoration: 'underline'}}>Killteams</Link>
            {isLoggedIn && (<>, build <Link href="/me" style={{textDecoration: 'underline'}}>your rosters</Link>, or import a <Link href="/users/KTDash" style={{textDecoration: 'underline'}}>pre-built roster</Link></>)}
            {!isLoggedIn && (<>, build your rosters, or import a <Link href="/users/KTDash" style={{textDecoration: 'underline'}}>pre-built roster</Link></>)}
          </p>
          
          <AuthButtons />
          
        </div>
      </div>

      {/* Killteams List */}
      <div className="px-2 py-8 max-w-7xl mx-auto">
        <h2 className="text-center text-main font-title mb-4">Killteams</h2>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
          {killteams.map((killteam) => (
            <KillteamCard key={killteam.killteamId} killteam={killteam} />
          ))}
        </div>
      </div>

      {/* News */}
      <div className="max-w-3xl mx-auto p-4 news">
        <h3 className="text-main font-title mb-4">Latest News</h3>
        {news.map((item, idx) => (
          <NewsCard key={idx} item={item} />
        ))}
      </div>
    </>
  )
}
