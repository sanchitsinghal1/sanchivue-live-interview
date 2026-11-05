// src/controllers/notification.controller.js
// In-app notifications list / mark-read / preferences.
import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aggregatePaginate } from '../utils/aggregationPagination.js';
import { getPagination } from '../utils/pagination.js';

// GET /api/v1/notifications — paginated list, newest first.
export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req);
  const pipeline = [{ $match: { userId: req.user._id } }, { $sort: { createdAt: -1 } }];
  const result = await aggregatePaginate(Notification, pipeline, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Notifications'));
});

// GET /api/v1/notifications/unread-count
export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, read: false });
  return res.status(200).json(new ApiResponse(200, { count }, 'Unread count'));
});

// POST /api/v1/notifications/:id/read — mark a single notification as read.
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } },
    { new: true },
  );
  if (!notification) throw new ApiError(404, 'Notification not found.');
  return res.status(200).json(new ApiResponse(200, { notification }, 'Marked as read'));
});

// POST /api/v1/notifications/mark-all-read
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  return res.status(200).json(new ApiResponse(200, null, 'All marked as read'));
});

// GET /api/v1/notifications/preferences
export const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences');
  return res
    .status(200)
    .json(new ApiResponse(200, { preferences: user?.preferences || {} }, 'Preferences'));
});

// PATCH /api/v1/notifications/preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const update = {};
  if (typeof req.body.emailNotifications === 'boolean') {
    update['preferences.emailNotifications'] = req.body.emailNotifications;
  }
  if (typeof req.body.pushNotifications === 'boolean') {
    update['preferences.pushNotifications'] = req.body.pushNotifications;
  }
  const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true }).select(
    'preferences',
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { preferences: user?.preferences || {} }, 'Preferences updated'));
});
