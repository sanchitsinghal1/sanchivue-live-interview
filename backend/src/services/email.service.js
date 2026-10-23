// src/services/email.service.js
// Nodemailer transport. If SMTP_HOST is not configured, every call logs the
// email and returns false so callers can keep operating (e.g. the invitation
// flow creates an Invitation row + returns the magic link as a fallback).
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { APP_NAME } from '../config/constants.js';

let transporter = null;
if (env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for 587 / STARTTLS
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

// Send an email. Returns { ok, messageId } on success, { ok: false, reason } on failure.
export async function sendEmail({ to, subject, html, text }) {
  if (!transporter) {
    // Graceful no-op in dev — just log so the caller can still proceed.
    console.log(`[${APP_NAME}] email.noop → to=${to} subject="${subject}"`);
    if (text) console.log(text.length > 200 ? `${text.slice(0, 200)}…` : text);
    return { ok: false, reason: 'SMTP_NOT_CONFIGURED' };
  }
  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: subject ? `[${APP_NAME}] ${subject}` : APP_NAME,
      html,
      text,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[${APP_NAME}] email.send failed:`, err.message);
    return { ok: false, reason: err.message };
  }
}

// Template helpers — keep the HTML small and uniform across notifications.
export async function sendInvitationEmail({ to, inviteUrl, role, orgName, invitedBy }) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: auto;">
      <h2 style="color: #6366f1;">${APP_NAME} — Invitation</h2>
      <p>You've been invited by <strong>${invitedBy || 'a Sanchivue admin'}</strong> to join
        <strong>${orgName || 'an organization'}</strong> as <strong>${role}</strong>.</p>
      <p><a href="${inviteUrl}" style="background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Accept invitation</a></p>
      <p style="color:#666;font-size:12px;">If the button doesn't work, paste this URL: ${inviteUrl}</p>
    </div>
  `;
  return sendEmail({ to, subject: `Invitation to join ${orgName || APP_NAME}`, html });
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: auto;">
      <h2 style="color: #6366f1;">${APP_NAME} — Password reset</h2>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p><a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset password</a></p>
      <p style="color:#666;font-size:12px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Password reset', html });
}

// Candidate interview invitation — sent by an interviewer from the wizard.
// Falls back to a no-op (returns the link so the wizard can surface a
// mailto: fallback to the user).
export async function sendCandidateInterviewEmail({ to, inviteUrl, interviewTitle, invitedBy }) {
  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: auto;">
      <h2 style="color: #6366f1;">${APP_NAME} — Interview invitation</h2>
      <p>You've been invited by <strong>${invitedBy || 'your interviewer'}</strong> to a live technical interview${
        interviewTitle ? ` — <strong>${interviewTitle}</strong>` : ''
      }.</p>
      <p><a href="${inviteUrl}" style="background:#6366f1;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Join the interview</a></p>
      <p style="color:#666;font-size:12px;">If the button doesn't work, paste this URL into your browser: ${inviteUrl}</p>
      <p style="color:#666;font-size:12px;">This link expires in 7 days.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Interview invitation${interviewTitle ? ` — ${interviewTitle}` : ''}`, html });
}

export default {
  sendEmail,
  sendInvitationEmail,
  sendPasswordResetEmail,
  sendCandidateInterviewEmail,
};
