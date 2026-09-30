import Image from 'next/image'
import { SPORT_POSES } from '@/lib/mascot'
export function SportMascotStrip({ activeCode = null }: { activeCode?: string | null }) {
  return (
    <section aria-label="Meet Odum Eze across all sports" className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Meet Odum Eze</p>
          <h2 className="text-xl font-extrabold text-white">One mascot, every sport</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">Festival daylight theme: each sport family carries its ribbon colour (DESIGN.md). Combat crimson, team green, racquet royal blue, timed amber.</p>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SPORT_POSES.map((s) => (
          <figure key={s.code} className={'w-28 shrink-0 snap-start overflow-hidden rounded-xl border bg-[#0f172a] ' + (activeCode === s.code ? 'border-white/40' : 'border-white/10')}>
            <div className="h-1 w-full" style={{ background: s.ribbon }} aria-hidden="true" />
            <Image src={s.src} alt={'Odum Eze ' + s.label} width={224} height={300} loading="lazy" className="h-36 w-full object-contain" />
            <figcaption className="px-2 py-1.5 text-center text-[11px] font-semibold capitalize text-gray-300">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
export default SportMascotStrip
