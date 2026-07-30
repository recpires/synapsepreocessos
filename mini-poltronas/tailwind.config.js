/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#F3EFE6',
        bone2: '#EBE3D3',
        cream: '#FBF8F1',
        ink: '#171310',
        espresso: '#2A211A',
        coffee: '#4A3B2E',
        stone: '#8A7E6F',
        gold: '#B0873A',
        'gold-deep': '#8A6A2C',
        'gold-glow': '#E6CE95',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
