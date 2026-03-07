/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f8f9fa',
          100: '#f0f2f5',
          200: '#e0e6ee',
          300: '#cccccc',
          400: '#6b7280',
          500: '#4b5563',
          600: '#374151',
          700: '#333333',
          800: '#1f2937',
          900: '#111827',
          950: '#0d1117',
        },
        signal: {
          orange: '#F28C28',
          'orange-light': '#f5a04d',
          'orange-dark': '#d97a1a',
          green: '#22c55e',
          amber: '#f59e0b',
          red: '#ef4444',
          blue: '#3b82f6',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
