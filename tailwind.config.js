export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          cream: 'var(--color-cream)',
          accent: 'var(--color-accent)',
          accent2: 'var(--color-accent2)',
          muted: 'var(--color-muted)',
          text: 'var(--color-text)',
          textMuted: 'var(--color-text-muted)',
        }
      },
      fontFamily: { sans: ['"Outfit"', 'sans-serif'] },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      }
    },
  },
  plugins: [],
}
