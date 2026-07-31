/** @type {import('tailwindcss').Config} */
// Tailwind is kept only for layout utilities (flex, inset-0, w-full …).
// All theming lives in the VHS design system — src/app/vhs.css and its CSS
// custom properties. Don't add a colour scale here; use var(--neon-*).
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Mirrors the --font-* custom props in vhs.css (spec section 21).
        brutal: ['Lilita One', 'cursive', 'sans-serif'],
        osd: ['Share Tech Mono', 'monospace'],
        marker: ['Permanent Marker', 'cursive', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        vhs: {
          bg: '#120826',
          darker: '#080312',
          yellow: '#ffee00',
          'yellow-active': '#d6c700',
          magenta: '#ff0077',
          cyan: '#00f0ff',
          green: '#00ff66',
        },
      },
    },
  },
  plugins: [],
};
