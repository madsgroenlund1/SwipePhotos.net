'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const MAX_FILES = 3

export default function ContactPage() {
  const [email, setEmail]     = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles]     = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string|null>(null)

  function addFiles(list: FileList | null) {
    if (!list) return
    setError(null)
    const next = [...files, ...Array.from(list)].slice(0, MAX_FILES)
    setFiles(next)
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setSending(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('email', email)
      fd.append('subject', subject)
      fd.append('message', message)
      for (const f of files) fd.append('files', f)
      const res = await fetch('/api/contact', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Could not send your message.')
        setSending(false)
        return
      }
      setSent(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center px-4 pt-24 pb-16">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center">
            <span className="text-white font-bold text-2xl tracking-tight">SwipePhotos</span>
            <span className="text-blue-500 font-bold text-2xl tracking-tight">.net</span>
          </Link>
        </div>

        <div className="bg-[#111] border border-white/8 rounded-3xl overflow-hidden">
          {sent ? (
            <div className="p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Message sent</h1>
              <p className="text-zinc-500 text-sm mb-6">Thanks for reaching out — we&apos;ll reply to <span className="text-white">{email}</span> as soon as possible, usually within 24 hours.</p>
              <Link href="/" className="inline-block bg-blue-600 hover:brightness-110 text-white font-semibold px-6 py-3 rounded-2xl text-sm transition-all">Back to home →</Link>
            </div>
          ) : (
            <>
              <div className="px-8 pt-8 pb-6 border-b border-white/6">
                <h1 className="text-xl font-semibold text-white mb-1">Contact us</h1>
                <p className="text-zinc-500 text-sm">Questions, issues, or feedback — we usually reply within 24 hours.</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Your email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="What is it about?" required maxLength={150}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-all" />
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us as much as you can…" required rows={6} maxLength={5000}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500/60 transition-all resize-y" />
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5">Attachments <span className="text-zinc-600">(optional · max {MAX_FILES} files, 8 MB each)</span></label>
                  <input id="contact-files" type="file" multiple className="hidden"
                    accept="image/*,.pdf,.txt,.log"
                    onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
                  <button type="button" onClick={() => document.getElementById('contact-files')?.click()}
                    disabled={files.length >= MAX_FILES}
                    className="w-full border border-dashed border-white/15 hover:border-blue-500/40 rounded-xl px-3.5 py-3 text-zinc-500 hover:text-zinc-300 text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    {files.length ? 'Add another file' : 'Attach screenshots or files'}
                  </button>
                  {files.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {files.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/6 rounded-lg px-3 py-2">
                          <span className="flex-1 text-zinc-300 text-xs truncate">{f.name}</span>
                          <span className="text-zinc-600 text-[10px] flex-shrink-0">{(f.size / 1_000_000).toFixed(1)} MB</span>
                          <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                            className="flex-shrink-0 text-zinc-600 hover:text-red-400 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && <p className="text-red-400 text-xs bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2.5">{error}</p>}

                <button type="submit" disabled={sending}
                  className={cn('w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                    sending ? 'bg-white/5 text-zinc-600 cursor-not-allowed' : 'bg-blue-600 hover:brightness-110 text-white')}>
                  {sending ? <><div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" /> Sending…</> : 'Send message →'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-zinc-700 text-xs mt-5">
          Or email us directly: <a href="mailto:support@swipephotos.net" className="text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors">support@swipephotos.net</a>
        </p>
      </div>
    </div>
  )
}
