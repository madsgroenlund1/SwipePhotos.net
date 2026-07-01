import { cn } from '@/lib/utils'

interface IPhoneMockupProps {
  children: React.ReactNode
  className?: string
}

export function IPhoneMockup({ children, className }: IPhoneMockupProps) {
  return (
    <div
      className={cn(
        'relative mx-auto bg-black rounded-[48px] shadow-2xl overflow-hidden',
        'w-[220px]',
        className
      )}
      style={{
        aspectRatio: '9/19.5',
        border: '2px solid #3a3a3c',
        boxShadow: '0 0 0 1px #1c1c1e, 0 30px 80px rgba(0,0,0,0.8)',
      }}
    >
      {/* Dynamic Island */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-20 bg-black rounded-full"
        style={{ top: 10, width: 88, height: 30 }}
      />

      {/* Status bar — flanks the Dynamic Island */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-5" style={{ height: 50 }}>
        {/* Time — left of island */}
        <span
          style={{
            fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: 'white',
            letterSpacing: '-0.3px',
          }}
        >
          9:41
        </span>

        {/* Icons — right of island */}
        <div className="flex items-center gap-[5px]">
          {/* Cellular signal — 4 bars */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="1" />
            <rect x="4.5" y="5.5" width="3" height="6.5" rx="1" />
            <rect x="9" y="3" width="3" height="9" rx="1" />
            <rect x="13.5" y="0" width="3" height="12" rx="1" />
          </svg>

          {/* WiFi */}
          <svg width="15" height="11" viewBox="0 0 15 11" fill="white">
            <path d="M7.5 8.2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
            <path d="M7.5 5.5c1.4 0 2.7.57 3.63 1.5l1.2-1.2A6.5 6.5 0 0 0 7.5 3.8a6.5 6.5 0 0 0-4.83 2l1.2 1.2A4.6 4.6 0 0 1 7.5 5.5z" opacity=".7"/>
            <path d="M7.5 2.1c2.5 0 4.75.98 6.4 2.57L15 3.6A9.9 9.9 0 0 0 7.5 0 9.9 9.9 0 0 0 0 3.6l1.1 1.07A8.4 8.4 0 0 1 7.5 2.1z" opacity=".4"/>
          </svg>

          {/* Battery */}
          <div className="flex items-center" style={{ gap: 0 }}>
            <div
              style={{
                width: 22,
                height: 11,
                borderRadius: 3,
                border: '1.5px solid rgba(255,255,255,0.7)',
                padding: '1.5px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ width: '80%', height: '100%', background: 'white', borderRadius: 1.5 }} />
            </div>
            <div style={{ width: 2, height: 5, background: 'rgba(255,255,255,0.45)', borderRadius: '0 1px 1px 0' }} />
          </div>
        </div>
      </div>

      {/* Content below status bar */}
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 50 }}>
        {children}
      </div>

      {/* Home indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 6, width: 100, height: 4, background: 'rgba(255,255,255,0.22)', borderRadius: 2 }}
      />
    </div>
  )
}
