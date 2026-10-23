// src/validators/auth.validator.js
// Zod schemas for auth routes — register, login, change-password, etc.
import { z } from 'zod';
import { USER_ROLE_VALUES } from '../config/constants.js';

export const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(USER_ROLE_VALUES).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8),
  newPassword: z.string().min(6).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(8),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().max(40).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).max(50).optional(),
  preferences: z
    .object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
    })
    .optional(),
});
