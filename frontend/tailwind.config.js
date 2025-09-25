/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Red Hat brand colors
        'red-hat': {
          50: '#ee0000',    // Red Hat Red primary
          100: '#cc0000',   // Darker red
          200: '#aa0000',
          300: '#880000',
          400: '#660000',
          500: '#440000',
          600: '#220000',
        },
        primary: {
          50: '#fef2f2',    // Red-based primary scale
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ee0000',   // Red Hat Red as primary-500
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Red Hat secondary colors
        orange: {
          10: '#fff8f0',
          20: '#fff0e0',
          30: '#ffe8d0',
          40: '#ffd0a0',
          50: '#ffb870',
          60: '#ff9f40',
          70: '#ff8710',
          80: '#e06f00',
        },
        yellow: {
          10: '#fffcf0',
          20: '#fff8e0',
          30: '#fff4d0',
          40: '#ffe8a0',
          50: '#ffdc70',
          60: '#ffd040',
          70: '#ffc410',
          80: '#e0a800',
        },
        teal: {
          10: '#f0fcfc',
          20: '#e0f8f8',
          30: '#d0f4f4',
          40: '#a0e8e8',
          50: '#70dcdc',
          60: '#40d0d0',
          70: '#10c4c4',
          80: '#00a8a8',
        },
        purple: {
          10: '#f8f0fc',
          20: '#f0e0f8',
          30: '#e8d0f4',
          40: '#d0a0e8',
          50: '#b870dc',
          60: '#a040d0',
          70: '#8810c4',
          80: '#7000a8',
        },
        // Gray scale for Red Hat
        gray: {
          5: '#fafafa',
          10: '#f5f5f5',
          20: '#eeeeee',
          30: '#e0e0e0',
          40: '#bdbdbd',
          50: '#9e9e9e',
          60: '#757575',
          70: '#616161',
          80: '#424242',
          90: '#212121',
          95: '#151515',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}