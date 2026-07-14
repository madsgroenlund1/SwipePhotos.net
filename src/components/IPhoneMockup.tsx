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

        <div className="flex items-center gap-[7px]">
          {/* Cellular — 4 rounded bars, increasing height, evenly spaced */}
          <svg width="18" height="12" viewBox="0 0 18 12" fill={iconColor}>
            <rect x="0"    y="8"    width="3.2" height="4"    rx="1"/>
            <rect x="4.9"  y="6"    width="3.2" height="6"    rx="1"/>
            <rect x="9.8"  y="3.2"  width="3.2" height="8.8"  rx="1"/>
            <rect x="14.7" y="0.5"  width="3.2" height="11.5" rx="1"/>
          </svg>

          {/* WiFi — 3 concentric arcs + dot, equal stroke weight */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" strokeLinecap="round">
            <path d="M0.8 4.6a10.5 10.5 0 0 1 14.4 0" stroke={iconColor} strokeWidth="1.5"/>
            <path d="M3.4 7.4a6.8 6.8 0 0 1 9.2 0"    stroke={iconColor} strokeWidth="1.5"/>
            <path d="M6 10.1a3.1 3.1 0 0 1 4 0"        stroke={iconColor} strokeWidth="1.5"/>
            <circle cx="8" cy="11.3" r="0.9" fill={iconColor}/>
          </svg>

          {/* Battery — shell + fill + small rect nub (not a curved bump) */}
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={iconColor} strokeOpacity="0.4" strokeWidth="1"/>
            <rect x="2" y="2" width="17" height="8" rx="2" fill={iconColor}/>
            <rect x="22.5" y="4" width="1.6" height="4" rx="0.8" fill={iconColor} fillOpacity="0.4"/>
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
