const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: [true, 'Please provide file name'],
    trim: true
  },
  fileType: {
    type: String,
    enum: ['file', 'folder'],
    default: 'file'
  },
  mimeType: {
    type: String,
    default: null
  },
  s3Key: {
    type: String,
    unique: true,
    sparse: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for quick user file lookups
fileSchema.index({ userId: 1, parentFolderId: 1 });
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, isStarred: 1 });
fileSchema.index({ userId: 1, isDeleted: 1 });

// Virtual for file extension
fileSchema.virtual('fileExtension').get(function() {
  if (this.fileType === 'folder') return null;
  const parts = this.fileName.split('.');
  return parts.length > 1 ? parts.pop() : null;
});

// Method to get file path
fileSchema.methods.getPath = async function() {
  const path = [this.fileName];
  let current = this;
  
  while (current.parentFolderId) {
    current = await mongoose.model('File').findById(current.parentFolderId);
    if (current) path.unshift(current.fileName);
  }
  
  return '/' + path.join('/');
};

module.exports = mongoose.model('File', fileSchema);
