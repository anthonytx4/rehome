import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import { sanitizeFilename } from '../utils/marketplaceSafety.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local development storage
const storage = multer.memoryStorage(); // Use memory for dev before uploading if needed

const fileFilter = (req, file, cb) => {
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime'];
  
  if (allowedImages.includes(file.mimetype) || allowedVideos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images and videos (mp4, webm, mov) are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Helper for Vercel Blob vs Local
export const handleUpload = async (file, folder = 'listings') => {
  const safeFilename = sanitizeFilename(file?.originalname || 'upload');

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Production: Vercel Blob
    const { url } = await put(`${folder}/${Date.now()}-${safeFilename}`, file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return url;
  } else {
    // Local: Save to disk
    const uploadPath = path.join(__dirname, '..', 'uploads', folder);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    
    const filename = `${Date.now()}-${safeFilename}`;
    fs.writeFileSync(path.join(uploadPath, filename), file.buffer);
    return `/uploads/${folder}/${filename}`;
  }
};
