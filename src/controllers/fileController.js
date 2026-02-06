const File = require('../models/File');
const { uploadToS3, deleteFromS3, getS3ObjectUrl } = require('../services/s3ServiceV3');

const getFiles = async (req, res, next) => {
  try {
    const { folderId, view = 'home' } = req.query;
    
    let query = { userId: req.userId, isDeleted: false };
    
    switch (view) {
      case 'recent':
        // Files modified in last 30 days, sorted by lastModified
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query.lastModified = { $gte: thirtyDaysAgo };
        break;
      case 'starred':
        query.isStarred = true;
        break;
      case 'trash':
        query = { userId: req.userId, isDeleted: true };
        break;
      default: // 'home'
        if (folderId) {
          query.parentFolderId = folderId;
        } else {
          query.parentFolderId = null;
        }
    }

    console.log('🔍 Querying files with:', query);
    
    let sortOrder = { createdAt: -1 };
    if (view === 'recent') {
      sortOrder = { lastModified: -1 };
    }
    
    const files = await File.find(query).sort(sortOrder);
    
    console.log(`📁 Found ${files.length} files in MongoDB`);

    res.json({
      files: files.map(f => ({
        id: f._id,
        fileName: f.fileName,
        fileType: f.fileType,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        isStarred: f.isStarred,
        isDeleted: f.isDeleted,
        uploadedAt: f.uploadedAt,
        lastModified: f.lastModified,
        deletedAt: f.deletedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

const createFolder = async (req, res, next) => {
  try {
    const { folderName, parentFolderId } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = new File({
      userId: req.userId,
      fileName: folderName.trim(),
      fileType: 'folder',
      parentFolderId: parentFolderId || null
    });

    await folder.save();

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        id: folder._id,
        fileName: folder.fileName,
        fileType: folder.fileType,
        createdAt: folder.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    console.log('📤 Upload request received');
    console.log('File:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'None');
    
    if (!req.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    const { parentFolderId } = req.body;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    // Generate S3 key
    const timestamp = Date.now();
    const s3Key = `${req.userId}/${parentFolderId || 'root'}/${timestamp}-${fileName}`;

    // Upload to S3
    console.log('🚀 Uploading to S3:', s3Key);
    await uploadToS3(req.file.buffer, s3Key, mimeType);
    console.log('✅ S3 Upload successful');

    // Save to database
    console.log('💾 Saving to MongoDB');
    console.log('📋 File Data:', {
      userId: req.userId,
      fileName,
      fileType: 'file',
      mimeType,
      s3Key,
      fileSize,
      parentFolderId: parentFolderId || null
    });

    const file = new File({
      userId: req.userId,
      fileName,
      fileType: 'file',
      mimeType,
      s3Key,
      fileSize,
      parentFolderId: parentFolderId || null
    });

    const savedFile = await file.save();
    console.log('✅ File saved to MongoDB:', savedFile._id);
    console.log('📊 Saved File Object:', JSON.stringify(savedFile, null, 2));

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: savedFile._id,
        fileName: savedFile.fileName,
        fileType: savedFile.fileType,
        fileSize: savedFile.fileSize,
        uploadedAt: savedFile.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      userId: req.userId,
      fileType: 'file'
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get signed URL for S3 object
    const downloadUrl = await getS3ObjectUrl(file.s3Key, 3600);

    console.log('⬇️ Download request for file:', file.fileName);
    console.log('📥 S3 Signed URL generated');

    // Return the file with proper download headers
    res.json({
      downloadUrl,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType
    });
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { permanent = false } = req.query;

    const file = await File.findOne({
      _id: fileId,
      userId: req.userId
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (permanent || file.isDeleted) {
      // Permanent delete
      if (file.fileType === 'file' && file.s3Key) {
        await deleteFromS3(file.s3Key);
      }
      await File.deleteOne({ _id: fileId });
      res.json({ message: 'File permanently deleted' });
    } else {
      // Move to trash
      file.isDeleted = true;
      file.deletedAt = new Date();
      await file.save();
      res.json({ message: 'File moved to trash' });
    }
  } catch (error) {
    next(error);
  }
};

const restoreFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      userId: req.userId,
      isDeleted: true
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found in trash' });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();

    res.json({ message: 'File restored successfully' });
  } catch (error) {
    next(error);
  }
};

const toggleStar = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findOne({
      _id: fileId,
      userId: req.userId,
      isDeleted: false
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    file.isStarred = !file.isStarred;
    file.lastModified = new Date();
    await file.save();

    res.json({ 
      message: file.isStarred ? 'File starred' : 'File unstarred',
      isStarred: file.isStarred
    });
  } catch (error) {
    next(error);
  }
};

const emptyTrash = async (req, res, next) => {
  try {
    const deletedFiles = await File.find({
      userId: req.userId,
      isDeleted: true,
      fileType: 'file'
    });

    // Delete files from S3
    for (let file of deletedFiles) {
      if (file.s3Key) {
        try {
          await deleteFromS3(file.s3Key);
        } catch (error) {
          console.error(`Failed to delete ${file.s3Key} from S3:`, error.message);
        }
      }
    }

    // Delete all trashed items from database
    const result = await File.deleteMany({
      userId: req.userId,
      isDeleted: true
    });

    res.json({ 
      message: 'Trash emptied successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Get all files in folder recursively with path structure
const getAllFilesInFolderWithPath = async (folderId, userId, basePath = '') => {
  const files = await File.find({ parentFolderId: folderId, userId });
  let allFiles = [];

  for (let file of files) {
    if (file.fileType === 'file') {
      allFiles.push({
        ...file.toObject(),
        relativePath: basePath + file.fileName
      });
    } else if (file.fileType === 'folder') {
      // Recursively get files from subfolders
      const nestedFiles = await getAllFilesInFolderWithPath(
        file._id, 
        userId, 
        basePath + file.fileName + '/'
      );
      allFiles = allFiles.concat(nestedFiles);
    }
  }

  return allFiles;
};

// Download folder as ZIP with proper structure
const downloadFolder = async (req, res, next) => {
  try {
    const { folderId } = req.params;
    const archiver = require('archiver');
    const axios = require('axios');

    const folder = await File.findOne({
      _id: folderId,
      userId: req.userId,
      fileType: 'folder'
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    console.log('📦 Creating ZIP for folder:', folder.fileName);

    // Get all files in folder with their relative paths
    const files = await getAllFilesInFolderWithPath(folderId, req.userId);
    console.log(`📁 Found ${files.length} files to ZIP`);

    // Set headers for ZIP download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${folder.fileName}.zip"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create ZIP archive
    const archive = archiver('zip', { 
      zlib: { level: 9 },
      forceLocalTime: true
    });

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('❌ Archive error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP archive' });
      }
    });

    // Handle archive warnings
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️ Archive warning:', err.message);
      } else {
        console.error('❌ Archive warning:', err.message);
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // If folder is empty, add a placeholder file
    if (files.length === 0) {
      console.log('📝 Folder is empty, adding placeholder');
      archive.append('This folder is empty', { name: '.empty' });
    }

    // Add each file to ZIP with proper path structure
    let successCount = 0;
    let errorCount = 0;

    for (let file of files) {
      try {
        console.log(`📄 Adding ${file.relativePath} to ZIP`);
        
        // Get signed URL for the file
        const signedUrl = await getS3ObjectUrl(file.s3Key, 3600, false);
        
        // Fetch file from S3 using signed URL
        const response = await axios.get(signedUrl, { 
          responseType: 'stream',
          timeout: 60000,
          maxContentLength: 100 * 1024 * 1024 // 100MB max per file
        });
        
        // Add file to archive with proper path
        archive.append(response.data, { 
          name: file.relativePath,
          date: file.uploadedAt || new Date()
        });
        
        successCount++;
        console.log(`✅ Added ${file.relativePath} (${successCount}/${files.length})`);
        
      } catch (err) {
        errorCount++;
        console.error(`⚠️ Failed to add ${file.relativePath}:`, err.message);
        
        // Add error placeholder file
        archive.append(
          `Error downloading file: ${err.message}\nOriginal file: ${file.fileName}`,
          { name: `ERROR_${file.relativePath}.txt` }
        );
      }
    }

    // Finalize the archive
    console.log(`📦 Finalizing ZIP: ${successCount} files added, ${errorCount} errors`);
    await archive.finalize();
    
    console.log('✅ ZIP download completed successfully');
    
  } catch (error) {
    console.error('❌ Download folder error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to create folder download',
        details: error.message 
      });
    }
  }
};

module.exports = {
  getFiles,
  createFolder,
  uploadFile,
  downloadFile,
  deleteFile,
  downloadFolder,
  restoreFile,
  toggleStar,
  emptyTrash
};
