import { cn } from '@/lib/utils'

interface IPhoneMockupProps {
  children: React.ReactNode
  className?: string
  darkStatusBar?: boolean
}

export function IPhoneMockup({ children, className, darkStatusBar = false }: IPhoneMockupProps) {
  const iconColor = darkStatusBar ? 'rgba(0,0,0,0.85)' : 'white'
  const iconOpacity60 = darkStatusBar ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'
  const iconOpacity30 = darkStatusBar ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.45)'

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

      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center" style={{ height: 50, paddingLeft: 20, paddingRight: 14 }}>
        <span
          style={{
            fontFamily: '-apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            color: iconColor,
            letterSpacing: '-0.3px',
          }}
        >
          9:41
        </span>

        <div className="flex items-center gap-[6px]">
          {/* Cellular — 4 bars, iOS style */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill={iconColor}>
            <rect x="0" y="8.5" width="3" height="3.5" rx="1"/>
            <rect x="5" y="6"   width="3" height="6"   rx="1" opacity="0.5"/>
            <rect x="10" y="3"  width="3" height="9"   rx="1" opacity="0.75"/>
            <rect x="15" y="0"  width="3" height="12"  rx="1"/>
          </svg>

          {/* WiFi — stroke arcs + dot, iOS style */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke={iconColor} strokeLinecap="round">
            <circle cx="8" cy="10.5" r="1.4" fill={iconColor} stroke="none"/>
            <path d="M4.6 7.5a4.8 4.8 0 0 1 6.8 0" strokeWidth="1.5" opacity="0.75"/>
            <path d="M1.5 4.5a9.5 9.5 0 0 1 13 0" strokeWidth="1.5" opacity="0.4"/>
          </svg>

          {/* Battery — iOS style pill with nub */}
          <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
            {/* Shell */}
            <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke={iconOpacity60} strokeWidth="1"/>
            {/* Fill ~80% */}
            <rect x="2" y="2" width="16.5" height="9" rx="2" fill={iconColor}/>
            {/* Nub */}
            <path d="M23.5 4.5 C24.5 4.5 25.5 5.2 25.5 6.5 C25.5 7.8 24.5 8.5 23.5 8.5" stroke={iconOpacity30} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Content fills full phone — screens must add their own paddingTop: 50 */}
      <div className="absolute inset-0 flex flex-col">
        {children}
      </div>

      {/* Home indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: 6,
          width: 100,
          height: 4,
          background: darkStatusBar ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)',
          borderRadius: 2,
        }}
      />
    </div>
  )
}
