// Shared Clerk appearance matching the SwipePhotos theme (dark + blue)
export const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#111111',
    colorText: '#ffffff',
    colorTextSecondary: '#a1a1aa',
    colorInputBackground: 'rgba(255,255,255,0.04)',
    colorInputText: '#ffffff',
    colorNeutral: '#ffffff',
    colorDanger: '#ef4444',
    colorSuccess: '#22c55e',
    borderRadius: '0.9rem',
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  elements: {
    card: 'border border-white/10 shadow-2xl shadow-black/60',
    formButtonPrimary: 'font-semibold',
    footerActionLink: 'text-blue-400 hover:text-blue-300',
  },
} as const
