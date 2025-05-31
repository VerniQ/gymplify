// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'bg-blue-500',
    'hover:bg-blue-600',
    'bg-blue-100',
    'group-hover:bg-blue-200',
    'text-blue-500',
    'focus:ring-blue-400',

    'bg-indigo-500',
    'hover:bg-indigo-600',
    'bg-indigo-100',
    'group-hover:bg-indigo-200',
    'text-indigo-500',
    'focus:ring-indigo-400',

    'bg-purple-500',
    'hover:bg-purple-600',
    'bg-purple-100',
    'group-hover:bg-purple-200',
    'text-purple-500',
    'focus:ring-purple-400',

    'bg-green-500',
    'hover:bg-green-600',
    'bg-green-100',
    'group-hover:bg-green-200',
    'text-green-500',
    'focus:ring-green-400',

    'bg-pink-500',
    'hover:bg-pink-600',
    'bg-pink-100',
    'group-hover:bg-pink-200',
    'text-pink-500',
    'focus:ring-pink-400',

    'bg-teal-500',
    'hover:bg-teal-600',
    'bg-teal-100',
    'group-hover:bg-teal-200',
    'text-teal-500',
    'focus:ring-teal-400',

    'bg-cyan-500',
    'hover:bg-cyan-600',
    'bg-cyan-100',
    'group-hover:bg-cyan-200',
    'text-cyan-500',
    'focus:ring-cyan-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}