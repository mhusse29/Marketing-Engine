import PlatformIconButton from '@/components/PlatformIconButton'
import Tooltip from '@/components/primitives/Tooltip'
import { getPlatformLabel } from '@/ui/platformUtils'

export type PlatformPillProps = {
  name: string
  selected?: boolean
  onClick?: () => void
  tooltip?: string
  className?: string
}

export default function PlatformPill({
  name,
  selected = false,
  onClick,
  tooltip,
  className,
}: PlatformPillProps) {
  const label = getPlatformLabel(name)

  const button = (
    <PlatformIconButton
      name={name}
      selected={selected}
      onToggle={() => onClick?.()}
      size={40}
      className={className}
    />
  )

  return tooltip ? <Tooltip label={tooltip}>{button}</Tooltip> : <Tooltip label={label}>{button}</Tooltip>
}
