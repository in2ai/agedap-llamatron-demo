module.exports = {
  plugins: {
    '@tailwindcss/postcss': {
      config: './tailwind.config.js', // Ruta explícita a tu configuración
    },
    autoprefixer: {},
  },
};
