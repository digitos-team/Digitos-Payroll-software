const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')

module.exports = {
    css: {
        postcss: {
            plugins: [tailwindcss(), autoprefixer()]
        }
    }
}
