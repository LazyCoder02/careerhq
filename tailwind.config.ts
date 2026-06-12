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
        bg: '#050505',
        bg2: '#0A0909',
        card: '#171515',
        card2: '#1C1A1A',
        border: '#302B2B',
        border2: '#1C1A1A',
        text: '#F7F7F7',
        text2: '#D7D5D5',
        text3: '#6B6868',
        accent: '#E8E0D0',
        amber: '#C9A96E',
        amber2: '#a07840',
        green: '#4a7c59',
        red: '#8a3a3a',
        blue: '#3a5a7c',
      },
      fontFamily: {
        head: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
