import { GAME } from '@/lib/config/game_config'
import ToolsPageClient from './ToolsPageClient'

export const metadata = {
  title: `Tools - ${GAME.NAME}`,
  description: `Set your ${GAME.NAME} app preferences.`,
}

export default async function ToolsPage() {
  return (
    <ToolsPageClient />
  )
}
