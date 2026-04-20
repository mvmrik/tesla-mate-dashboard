/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0f0f13',
        surface:  '#1a1a24',
        border:   '#2d2d3d',
        muted:    '#1e293b',
        accent:   '#00bcd4',
        dim:      '#64748b',
        faint:    '#9ca3af',
        hi:       '#38bdf8',
        success:  '#22c55e',
        warning:  '#f59e0b',
        danger:   '#ef4444',
        night:    '#60a5fa',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
