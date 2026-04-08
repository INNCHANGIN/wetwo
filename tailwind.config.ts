import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F06292',
        accent: '#FF6B6B',
        surface: '#F9FAFB',
        border: '#E5E8EB',
        text: '#191F28',
        muted: '#6B7684',
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
