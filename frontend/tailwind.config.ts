import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#1E88E5', // Main blue from logo
          600: '#1976d2',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#0a3d91',
        },
        secondary: {
          50: '#f3e5f5',
          100: '#e1bee7',
          200: '#ce93d8',
          300: '#ba68c8',
          400: '#ab47bc',
          500: '#7E57C2', // Purple from logo
          600: '#7b1fa2',
          700: '#6a1b9a',
          800: '#4a148c',
          900: '#38006b',
        },
        accent: {
          50: '#e1f5fe',
          100: '#b3e5fc',
          200: '#81d4fa',
          300: '#4fc3f7',
          400: '#29B6F6', // Cyan from logo
          500: '#03a9f4',
          600: '#039be5',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
        },
        success: {
          50: '#f0fdf4',
          500: '#4CAF50', // Green from logo checkmark
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#FF9800', // Orange accent from logo
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
}
export default config
