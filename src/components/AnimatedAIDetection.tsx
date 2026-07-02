'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { IPhoneMockup } from './IPhoneMockup'

const PHOTO = '/photos/before-after/julius/after/1.jpg'

type Screen = 'chatgpt' | 'google' | 'scanner'

const CHATGPT_REPLY = "No — this looks like a genuine photo. I don't see any signs of AI generation."

export function AnimatedAIDetection() {
  const [screen, setScreen] = useState<Screen>('chatgpt')
  const [phase, setPhase] = useState(0)
  const [typed, setTyped] = useState('')
  const [scanPct, setScanPct] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    function delay(ms: number) {
      return new Promise<void>(res => {
        timerRef.current = setTimeout(() => { if (!cancelled) res() }, ms)
      })
    }

    async function run() {
      while (!cancelled) {
        // ── ChatGPT ──
        setScreen('chatgpt'); setPhase(0); setTyped('')
        await delay(500)
        setPhase(1)
        await delay(700)
        setPhase(2)
        await delay(700)
        setPhase(3)
        await delay(900)
        setPhase(4)
        let i = 0
        await new Promise<void>(res => {
          const iv = setInterval(() => {
            if (cancelled) { clearInterval(iv); res(); return }
            i++
            setTyped(CHATGPT_REPLY.slice(0, i))
            if (i >= CHATGPT_REPLY.length) { clearInterval(iv); res() }
          }, 22)
        })
        await delay(2600)

        // ── Google ──
        setScreen('google'); setPhase(0); setTyped('')
        await delay(400)
        setPhase(1)
        await delay(600)
        setPhase(2)
        await delay(800)
        setPhase(3)
        await delay(2800)

        // ── Scanner ──
        setScreen('scanner'); setPhase(0); setScanPct(0)
        await delay(400)
        setPhase(1)
        await new Promise<void>(res => {
          let p = 0
          const iv = setInterval(() => {
            if (cancelled) { clearInterval(iv); res(); return }
            p += 2
            setScanPct(p)
            if (p >= 100) { clearInterval(iv); res() }
          }, 18)
        })
        setPhase(2)
        await delay(2600)
      }
    }

    run()
    return () => { cancelled = true; if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-blue-400 text-sm font-medium">The #1 trusted solution</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The <span className="text-blue-500">ONLY</span> undetectable<br />AI photo generator
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Girls Google your photos. Dating apps scan for AI. SwipePhotos is the ONLY generator that passes every test.
          </p>
        </div>

        {/* Phone */}
        <div className="flex justify-center">
          <IPhoneMockup className="w-[280px]" darkStatusBar>

            {/* ────────── ChatGPT ────────── */}
            {screen === 'chatgpt' && (
              <div className="flex flex-col h-full bg-white" style={{ paddingTop: 50 }}>
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2.5 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.032.067L9.856 19.93a4.5 4.5 0 0 1-6.256-1.626zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .072 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.679zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-[15px] text-black">ChatGPT</span>
                </div>

                {/* Messages */}
                <div className="flex-1 px-3 pt-3 pb-6 flex flex-col gap-2.5 justify-end overflow-hidden">
                  {phase >= 1 && (
                    <div className="self-end rounded-2xl rounded-br-sm overflow-hidden border border-gray-200 shadow-sm anim-fade-up">
                      <div className="relative w-[110px] h-[130px]">
                        <Image src={PHOTO} alt="" fill className="object-cover object-top" sizes="110px" />
                      </div>
                    </div>
                  )}
                  {phase >= 2 && (
                    <div className="self-end bg-[#F4F4F4] rounded-2xl rounded-br-sm px-3 py-2 anim-fade-up">
                      <p className="text-[12px] text-gray-800">is this photo AI-generated?</p>
                    </div>
                  )}
                  {phase === 3 && (
                    <div className="self-start bg-[#F4F4F4] rounded-2xl rounded-bl-sm px-4 py-2.5 anim-fade-up">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-gray-400" style={{ animation: `aiDetBounce .9s ${i*.18}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {phase >= 4 && (
                    <div className="self-start bg-[#F4F4F4] rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[90%] anim-fade-up">
                      <p className="text-[11.5px] text-gray-800 leading-relaxed">
                        {typed}
                        {phase === 4 && typed.length < CHATGPT_REPLY.length && (
                          <span className="inline-block w-[1.5px] h-[11px] bg-gray-500 ml-px align-middle animate-pulse" />
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ────────── Google ────────── */}
            {screen === 'google' && (
              <div className="flex flex-col h-full bg-white" style={{ paddingTop: 50 }}>
                {/* Search bar */}
                <div className="px-3 pt-3 pb-2 flex-shrink-0">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-2">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {phase >= 1 && (
                      <div className="relative w-6 h-6 rounded overflow-hidden flex-shrink-0 anim-fade-up">
                        <Image src={PHOTO} alt="" fill className="object-cover" sizes="24px" />
                      </div>
                    )}
                    <span className="text-gray-500 text-[12px]">is this ai?</span>
                    <div className="ml-auto">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-400"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    </div>
                  </div>
                </div>

                {phase >= 2 && (
                  <div className="border-b border-gray-100 px-3 pb-2 flex gap-4 flex-shrink-0 anim-fade-up">
                    {['All', 'Visual matches', 'About'].map((t, i) => (
                      <span key={t} className={`text-[11px] pb-1.5 ${i === 0 ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}>{t}</span>
                    ))}
                  </div>
                )}

                {phase >= 3 && (
                  <div className="flex-1 px-3 pt-3 overflow-hidden anim-fade-up">
                    {/* AI Overview box */}
                    <div className="bg-[#F0F4FF] rounded-2xl p-3.5 mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue-600"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        <span className="text-blue-700 font-semibold text-[12px]">AI Overview</span>
                      </div>
                      <p className="text-[11.5px] text-gray-800 leading-relaxed">
                        Technical analysis <strong>does not</strong> indicate this image was generated or modified using AI. There&apos;s no SynthID watermarking detected.
                      </p>
                    </div>
                    {/* Search image thumbnail */}
                    <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl p-2">
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={PHOTO} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                      <div>
                        <p className="text-blue-600 text-[11px] font-medium">Uploaded image</p>
                        <p className="text-gray-400 text-[10px]">No matches found</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ────────── AI Scanner ────────── */}
            {screen === 'scanner' && (
              <div className="flex flex-col h-full bg-white" style={{ paddingTop: 50 }}>
                {/* Header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between flex-shrink-0 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                    </div>
                    <span className="font-bold text-[14px] text-black">AI Image Analysis</span>
                  </div>
                  <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-[11px]">✕</span>
                  </div>
                </div>

                {/* Scan progress bar */}
                <div className="px-4 pt-3 pb-2 flex-shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-gray-400 text-[10px]">Analysing image...</span>
                    <span className="text-gray-500 text-[10px] font-medium">{scanPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${scanPct}%`, transitionDuration: '50ms' }}
                    />
                  </div>
                </div>

                {phase >= 2 ? (
                  <div className="flex-1 px-4 py-3 flex flex-col gap-3 anim-fade-up">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 rounded-xl py-2.5">
                        <p className="text-green-500 font-bold text-[20px] leading-none">3%</p>
                        <p className="text-gray-400 text-[9px] mt-1">AI Probability</p>
                      </div>
                      <div className="bg-green-50 rounded-xl py-2.5">
                        <p className="text-green-500 font-bold text-[20px] leading-none">98%</p>
                        <p className="text-gray-400 text-[9px] mt-1">Confidence</p>
                      </div>
                      <div className="bg-green-50 rounded-xl py-2.5">
                        <p className="text-green-600 font-bold text-[13px] leading-none mt-1">Human</p>
                        <p className="text-gray-400 text-[9px] mt-1">Classification</p>
                      </div>
                    </div>

                    {/* Photo with dashed green border */}
                    <div className="border-2 border-dashed border-green-400 rounded-2xl p-3 bg-green-50 flex flex-col items-center gap-2">
                      <div className="relative w-[88px] h-[100px] rounded-xl overflow-hidden">
                        <Image src={PHOTO} alt="" fill className="object-cover object-top" sizes="88px" />
                      </div>
                      <p className="text-gray-400 text-[9px]">IMG_0648.jpeg · 1.37 MB</p>
                    </div>

                    {/* Result */}
                    <div className="bg-green-500 rounded-2xl py-3 flex items-center justify-center gap-2">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                      <span className="text-white font-semibold text-[13px]">No AI detected</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-300 text-[12px]">Scanning photo...</p>
                  </div>
                )}
              </div>
            )}
          </IPhoneMockup>
        </div>

        {/* Indicator dots */}
        <div className="flex justify-center gap-2 mt-8">
          {(['chatgpt', 'google', 'scanner'] as Screen[]).map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${screen === s ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <style>{`
        .anim-fade-up { animation: aiDetFadeUp .3s ease both; }
        @keyframes aiDetFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes aiDetBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-5px); } }
      `}</style>
    </section>
  )
}
