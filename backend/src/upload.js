import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
export const uploadDir = path.resolve(
  backendRoot,
  process.env.UPLOAD_DIR || 'uploads',
);
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) return cb(null, true);
  cb(new Error('Image must be a JPG, PNG or WebP file.'));
}

// Field name agreed with the frontend: "image"
export const uploadImage = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter,
}).single('image');

/** Delete a file inside the uploads dir only. Never throws. */
export async function deleteUploadedFile(imagePath) {
  if (!imagePath) return;
  // imagePath is stored as "/uploads/<file>" — strip the prefix safely.
  const fileName = path.basename(String(imagePath));
  if (!fileName || fileName === '.' || fileName === '..') return;
  const fullPath = path.resolve(uploadDir, fileName);
  // Safety: refuse to delete anything outside the uploads directory.
  if (!fullPath.startsWith(uploadDir + path.sep)) return;
  try {
    await fs.promises.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Could not delete ${fullPath}:`, err.message);
  }
}

export function imagePathFor(file) {
  return `/uploads/${file.filename}`;
}
