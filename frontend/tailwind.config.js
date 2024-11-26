import daisyui from 'daisyui'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        bubbleRise: {
          '0%': { 
            transform: 'translateY(20vh) scale(0.3)',
            opacity: '0'
          },
          '50%': { 
            transform: 'translateY(10vh) scale(1)',
            opacity: '0.5'
          },
          '100%': { 
            transform: 'translateY(-20vh) scale(0.7)',
            opacity: '0'
          },
        }
      },
      animation: {
        'bubble': 'bubbleRise 15s linear infinite'
      }
    }
  },
  plugins: [daisyui],
}