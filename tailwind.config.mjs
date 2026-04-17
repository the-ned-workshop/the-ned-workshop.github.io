/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#fff8ee',
          100: '#ffedce',
          200: '#ffd7b0',
          300: '#ffc193',
          400: '#ffa28b',
          500: '#ff8383',
          600: '#ff5d5d',
          700: '#ff3737',
          800: '#d42a2a',
          900: '#a92323',
          950: '#6a1515',
        },
        stone: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
      },
      fontFamily: {
        sans: ['Baloo 2', 'cursive', 'system-ui', 'sans-serif'],
        display: ['Baloo 2', 'cursive', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
