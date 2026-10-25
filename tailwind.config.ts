import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        cream: '#F5F0E8',
        tiffany: {
          DEFAULT: '#81D8D0',
          dark: '#5FBFB6',
          soft: '#E3F5F3',
        },
        line: '#E4DDD1',
        muted: '#6B6560',
      },
      fontFamily: {
        sans: ['"Montserrat Variable"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.14em',
      },
    },
  },
  plugins: [],
}

export default config
