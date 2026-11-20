/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        brand: {
          500: '#6366F1',
          600: '#4F46E5',
        },
        aac: {
          kebutuhan: '#F59E0B',
          aksi: '#10B981',
          emosi: '#EC4899',
          sosial: '#3B82F6',
          respon: '#8B5CF6',
        },
      },
      boxShadow: {
        'clay': '0 6px 0 0 rgba(0, 0, 0, 0.08), 0 10px 20px -3px rgba(0, 0, 0, 0.06)',
        'clay-pressed': '0 2px 0 0 rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'clay-float': '0 12px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
