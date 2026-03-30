import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-instrument)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        brand: {
          blue:    '#3b82f6',
          'blue-dim': '#1d4ed8',
          'blue-glow': 'rgba(59,130,246,0.15)',
          'blue-subtle': 'rgba(59,130,246,0.08)',
        },
        bg: {
          0: '#09090f',
          1: '#0f0f1a',
          2: '#141425',
          3: '#1a1a2e',
        },
        surface: {
          border:  'rgba(148,163,184,0.08)',
          border2: 'rgba(148,163,184,0.15)',
        },
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(-6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease forwards',
        pulse2: 'pulse2 2s infinite',
      },
    },
  },
  plugins: [],
}
export default config
