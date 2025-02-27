module.exports = {
    content: [
        './index.html',
        './standalone.html',
        './src/*.js',
        './src/*.ts',
        './src/*.js',
    ],
    theme: {
        extend: {
            fontSize: {
                xs: ['12px', '16px'],
                sm: ['14px', '20px'],
                base: ['16px', '24px'],
                '4xl': ['36px', '40px'],
            },
        },
    },
    daisyui: {
        themes: [
            {
                mytheme: {
                    primary: '#007BC0',
                    secondary: '#9DC9FF',
                    accent: '#9E2896',
                    neutral: '#181a2a',
                    'base-100': '#ffffff',
                    info: '#007BC0',
                    success: '#00884A',
                    warning: '#FFCF00',
                    error: '#ED0007',
                },
            },
        ],
    },
    variants: {
        extend: {},
    },
    plugins: [require('daisyui'), require('@tailwindcss/typography')],
    darkMode: 'light',
}
