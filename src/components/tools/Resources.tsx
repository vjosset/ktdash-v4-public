import Link from 'next/link'
import { SectionTitle } from '../ui'

export default function Resources() {
  return (
    <div className="space-y-4">
      <div className="section">
        <SectionTitle>Resources</SectionTitle>
        <em>Coming soon!</em>
      </div>
      <div className="section">
        <SectionTitle>Community</SectionTitle>
        <p className="text-muted">
          This is a Community-driven project, and we welcome contributions, feedback, and suggestions.
          If you have ideas for new features, improvements, or just want to chat about the game, please join our community channels.
        </p>
        <ul>
          <li><Link href="https://discord.gg/zyuVDgYNeY" target="_blank" className="underline">Discord</Link></li>
          <li><Link href="https://github.com/vjosset/ktdash-v4" target="_blank" className="underline">GitHub</Link></li>
        </ul>
      </div>
    </div>
  )
}