// Shared Clerk appearance matching the SwipePhotos theme (dark + blue).
// NOTE: Clerk v7 variable names — colorForeground/colorMutedForeground/
// colorInput/colorInputForeground (the old colorText/colorInputBackground
// keys are silently ignored).
export const clerkAppearance = {
  variables: {
    colorPrimary: '#2563eb',
    colorPrimaryForeground: '#ffffff',
    colorBackground: '#111111',
    colorForeground: '#ffffff',
    colorMutedForeground: '#a1a1aa',
    colorMuted: 'rgba(255,255,255,0.06)',
    colorInput: 'rgba(255,255,255,0.06)',
    colorInputForeground: '#ffffff',
    colorBorder: 'rgba(255,255,255,0.12)',
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
    // White Google button so it stands out on the dark card
    socialButtonsBlockButton:
      '!bg-white hover:!bg-zinc-100 !border-transparent !shadow-sm',
    socialButtonsBlockButtonText: '!text-gray-900 !font-semibold',
  },
} as const

// Override Clerk's default "My Application" wording
export const clerkLocalization = {
  signIn: {
    start: {
      title: 'Sign in to SwipePhotos.net',
      subtitle: 'Welcome back! Sign in to see your photos.',
    },
  },
  signUp: {
    start: {
      title: 'Create your account',
      subtitle: 'Save and receive your AI dating photos.',
    },
  },
} as const
