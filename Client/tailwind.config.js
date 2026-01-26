module.exports = {
    darkMode: 'class', // enable class‑based dark mode
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                // optional custom dark palette (can be omitted)
                primary: {
                    light: '#3b82f6', // blue‑500
                    dark: '#2563eb', // blue‑600
                },
            },
        },
    },
    plugins: [],
};
