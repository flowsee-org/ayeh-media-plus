import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Only media the platform actually renders. SVG is deliberately excluded:
// it can carry scripts and would be served inline from /uploads.
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif',
  '.mp3', '.wav', '.m4a', '.ogg', '.opus', '.aac', '.flac',
  '.mp4', '.webm', '.mov', '.m4v',
  '.pdf', '.txt',
]);

const ALLOWED_MIME =
  /^(image\/(jpeg|png|webp|gif|avif)|audio\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+|application\/pdf|text\/plain)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024, files: 1 }, // 100MB limit for video/audio
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME.test(file.mimetype)) {
      return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
  },
});

const router = Router();

// Endpoint for file upload. Requires a signed-in user so anonymous callers
// cannot use the server as a public file host.
router.post('/upload', authenticate({ required: true }), (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File is too large (max 100MB)'
          : err.message || 'Upload failed';
      return res.status(400).json({ message });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    file_url: fileUrl,
    filename: req.file.filename,
    original_name: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

export default router;
