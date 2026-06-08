import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Cloudinary credentials configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Configure multer to store files in memory as buffer
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Only accept common image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

/**
 * Uploads a file buffer directly to Cloudinary folder.
 * Returns the secure URL of the uploaded resource.
 */
export function uploadToCloudinary(fileBuffer: Buffer, folder = 'golf_charity_winners'): Promise<string> {
  return new Promise((resolve, reject) => {
    // Handle cases where Cloudinary is not configured yet (for local fallback)
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.warn('Cloudinary environment variables not set. Mocking image upload...');
      return resolve('https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=600');
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result?.secure_url || '');
      }
    );
    uploadStream.end(fileBuffer);
  });
}
