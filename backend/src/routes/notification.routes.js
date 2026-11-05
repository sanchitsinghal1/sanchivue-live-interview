// src/routes/notification.routes.js
import { Router } from 'express';
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  getPreferences,
  updatePreferences,
} from '../controllers/notification.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

router.get('/', listNotifications);
router.get('/unread-count', unreadCount);
router.post('/mark-all-read', markAllRead);
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.post('/:id/read', markRead);

export default router;
