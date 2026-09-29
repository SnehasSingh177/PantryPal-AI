/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Kawaii Pantry + Pinterest Aesthetic Official Palette
        kawaii: {
          cream: '#FFF9EF',       // Warm cream background
          sage: '#A8BEA0',        // Pinterest Sage green
          forest: '#315C45',      // Deep organic forest green
          peach: '#F3C7AE',       // Soft peach
          butter: '#F4D98A',      // Butter yellow
          pink: '#F3D9DC',        // Soft pink
          terracotta: '#D97B5B',  // Warm playful terracotta
          mint: '#DCEBDD',        // Soft mint pastel
          lavender: '#E8DFF5',    // Soft pastel lavender
          espresso: '#1E2E24',    // High-contrast soft dark organic text
          latte: '#F7F1E5',       // Cream accent surface
          border: '#EADDC7',      // Soft organic border
          borderLight: '#F3E9D9', // Subtle card outline
          muted: '#66736A',       // Clearly readable gray-green secondary text (WCAG AA)
          charcoal: '#343A35',    // High-contrast dark charcoal body & description text
          subtext: '#526056',     // Deep readable sage for supporting information
        },
        // Direct Pinterest palette tokens for easy class usage (e.g. bg-sage, text-forest, etc.)
        sage: '#A8BEA0',
        peach: '#F3C7AE',
        pink: '#F3D9DC',
        butter: '#F4D98A',
        terracotta: '#D97B5B',
        // Backward compatibility mappings with Kawaii + Modern Organic refinement
        pantry: {
          50: '#F5FAF5',
          100: '#DCEBDD', // Soft mint
          200: '#C2DEC5',
          300: '#9EC8A3',
          400: '#A8BEA0', // Sage green
          500: '#3D7355',
          600: '#315C45', // Forest green
          700: '#264936',
          800: '#1D382A',
          900: '#14271D',
          emerald: '#315C45',
          forest: '#264936',
          sage: '#A8BEA0',
          cream: '#FFF9EF',
          surface: '#FFF9EF',
          dark: '#1E2E24',
          charcoal: '#2D3E33',
        },
        fresh: '#315C45',
        warning: '#D97B5B',
        expired: '#D9534F',
      },
      fontFamily: {
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'kawaii': '0 4px 0 #244634',
        'kawaii-hover': '0 6px 0 #244634',
        'kawaii-sm': '0 3px 0 #244634',
        'kawaii-terracotta': '0 4px 0 #B55F43',
        'kawaii-terracotta-hover': '0 6px 0 #B55F43',
        'kawaii-mint': '0 4px 0 #B5D0B8',
        'kawaii-butter': '0 4px 0 #D4AD42',
        'kawaii-sage': '0 4px 0 #8FA887',
        'kawaii-peach': '0 4px 0 #DFA587',
        'kawaii-soft': '0 8px 24px -4px rgba(49, 92, 69, 0.08), 0 2px 6px -1px rgba(49, 92, 69, 0.04)',
        'kawaii-card': '0 8px 20px -3px rgba(49, 92, 69, 0.06), 0 2px 6px -1px rgba(49, 92, 69, 0.03)',
        'kawaii-float': '0 16px 32px -4px rgba(49, 92, 69, 0.12)',
        'pinterest-card': '0 10px 25px -4px rgba(49, 92, 69, 0.07), 0 3px 10px -2px rgba(49, 92, 69, 0.03)',
        'pinterest-hover': '0 18px 36px -6px rgba(49, 92, 69, 0.12), 0 6px 14px -3px rgba(49, 92, 69, 0.05)',
        'card': '0 6px 20px -2px rgba(49, 92, 69, 0.06)',
      },
      animation: {
        'kawaii-float': 'kawaiiFloat 5s ease-in-out infinite',
        'kawaii-float-slow': 'kawaiiFloat 7s ease-in-out infinite',
        'kawaii-float-reverse': 'kawaiiFloatReverse 6s ease-in-out infinite',
        'kawaii-sway': 'kawaiiSway 4s ease-in-out infinite',
        'kawaii-pulse-soft': 'kawaiiPulse 3s ease-in-out infinite',
        'kawaii-wiggle': 'kawaiiWiggle 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        kawaiiFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        kawaiiFloatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(10px) rotate(-2deg)' },
        },
        kawaiiSway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        kawaiiPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        kawaiiWiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(-6deg)' },
          '40%': { transform: 'rotate(6deg)' },
          '60%': { transform: 'rotate(-3deg)' },
          '80%': { transform: 'rotate(3deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
