// src/utils/cloudinary.js
// Thin wrapper around the Cloudinary SDK. If `CLOUDINARY_CLOUD_NAME` is not
// configured, every call gracefully returns null — handlers should treat that
// as "upload disabled, store nothing". We ALWAYS unlink the local temp file.
import fs from 'node:fs';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Configure once at import. If keys are missing the SDK is left inert.
let configured = false;
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

// Upload a local file to Cloudinary. Returns { url, publicId } or null.
export async function uploadOnCloudinary(localPath, resourceType = 'auto') {
  if (!configured || !localPath) {
    if (localPath) safeUnlink(localPath);
    return null;
  }
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      resource_type: resourceType,
      folder: 'sanchivue',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    };
  } catch (err) {
    console.error('[cloudinary] upload failed:', err.message);
    return null;
  } finally {
    // Always clean up the temp file — even on failure — so /tmp doesn't grow.
    safeUnlink(localPath);
  }
}

// Delete a Cloudinary asset by public id. Returns true on success, false otherwise.
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  if (!configured || !publicId) return false;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return true;
  } catch (err) {
    console.error('[cloudinary] delete failed:', err.message);
    return false;
  }
}

function safeUnlink(p) {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // ignore — best effort cleanup
  }
}

export default { uploadOnCloudinary, deleteFromCloudinary };
