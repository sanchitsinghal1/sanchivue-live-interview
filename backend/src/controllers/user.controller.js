// src/controllers/user.controller.js
// User controller — profile, update profile, avatar upload, resume upload,
// and the admin-only user list.
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { getPagination, paginateQuery } from '../utils/pagination.js';
import {
  UPLOAD_LIMIT_BYTES,
  ALLOWED_MIME_AVATAR,
  ALLOWED_MIME_RESUME,
} from '../config/constants.js';

// Multer disk storage — we write to /public/temp then hand the path to Cloudinary,
// which deletes the temp file after upload (success or failure).
const tempDir = path.resolve(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    // Prefix with timestamp to avoid collisions.
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_AVATAR.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Avatar must be PNG, JPEG, or WebP.'));
    }
    cb(null, true);
  },
}).single('avatar');

export const resumeUpload = multer({
  storage,
  limits: { fileSize: UPLOAD_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_RESUME.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Resume must be a PDF or DOCX file.'));
    }
    cb(null, true);
  },
}).single('resume');

// GET /api/v1/users/me — alias for /auth/me but kept here for symmetry.
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokenHash');
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile'));
});

// PATCH /api/v1/users/me — update profile fields.
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'bio', 'skills', 'preferences'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select(
    '-password -refreshTokenHash',
  );
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

// POST /api/v1/users/me/avatar — multipart upload.
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  const result = await uploadOnCloudinary(req.file.path, 'image');
  if (!result) {
    // Cloudinary not configured — persist nothing but acknowledge the upload.
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { avatarUrl: null },
          'Avatar upload skipped (Cloudinary not configured)',
        ),
      );
  }
  // Delete the previous avatar from Cloudinary to keep storage tidy.
  const user = await User.findById(req.user._id).select('avatarPublicId');
  if (user?.avatarPublicId) await deleteFromCloudinary(user.avatarPublicId, 'image');

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatarUrl: result.url, avatarPublicId: result.publicId } },
    { new: true },
  ).select('-password -refreshTokenHash');
  return res
    .status(200)
    .json(new ApiResponse(200, { user: updated, avatarUrl: result.url }, 'Avatar updated'));
});

// POST /api/v1/users/me/resume — multipart upload.
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  const result = await uploadOnCloudinary(req.file.path, 'raw');
  if (!result) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { resumeUrl: null },
          'Resume upload skipped (Cloudinary not configured)',
        ),
      );
  }
  const user = await User.findById(req.user._id).select('resumePublicId');
  if (user?.resumePublicId) await deleteFromCloudinary(user.resumePublicId, 'raw');

  const updated = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { resumeUrl: result.url, resumePublicId: result.publicId } },
    { new: true },
  ).select('-password -refreshTokenHash');
  return res
    .status(200)
    .json(new ApiResponse(200, { user: updated, resumeUrl: result.url }, 'Resume uploaded'));
});

// GET /api/v1/users — admin only, paginated list.
export const listUsers = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };
  const result = await paginateQuery(User, filter, pagination);
  return res.status(200).json(new ApiResponse(200, result, 'Users'));
});

// GET /api/v1/users/:id — admin only, single user lookup.
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshTokenHash');
  if (!user) throw new ApiError(404, 'User not found.');
  return res.status(200).json(new ApiResponse(200, { user }, 'User'));
});
