const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const {
  getFiles,
  createFolder,
  uploadFile,
  downloadFile,
  deleteFile,
  downloadFolder,
  restoreFile,
  toggleStar,
  emptyTrash,
  renameFile
} = require('../controllers/fileController');

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
});

// Apply auth middleware to all file routes
router.use(auth);

// Custom error handler for Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 1GB limit' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: 'Upload error' });
  }
  next();
};

router.get('/', getFiles);
router.post('/folder', createFolder);
router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    handleMulterError(err, req, res, () => uploadFile(req, res, next));
  });
});
router.get('/:fileId/download', downloadFile);
router.get('/:folderId/download-folder', downloadFolder);
router.delete('/:fileId', deleteFile);
router.patch('/:fileId/restore', restoreFile);
router.patch('/:fileId/star', toggleStar);
router.patch('/:fileId/rename', renameFile);
router.delete('/trash/empty', emptyTrash);

module.exports = router;
