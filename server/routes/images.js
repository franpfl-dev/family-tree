/**
 * routes/images.js
 * POST /api/images/upload
 * Accepts a base64 data URI, uploads it to Cloudinary, returns the URL.
 *
 * Body: { base64: "data:image/jpeg;base64,/9j/4AAQ..." }
 * Response: { success: true, url: "https://res.cloudinary.com/..." }
 */

const express  = require('express');
const router   = express.Router();
const { cloudinary } = require('../config/cloudinary');

router.post('/upload', async (req, res) => {
  const { base64 } = req.body;

  if (!base64) {
    return res.status(400).json({ success: false, message: 'No base64 data provided.' });
  }

  if (!base64.startsWith('data:image/')) {
    return res.status(400).json({ success: false, message: 'Invalid image format. Expected a data:image/* URI.' });
  }

  try {
    const result = await cloudinary.uploader.upload(base64, {
      folder:         'family-tree/profile-photos',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      resource_type: 'image',
    });

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload failed:', err.message);
    // Return a 200 with photoFailed flag so the frontend can handle gracefully
    res.status(207).json({
      success: false,
      photoFailed: true,
      message: 'Image upload failed. Person details can still be saved without a photo.',
      error: err.message,
    });
  }
});

module.exports = router;
