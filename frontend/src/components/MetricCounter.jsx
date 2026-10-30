import React, { useEffect, useState } from 'react'
import TiltCard from './TiltCard'

export default function MetricCounter({
  label,
  value,
  detail,
  icon: Icon,
  accent = false,
  color = 'mint',
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof value !== 'number') return

    let start = 0
    const end = value
    const duration = 800
    const frameRate = 30
    const totalFrames = Math.round(duration / (1000 / frameRate))
    const increment = (end - start) / totalFrames

    let currentFrame = 0
    const timer = setInterval(() => {
      currentFrame++
      start += increment
      if (currentFrame >= totalFrames) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.round(start))
      }
    }, 1000 / frameRate)

    return () => clearInterval(timer)
  }, [value])

  const getColorClasses = () => {
    switch (color) {
      case 'rose':
        return {
          iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
          textGlow: 'text-rose-400',
        }
      case 'blue':
        return {
          iconBg: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
          textGlow: 'text-blue-400',
        }
      case 'amber':
        return {
          iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
          textGlow: 'text-amber-400',
        }
      case 'purple':
        return {
          iconBg: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
          textGlow: 'text-purple-400',
        }
      default:
        return {
          iconBg: accent
            ? 'bg-mint/15 text-mint border border-mint/30 shadow-[0_0_15px_rgba(114,227,208,0.2)]'
            : 'bg-[#182633] text-slate-300 border border-line',
          textGlow: accent ? 'text-mint' : 'text-white',
        }
    }
  }

  const { iconBg, textGlow } = getColorClasses()

  return (
    <TiltCard
      maxRotation={6}
      scale={1.02}
      className="p-4 sm:p-5 transition-shadow hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted tracking-wide">{label}</span>
        <div className={`rounded-xl p-2.5 transition-transform group-hover:scale-110 ${iconBg}`}>
          <Icon size={18} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1">
        <span className={`display-font text-2xl sm:text-3xl font-bold tracking-tight ${textGlow}`}>
          {typeof value === 'number' ? displayValue : value}
        </span>
      </div>

      <div className="mt-1.5 text-[11px] text-muted flex items-center gap-1.5">
        <span className="h-1 w-1 rounded-full bg-slate-500" />
        {detail}
      </div>
    </TiltCard>
  )
}
