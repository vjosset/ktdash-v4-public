/*
  A small count pill for tab labels ("Battles 2"). Renders nothing at zero, so
  callers can pass the count unconditionally.
*/
export default function CountBadge({ count, title }: { count: number; title?: string }) {
  if (count <= 0) return null

  return (
    <span
      className="ml-1 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full bg-main text-foreground text-[10px] leading-none font-bold align-middle"
      title={title}
      aria-label={title}
    >
      {count}
    </span>
  )
}
