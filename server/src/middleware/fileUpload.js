const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'escrowly/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `avatar-${req.user._id}-${Date.now()}`
  }
});

const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'escrowly/attachments',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'],
    public_id: (req, file) => {
      const fileName = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `attach-${req.user._id}-${fileName}-${Date.now()}`;
    }
  }
});

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype)) {
    console.warn(`Security Alert: Blocked upload with invalid MIME type: ${file.mimetype} from user: ${req.user?._id}`);
    return cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'), false);
  }

  if (!allowedExtensions.includes(ext)) {
    console.warn(`Security Alert: Blocked upload with invalid extension: ${ext} from user: ${req.user?._id}`);
    return cb(new Error('Invalid file extension.'), false);
  }

  cb(null, true);
};

const uploadSingle = multer({
  storage: profileStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // Reduced to 2MB for avatars
  }
}).single('file');

const uploadMultiple = multer({
  storage: attachmentStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5
  }
}).array('attachments', 5);

const uploadKYC = multer({
  storage: attachmentStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3
  }
}).fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 files' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadKYC,
  handleUploadError
};
