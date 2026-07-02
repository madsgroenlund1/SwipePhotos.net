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
          {/* Cellular — Apple SF style: 4 rounded bars increasing height */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill={iconColor}>
            <rect x="0"  y="9"   width="3" height="3"  rx="1"/>
            <rect x="4.5" y="6"  width="3" height="6"  rx="1"/>
            <rect x="9"  y="3.5" width="3" height="8.5" rx="1"/>
            <rect x="13.5" y="0" width="3" height="12" rx="1"/>
          </svg>

          {/* WiFi — Apple style: 3 arcs + filled dot */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="11" r="1.5" fill={iconColor}/>
            <path d="M4.2 7.8a5.5 5.5 0 0 1 7.6 0" stroke={iconColor} strokeWidth="1.6"/>
            <path d="M1 4.6a10 10 0 0 1 14 0" stroke={iconColor} strokeWidth="1.6"/>
          </svg>

          {/* Battery — Apple style: rounded rect shell + fill + small nub */}
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="0.5" width="20" height="11" rx="3.5" stroke={iconColor} strokeWidth="1" fillOpacity="0"/>
            <rect x="2" y="2" width="14" height="8" rx="2" fill={iconColor}/>
            <path d="M21.5 4 C22.8 4 23.5 4.8 23.5 6 C23.5 7.2 22.8 8 21.5 8" stroke={iconColor} strokeWidth="1.3" strokeLinecap="round"/>
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
