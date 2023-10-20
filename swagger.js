const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Versi OpenAPI yang digunakan
    info: {
      title: 'movies',
      version: '1.0.0',
      description: 'movie, user',
    },
  },
  apis: ['app.js'], // Ganti dengan file yang berisi endpoint API Anda
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
