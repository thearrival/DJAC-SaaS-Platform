/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './client/src/**/*.{js,ts,jsx,tsx}',
        './client/public/index.html',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#2563eb', // blue-600
                    light: '#3b82f6',   // blue-500
                    dark: '#1e40af',    // blue-800
                },
                accent: {
                    DEFAULT: '#f59e42', // orange-400
                },
                slate: require('tailwindcss/colors').slate,
                zinc: require('tailwindcss/colors').zinc,
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui'],
                heading: ['Inter', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
        require('tailwindcss-animate'),
    ],
};
