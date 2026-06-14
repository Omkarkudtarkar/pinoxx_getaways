import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

class CloudinaryStorage {
  _handleFile(_req, file, cb) {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "pinoxx",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          filename: result.public_id,
          path: result.secure_url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format
        });
      }
    );

    file.stream.pipe(upload);
  }

  _removeFile(_req, file, cb) {
    if (!file.publicId) {
      cb(null);
      return;
    }

    cloudinary.uploader.destroy(file.publicId, { resource_type: "image" })
      .then(() => cb(null))
      .catch(cb);
  }
}

const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});
const storage = cloudinaryConfigured ? new CloudinaryStorage() : localStorage;

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image uploads are allowed"));
  }
  cb(null, true);
}

export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 80
  }
});

export function fileToImage(file) {
  return {
    url: file.secureUrl || (file.path?.startsWith("http") ? file.path : `/uploads/${file.filename}`),
    alt: file.originalname
  };
}
