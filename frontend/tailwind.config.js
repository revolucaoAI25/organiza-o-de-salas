/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        grade1: { light: '#dbeafe', dark: '#1e40af', badge: '#3b82f6' },
        grade2: { light: '#dcfce7', dark: '#166534', badge: '#22c55e' },
        grade3: { light: '#ffedd5', dark: '#9a3412', badge: '#f97316' },
      },
    },
  },
  plugins: [],
};
