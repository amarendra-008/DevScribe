/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#00d4ff',
          dim: '#00a8cc',
          bright: '#00ffff',
          glow: 'rgba(0, 212, 255, 0.4)',
        },
        hacker: {
          bg: '#0a0a0a',
          card: '#111111',
          border: '#1a1a1a',
          'border-hover': '#00d4ff',
        },
      },
      fontFamily: {
        mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)',
        'neon-sm': '0 0 5px rgba(0, 212, 255, 0.3)',
        'neon-lg': '0 0 15px rgba(0, 212, 255, 0.5), 0 0 30px rgba(0, 212, 255, 0.3)',
        'neon-text': '0 0 10px rgba(0, 212, 255, 0.8)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.5), 0 0 25px rgba(0, 212, 255, 0.3)' },
        },
        'glow': {
          'from': { textShadow: '0 0 5px rgba(0, 212, 255, 0.5)' },
          'to': { textShadow: '0 0 15px rgba(0, 212, 255, 0.8), 0 0 25px rgba(0, 212, 255, 0.5)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
