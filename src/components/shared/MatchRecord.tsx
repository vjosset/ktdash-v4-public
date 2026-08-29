/*
  Confirmed win / loss / draw record. Shared by the roster Battles tab and the
  killteam stats tab so the two always read the same way.
*/
export default function MatchRecord({
  wins,
  losses,
  draws,
  winRate,
}: {
  wins: number
  losses: number
  draws: number
  winRate?: string
}) {
  const stats: { label: string; value: string | number }[] = [
    { label: 'W', value: wins },
    { label: 'L', value: losses },
    { label: 'D', value: draws },
  ]

  if (winRate) stats.push({ label: 'Win%', value: winRate })

  return (
    <div className="flex gap-4">
      {stats.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-sm font-bold text-main uppercase tracking-wide leading-none">{label}</span>
          <span className="text-lg font-bold leading-tight">{value}</span>
        </div>
      ))}
    </div>
  )
}
