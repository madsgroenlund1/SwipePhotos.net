'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { IPhoneMockup } from './IPhoneMockup'

const RESPONSE = "Technical analysis does not indicate this image was generated using AI. There's no SynthID watermarking detected."

export function AnimatedAIDetection() {
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'asking' | 'thinking' | 'typing' | 'done'>('idle')
  const [typed, setTyped] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function run() {
      setPhase('idle')
      setTyped('')

      timerRef.current = setTimeout(() => {
        setPhase('uploading')

        timerRef.current = setTimeout(() => {
          setPhase('asking')

          timerRef.current = setTimeout(() => {
            setPhase('thinking')

            timerRef.current = setTimeout(() => {
              setPhase('typing')
              let i = 0
              const iv = setInterval(() => {
                i++
                setTyped(RESPONSE.slice(0, i))
                if (i >= RESPONSE.length) {
                  clearInterval(iv)
                  setPhase('done')
                  timerRef.current = setTimeout(run, 3500)
                }
              }, 26)
            }, 1200)
          }, 600)
        }, 700)
      }, 500)
    }

    run()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function renderTyped(text: string) {
    const marker = 'not indicate'
    const idx = text.indexOf(marker)
    if (idx === -1) return <span>{text}</span>
    return (
      <>
        {text.slice(0, idx)}
        <strong className="font-bold">{text.slice(idx, idx + marker.length)}</strong>
        {text.slice(idx + marker.length)}
      </>
    )
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-blue-400 text-sm font-medium">The #1 trusted solution</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            The <span className="text-blue-500">ONLY</span> undetectable<br />AI photo generator
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Girls Google your photos. Dating apps scan for AI. SwipePhotos is the ONLY generator
            that passes every test.
          </p>
        </div>

        {/* Single centered phone */}
        <div className="flex justify-center">
          <IPhoneMockup className="w-[280px]">
            <div className="flex flex-col h-full bg-white text-black">
              {/* ChatGPT header */}
              <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2 flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">ChatGPT</span>
              </div>

              {/* Chat area */}
              <div className="flex-1 bg-white px-4 py-3 flex flex-col gap-3 overflow-hidden justify-end">

                {/* Julius photo upload */}
                {(phase !== 'idle') && (
                  <div className="self-end rounded-2xl rounded-br-sm overflow-hidden border border-gray-200 shadow-sm"
                    style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    <div className="relative w-[120px] h-[140px]">
                      <Image
                        src="/photos/before-after/julius/after/1.jpg"
                        alt="Julius AI photo"
                        fill
                        className="object-cover object-top"
                        sizes="120px"
                      />
                    </div>
                  </div>
                )}

                {/* User question */}
                {(phase === 'asking' || phase === 'thinking' || phase === 'typing' || phase === 'done') && (
                  <div className="bg-gray-100 rounded-2xl rounded-br-sm px-3.5 py-2.5 self-end"
                    style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    <p className="text-gray-800 text-xs">is this AI generated?</p>
                  </div>
                )}

                {/* Thinking dots */}
                {phase === 'thinking' && (
                  <div className="bg-[#f0f4ff] rounded-2xl rounded-bl-sm px-4 py-3 self-start"
                    style={{ animation: 'fadeUp 0.3s ease forwards' }}>
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-gray-400"
                          style={{ animation: `bounce 0.9s ${i * 0.18}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Typing response */}
                {(phase === 'typing' || phase === 'done') && (
                  <div className="bg-[#f0f4ff] rounded-2xl rounded-bl-sm px-3.5 py-2.5 self-start max-w-[90%]"
                    style={{ animation: 'fadeUp 0.2s ease forwards' }}>
                    <p className="text-gray-800 text-xs leading-relaxed">
                      {renderTyped(typed)}
                      {phase === 'typing' && (
                        <span className="inline-block w-[1.5px] h-[12px] bg-gray-600 ml-[1px] align-middle animate-pulse" />
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </IPhoneMockup>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
      `}</style>
    </section>
  )
}
