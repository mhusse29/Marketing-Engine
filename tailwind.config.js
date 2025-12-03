/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color tokens from CSS variables
        'navy-base': 'var(--color-navy-base)',
        'surface-border': 'var(--color-surface-border)',
        'text-label': 'var(--color-text-label)',
        'text-body': 'var(--color-text-body)',
        'text-heading': 'var(--color-text-heading)',
        'accent-blue-start': 'var(--color-accent-blue-start)',
        'accent-blue-end': 'var(--color-accent-blue-end)',
        'surface-subtle': 'var(--color-surface-subtle)',
        'input-bg': 'var(--color-input-bg)',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(to bottom, rgba(16,22,30,.55), rgba(10,14,20,.55))',
        'accent-gradient': 'linear-gradient(135deg, var(--color-accent-blue-start), var(--color-accent-blue-end))',
        'button-primary': 'linear-gradient(180deg, #0D1C2A, #152A43)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 280ms ease-out',
        'slide-up': 'slide-up 280ms ease-out',
        'scale-press': 'scale-press 90ms ease-out',
        'accordion-down': 'accordion-down 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
        'accordion-up': 'accordion-up 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
        'first': 'moveVertical 30s ease infinite',
        'second': 'moveInCircle 20s reverse infinite',
        'third': 'moveInCircle 40s linear infinite',
        'fourth': 'moveHorizontal 40s ease infinite',
        'fifth': 'moveInCircle 20s ease infinite',
        'fade-spin': 'fade-spin 1.2s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(62, 139, 255, 0.3), 0 0 40px rgba(62, 139, 255, 0.1)' 
          },
          '50%': { 
            boxShadow: '0 0 25px rgba(62, 139, 255, 0.5), 0 0 50px rgba(62, 139, 255, 0.2)' 
          },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        'accordion-down': {
          '0%': { height: '0', opacity: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
        },
        'accordion-up': {
          '0%': { height: 'var(--radix-accordion-content-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        'moveHorizontal': {
          '0%': { transform: 'translateX(-50%) translateY(-10%)' },
          '50%': { transform: 'translateX(50%) translateY(10%)' },
          '100%': { transform: 'translateX(-50%) translateY(-10%)' },
        },
        'moveInCircle': {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'moveVertical': {
          '0%': { transform: 'translateY(-50%)' },
          '50%': { transform: 'translateY(50%)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
