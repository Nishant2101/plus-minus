/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Plus Minus brand palette
        'pm-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          900: '#14532d',
        },
        'pm-gold': {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        'pm-dark': {
          900: '#0a0f1a',
          800: '#0d1526',
          700: '#111d35',
          600: '#162040',
          500: '#1e2d52',
        },
        suits: {
          spades: '#1e293b',
          hearts: '#dc2626',
          diamonds: '#dc2626',
          clubs: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        card: ['Georgia', 'serif'],
      },
      animation: {
        'card-flip': 'cardFlip 0.3s ease-in-out',
        'card-play': 'cardPlay 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        cardPlay: {
          '0%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-40px) scale(1.1)' },
          '100%': { transform: 'translateY(-80px) scale(1)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(34, 197, 94, 0.7)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
