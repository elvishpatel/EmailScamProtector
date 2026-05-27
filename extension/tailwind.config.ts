import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './popup.html'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Nunito"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['14px', '20px'],
        'sm': ['16px', '24px'],
        'base': ['18px', '28px'],
        'lg': ['20px', '30px'],
        'xl': ['24px', '32px'],
        '2xl': ['28px', '36px'],
        '3xl': ['32px', '40px'],
      },
      colors: {
        safe: {
          DEFAULT: '#22C55E',
          light: '#DCFCE7',
          dark: '#166534',
          50: '#F0FDF4',
        },
        low: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#1E40AF',
          50: '#EFF6FF',
        },
        suspicious: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#92400E',
          50: '#FFFBEB',
        },
        high: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#991B1B',
          50: '#FEF2F2',
        },
        dangerous: {
          DEFAULT: '#DC2626',
          light: '#FECACA',
          dark: '#7F1D1D',
          50: '#FEF2F2',
        },
        surface: {
          DEFAULT: '#FAFBFC',
          dark: '#1A1B2E',
          card: '#FFFFFF',
          'card-dark': '#242540',
          'border': '#E5E7EB',
          'border-dark': '#374151',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          'primary-dark': '#F9FAFB',
          'secondary-dark': '#9CA3AF',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow-safe': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      },
    },
  },
  plugins: [],
};

export default config;
