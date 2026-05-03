/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Midnight Enchantment palette
        cosmic: {
          900: '#0D0B1A',
          800: '#1A1535',
          700: '#251F4A',
          600: '#312960',
        },
        magic: {
          500: '#8B5CF6',
          400: '#A78BFA',
          300: '#C084FC',
          200: '#DDD6FE',
        },
        spark: {
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
        },
        shimmer: '#E879F9',
      },
      fontFamily: {
        display: ['Playfair Display', 'Noto Serif SC', 'serif'],
        body: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-slower': 'float 10s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-15px) rotate(2deg)' },
          '66%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)', filter: 'blur(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-magic': 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
      },
      boxShadow: {
        'magic-sm': '0 0 20px rgba(139, 92, 246, 0.2)',
        'magic-md': '0 0 40px rgba(139, 92, 246, 0.3)',
        'magic-lg': '0 0 80px rgba(139, 92, 246, 0.4)',
        'glow': '0 8px 32px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
