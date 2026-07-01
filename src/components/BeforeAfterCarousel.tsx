'use client'

import Image from 'next/image'

const CARDS = [
  { id: 'alex', name: 'Alex', age: 27, beforeCount: 3, beforeExt: 'jpg', afterExt: 'jpg', multiplier: '8x' },
  { id: 'andreas', name: 'Andreas', age: 24, beforeCount: 1, beforeExt: 'jpg', afterExt: 'jpg', multiplier: '12x' },
  { id: 'benni', name: 'Benni', age: 29, beforeCount: 3, beforeExt: 'jpg', afterExt: 'jpg', multiplier: '6x' },
  { id: 'black', name: 'Marcus', age: 26, beforeCount: 3, beforeExt: 'jpg', afterExt: 'jpg', multiplier: '15x' },
  { id: 'jason', name: 'Jason', age: 31, beforeCount: 3, beforeExt: 'jpg', afterExt: 'jpg', multiplier: '10x' },
  { id: 'julius', name: 'Julius', age: 23, beforeCount: 3, beforeExt: 'jpeg', afterExt: 'jpg', multiplier: '20x' },
]

function BeforeAfterCard({ id, name, age, beforeCount, beforeExt, afterExt, multiplier }: typeof CARDS[0]) {
  const beforeNums = Array.from({ length: Math.min(beforeCount, 3) }, (_, i) => i + 1)

  return (
    <div className="flex-shrink-0 w-[400px] bg-[#111] border border-white/8 rounded-2xl p-4 flex gap-3">
      {/* Before photos */}
      <div className="flex flex-col gap-2 w-[110px]">
        <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mb-1">Before</div>
        {beforeNums.map((n) => (
          <div key={n} className="w-full aspect-[3/4] rounded-lg overflow-hidden relative bg-zinc-900">
            <Image
              src={`/photos/before-after/${id}/before/${n}.${beforeExt}`}
              alt={`${name} before ${n}`}
              fill
              className="object-cover"
              sizes="110px"
            />
          </div>
        ))}
      </div>

      {/* After photo */}
      <div className="flex-1 flex flex-col">
        <div className="text-[10px] text-blue-400 font-medium uppercase tracking-wider mb-1">After ✨</div>
        <div className="flex-1 rounded-xl overflow-hidden relative bg-zinc-900" style={{ minHeight: '200px' }}>
          <Image
            src={`/photos/before-after/${id}/after/1.${afterExt}`}
            alt={`${name} after`}
            fill
            className="object-cover"
            sizes="260px"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            <div className="self-end bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              +{multiplier} matches
            </div>
            <div>
              <div className="text-white font-semibold text-sm drop-shadow-lg">{name}, {age}</div>
              <div className="text-blue-300 text-xs drop-shadow">📍 San Francisco</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BeforeAfterCarousel() {
  const doubledRow1 = [...CARDS, ...CARDS]
  const doubledRow2 = [...CARDS.slice(3), ...CARDS.slice(0, 3), ...CARDS.slice(3), ...CARDS.slice(0, 3)]

  return (
    <div className="w-full overflow-hidden py-8 space-y-4">
      {/* Row 1 — scrolls left */}
      <div className="flex gap-4 animate-marquee-left" style={{ width: 'max-content' }}>
        {doubledRow1.map((card, i) => (
          <BeforeAfterCard key={`r1-${i}`} {...card} />
        ))}
      </div>

      {/* Row 2 — scrolls right */}
      <div className="flex gap-4 animate-marquee-right" style={{ width: 'max-content' }}>
        {doubledRow2.map((card, i) => (
          <BeforeAfterCard key={`r2-${i}`} {...card} />
        ))}
      </div>
    </div>
  )
}
