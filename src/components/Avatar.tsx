import { useState } from 'react'
import { cn, initials, isImage } from '@/lib/utils'

interface AvatarProps {
  name: string
  avatar?: string
  color?: string
  size?: number
  className?: string
  ring?: boolean
}

export function Avatar({
  name,
  avatar,
  color = '#7c5cff',
  size = 40,
  className,
  ring,
}: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const isImg = !!avatar && isImage(avatar) && !broken
  const isText = !!avatar && !isImage(avatar)
  const fontSize = isText ? size * 0.5 : size * 0.38

  const style: React.CSSProperties = {
    width: size,
    height: size,
    fontSize,
    background: isImg
      ? undefined
      : `linear-gradient(150deg, ${color}, color-mix(in oklab, ${color} 42%, #000))`,
    boxShadow: ring
      ? `0 0 0 2px var(--c-bg), 0 0 0 3px color-mix(in oklab, ${color} 72%, transparent)`
      : undefined,
  }

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white select-none',
        className,
      )}
      style={style}
      aria-hidden
    >
      {isImg ? (
        <img
          src={avatar}
          alt={name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : isText ? (
        <span style={{ lineHeight: 1 }}>{avatar}</span>
      ) : (
        <span style={{ lineHeight: 1 }}>{initials(name) || '?'}</span>
      )}
    </span>
  )
}
