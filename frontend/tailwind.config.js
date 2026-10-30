/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0D14',
        sidebar: '#0C101A',
        surface: '#111622',
        elevated: '#161D2D',
        subtle: '#1E2638',
        line: '#1E2638',
        panel: '#111622',
        // Primary brand palette: Refined Sapphire / Classic Cobalt (Non-neon)
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          dark: '#1D4ED8',
          subtle: 'rgba(59, 130, 246, 0.08)',
        },
        // Legacy aliases gracefully mapped to calm clinical palette
        teal: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          dark: '#1D4ED8',
          subtle: 'rgba(59, 130, 246, 0.08)',
        },
        mint: '#3B82F6',
        textMain: '#F1F5F9',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        muted: '#94A3B8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
