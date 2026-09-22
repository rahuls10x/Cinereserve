/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0F17',
          900: '#070A0F',
          800: '#0B0F17',
          700: '#111722',
        },
        slateCard: {
          DEFAULT: '#131B26',
          light: '#1A2433',
          dark: '#0E1520',
        },
        charcoalBorder: {
          DEFAULT: '#1E293B',
          light: '#2E3D52',
          muted: '#182230',
        },
        electricIndigo: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
          glow: 'rgba(99, 102, 241, 0.4)',
        },
        neonCyan: {
          DEFAULT: '#06B6D4',
          hover: '#0891B2',
          glow: 'rgba(6, 182, 212, 0.5)',
        },
        amberHold: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          glow: 'rgba(245, 158, 11, 0.4)',
        },
        emeraldSuccess: {
          DEFAULT: '#10B981',
          hover: '#059669',
          glow: 'rgba(16, 185, 129, 0.4)',
        },
        roseDanger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          glow: 'rgba(239, 68, 68, 0.4)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -2px rgba(6, 182, 212, 0.6), 0 0 6px -1px rgba(6, 182, 212, 0.4)',
        'neon-indigo': '0 0 20px -3px rgba(99, 102, 241, 0.5), 0 0 8px -2px rgba(99, 102, 241, 0.4)',
        'neon-amber': '0 0 15px -2px rgba(245, 158, 11, 0.6), 0 0 6px -1px rgba(245, 158, 11, 0.4)',
        'neon-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.5), 0 0 8px -2px rgba(16, 185, 129, 0.4)',
        'screen-spotlight': '0 25px 50px -12px rgba(6, 182, 212, 0.15)',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        },
        beam: {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
          '100%': { opacity: '0.3' },
        }
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'beam': 'beam 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
