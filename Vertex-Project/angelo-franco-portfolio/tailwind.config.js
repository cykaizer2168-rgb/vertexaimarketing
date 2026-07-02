/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070B16',
        panel: '#0D1326',
        panel2: '#111A33',
        line: '#1E2A4A',
        cyan: '#3DA9FC',
        amber: '#F2A93B',
        mist: '#8C9AC4',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-glow': 'radial-gradient(circle at 80% 20%, rgba(61,169,252,0.18), transparent 45%), radial-gradient(circle at 10% 80%, rgba(242,169,59,0.12), transparent 40%)',
      },
    },
  },
  plugins: [],
}
