const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Store PDFs directly on Cloudinary WITH proper extensions
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // 1. Remove spaces and grab the original name without the old extension
    const cleanName = file.originalname.split('.')[0].replace(/\s+/g, '-');
    // 2. Generate a random string to prevent overwriting files with the same name
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    
    return {
      folder: 'med-academy/uploads',
      resource_type: 'raw', 
      // 3. FORCE Cloudinary to add .pdf to the final URL
      public_id: `${cleanName}-${uniqueSuffix}.pdf` 
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 }, // 50MB
});

module.exports = upload;