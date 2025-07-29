const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images (jpeg, jpg, png, gif) and videos (mp4, webm, mov) only!'));
  }
};

// Initialize upload
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter
});

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  try {
    // Determine resource type based on file mimetype
    const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: resourceType,
      folder: 'campusfix'
    });

    // Remove file from local storage
    fs.unlinkSync(file.path);

    return {
      type: resourceType,
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    // Remove file from local storage in case of error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

// Delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return { success: true };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary
};