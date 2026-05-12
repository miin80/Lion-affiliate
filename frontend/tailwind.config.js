/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Cam — màu chủ đạo CTA
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
          },
          // Hồng nhạt — accent KOL/influencer
          pink: {
            50: '#fdf2f8',
            100: '#fce7f3',
            200: '#fbcfe8',
            300: '#f9a8d4',
            400: '#f472b6',
            500: '#ec4899',
            600: '#db2777',
          },
          ink: {
            900: '#0a0a0a',
            800: '#1a1a1a',
            700: '#262626',
            500: '#525252',
            400: '#737373',
            300: '#d4d4d4',
            200: '#e5e5e5',
            100: '#f5f5f5',
            50: '#fafafa',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.10)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.06), 0 24px 48px -24px rgba(249,115,22,0.30)',
        cta: '0 10px 24px -10px rgba(249,115,22,0.55)',
        'cta-pink': '0 10px 24px -10px rgba(236,72,153,0.55)',
        avatar: '0 0 0 4px #ffffff, 0 0 0 6px #f97316',
        soft: '0 2px 12px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl2: '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'slide-up': 'slide-up 0.5s ease-out both',
        shimmer: 'shimmer 1.8s linear infinite',
        'bounce-slow': 'bounce 2.5s infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #f97316 0%, #fb923c 50%, #ec4899 100%)',
        'gradient-soft':
          'linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #fdf2f8 100%)',
        'gradient-dark':
          'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
      },
    },
  },
  plugins: [],
};
