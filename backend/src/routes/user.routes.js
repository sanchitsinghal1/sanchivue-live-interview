// src/routes/user.routes.js
import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadResume,
  listUsers,
  getUserById,
} from '../controllers/user.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validators/auth.validator.js';
import { avatarUpload, resumeUpload } from '../controllers/user.controller.js';

const router = Router();

// All user routes require authentication.
router.use(verifyJWT);

router.get('/me', getProfile);
router.patch('/me', validate(updateProfileSchema), updateProfile);
router.post('/me/avatar', avatarUpload, uploadAvatar);
router.post('/me/resume', resumeUpload, uploadResume);

// Admin-only routes.
router.get('/', authorizeRoles('admin'), listUsers);
router.get('/:id', authorizeRoles('admin'), getUserById);

export default router;
