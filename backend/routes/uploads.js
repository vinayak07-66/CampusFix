const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/fileUpload');

// @route   POST api/uploads
// @desc    Upload a file
// @access  Private
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    // Upload file to Cloudinary
    const result = await uploadToCloudinary(req.file);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('File upload error:', err.message);
    res.status(500).json({ msg: 'File upload failed', error: err.message });
  }
});

// @route   POST api/uploads/multiple
// @desc    Upload multiple files
// @access  Private
router.post('/multiple', auth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files uploaded' });
    }

    // Upload files to Cloudinary
    const uploadPromises = req.files.map(file => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Multiple file upload error:', err.message);
    res.status(500).json({ msg: 'File upload failed', error: err.message });
  }
});

// @route   DELETE api/uploads/:publicId
// @desc    Delete a file from Cloudinary
// @access  Private
router.delete('/:publicId', auth, async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    // Delete file from Cloudinary
    await deleteFromCloudinary(publicId, resourceType || 'image');

    res.json({
      success: true,
      msg: 'File deleted successfully'
    });
  } catch (err) {
    console.error('File deletion error:', err.message);
    res.status(500).json({ msg: 'File deletion failed', error: err.message });
  }
});

module.exports = router;