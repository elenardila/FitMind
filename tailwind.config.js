/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html','./src/**/*.{js,jsx}'],
    theme: {
        container: { center: true, padding: '1rem' },
        extend: {
            colors: {
                brand: '#8c52ff',
                surface: { light: '#ffffff', dark: '#0b0b0f' },
                text: { light: '#0e0e12', muted: '#545454' }
            },
            fontFamily: {
                display: ['Montserrat','Inter','system-ui','sans-serif'],
                body: ['Inter','system-ui','sans-serif']
            },
            borderRadius: { xl: '1rem' }
        }
    },
    plugins: [require('@tailwindcss/forms')]
}
