import { PLATFORMS } from '@/components/platforms/platforms'
import { iconUrl } from '@/icons/platforms/loader'
import { getPlatformId } from '@/ui/platformUtils'

type IconProps = {
  name: string
  size?: number
  className?: string
  colorClassName?: string
}

export default function PlatformIcon({
  name,
  size = 18,
  className,
  colorClassName = 'text-white',
}: IconProps) {
  const id = getPlatformId(name)
  const dimension = typeof size === 'number' ? size : Number.parseInt(String(size), 10) || 18

  if (id && PLATFORMS[id]) {
    const IconComponent = PLATFORMS[id].Icon as React.ComponentType<{
      className?: string
      size?: number
      color?: string
    }>;
    return (
      <IconComponent
        size={dimension}
        className={`${colorClassName} ${className ?? ''}`}
        color="currentColor"
        aria-hidden
      />
    )
  }

  const url = iconUrl(name)
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={dimension}
        height={dimension}
        className={`block ${className ?? ''}`}
      />
    )
  }

  return (
    <span
      className={`text-white/80 ${className ?? ''}`}
      aria-hidden
      style={{ fontSize: `${Math.round(dimension * 0.55)}px` }}
    >
      {name[0]?.toUpperCase() ?? '?'}
    </span>
  )
}
