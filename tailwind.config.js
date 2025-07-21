/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  safelist: [
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0f0f0f',    // Very dark background
          print: '#0f0f0f',      // White background for print
        },
        foreground: {
          DEFAULT: '#dddddd',    // Main text color
          print: '#dddddd',      // Black text for print
        },
        main: {
          DEFAULT: '#c54c21',    // Main color
          print: '#c54c21',      // Black for print
        },
        card: {
          DEFAULT: '#1a1a1a',    // Card background
          print: '#1a1a1a',      // White for print
        },
        border: {
          DEFAULT: '#555555',    // Subtle border
          print: '#555555',      // Black for print
        },
        muted: {
          DEFAULT: '#999999',    // For secondary/inactive text
          print: '#999999',      // Dark gray for print
        },
      },
      fontFamily: {
        title: ['title', 'ui-serif', 'system-ui'],
        main: ['main', 'ui-sans-serif', 'system-ui'],
        heading: ['heading', 'ui-sans-serif', 'system-ui'],
        stat: ['stat', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
