/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        ios: {
          bg: {
            light: '#F2F2F7',
            dark: '#000000',
          },
          card: {
            light: '#FFFFFF',
            dark: '#1C1C1E',
          },
          secondaryCard: {
            light: '#F2F2F7',
            dark: '#2C2C2E',
          },
          tertiaryCard: {
            light: '#E5E5EA',
            dark: '#3A3A3C',
          },
          text: {
            light: '#000000',
            dark: '#FFFFFF',
            secondaryLight: '#8E8E93',
            secondaryDark: '#8E8E93',
          },
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          indigo: '#5856D6',
          teal: '#5AC8FA',
          pink: '#FF2D55',
          gray: '#8E8E93',
          gray2: '#AEAEB2',
          gray3: '#C7C7CC',
          gray4: '#D1D1D6',
          gray5: '#E5E5EA',
          gray6: '#F2F2F7',
        }
      },
      borderRadius: {
        'ios': '10px',
        'ios-lg': '14px',
        'ios-xl': '20px',
        'ios-2xl': '28px',
      },
      boxShadow: {
        'ios-card': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'ios-elevated': '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'ios-glow-green': '0 8px 25px rgba(52, 199, 89, 0.3)',
        'ios-glow-red': '0 8px 25px rgba(255, 59, 48, 0.3)',
        'ios-glow-blue': '0 8px 25px rgba(0, 122, 255, 0.35)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
