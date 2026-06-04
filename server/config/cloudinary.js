/**
 * config/cloudinary.js
 * Cloudinary SDK configuration.
 * Call configureCloudinary() once at startup.
 */

const cloudinary = require('cloudinary').v2;

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  console.log(`✅  Cloudinary configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`);
}

module.exports = { cloudinary, configureCloudinary };
