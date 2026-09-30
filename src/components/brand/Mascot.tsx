'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { MASCOT_HERO, mascotForSport, ribbonOfSport } from '@/lib/mascot'

interface MascotProps {
  size?: number
  alt?: string | null
  className?: string
  showCaption?: boolean
  priority?: boolean
  sport?: string | null
  pose?: string | null
  tilt?: boolean
}
export function Mascot({ size = 240, alt = 'Coal City Games 2026 mascot, Odum Eze', className = '', showCaption = false, priority = false, sport = null, pose = null, tilt = true }: MascotProps) {
  const envSrc = process.env.NEXT_PUBLIC_MASCOT_SRC || undefined
  const finalSrc: string = pose ?? envSrc ?? (sport ? mascotForSport(sport) : MASCOT_HERO)
  const ribbon = ribbonOfSport(sport ?? undefined)
  const ref = useRef<HTMLDivElement>(null)
  const [t, setT] = useState({ rx: 0, ry: 0 })
  const onMove = (e: React.MouseEvent) => {
    if (!tilt || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setT({ rx: -py * 14, ry: px * 16 })
  }
  return (
    <figure className={'flex flex-col items-center gap-2 ' + className} style={{ width: size }}>
      <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setT({ rx: 0, ry: 0 })}
        role={alt ? 'img' : undefined} aria-label={alt ?? undefined} aria-hidden={alt ? undefined : true}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        style={{ width: size, height: (size * 1024) / 765,
          boxShadow: '0 18px 50px -20px ' + ribbon + '55' }}>
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: ribbon }} aria-hidden="true" />
        <div className="absolute -inset-10 opacity-30 blur-2xl" aria-hidden="true"
          style={{ background: 'radial-gradient(60% 50% at 50% 35%, ' + ribbon + '66, transparent 70%)' }} />
        <Image src={finalSrc} alt={alt ?? ''} width={765} height={1024}
          style={{ width: size, height: (size * 1024) / 765,
            transform: 'rotateX(' + t.rx + 'deg) rotateY(' + t.ry + 'deg) scale(1.02)',
            transformStyle: 'preserve-3d' }}
          className="h-auto w-auto object-contain transition-transform duration-150 ease-out will-change-transform" priority={priority} />
        <div className="pointer-events-none absolute inset-0" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 30%, transparent 70%, rgba(0,0,0,0.25))' }} />
      </div>
      {showCaption && alt ? (
        <figcaption className="text-center text-xs leading-relaxed text-gray-400">{alt}</figcaption>
      ) : null}
    </figure>
  )
}
export default Mascot
