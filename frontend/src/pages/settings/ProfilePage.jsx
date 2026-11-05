import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, Upload, KeyRound, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import PasswordInput from '../../components/forms/PasswordInput.jsx';
import FileUpload from '../../components/forms/FileUpload.jsx';
import { profileSchema, changePasswordSchema } from '../../validations/auth.schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import userApi from '../../api/user.api.js';
import { getInitials, colorFromString } from '../../utils/formatters.js';

export default function ProfilePage() {
  const { user, updateUser, refreshUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [lastAvatarName, setLastAvatarName] = useState('');

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onProfile = async (values) => {
    setSavingProfile(true);
    try {
      const res = await userApi.updateMe(values);
      updateUser(res?.data?.data || values);
      toast.success('Profile updated.');
    } catch {
      // toast handled by interceptor
    } finally {
      setSavingProfile(false);
    }
  };

  const onPassword = async (values) => {
    setSavingPassword(true);
    try {
      const res = await userApi.updateMe({ password: values.newPassword });
      // Some backends may expose a dedicated /change-password endpoint — we
      // prefer PATCH /users/me for simplicity.
      if (res) {
        toast.success('Password changed.');
        passwordForm.reset();
      }
    } catch {
      // toast handled by interceptor
    } finally {
      setSavingPassword(false);
    }
  };

  const onAvatar = async (file) => {
    if (!file) {
      setLastAvatarName('');
      return;
    }
    setLastAvatarName(file.name);
    try {
      await userApi.uploadAvatar(file);
      toast.success('Avatar uploaded.');
      refreshUser();
    } catch {
      // toast handled by interceptor
    }
  };

  const onResume = async (file) => {
    if (!file) return;
    try {
      await userApi.uploadResume(file);
      toast.success('Resume uploaded.');
    } catch {
      // toast handled by interceptor
    }
  };

  const dot = colorFromString(user?.email || 'me');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Profile</h1>
        <p className="text-sm text-slate-500">Update your account info, avatar, and password.</p>
      </div>

      {/* Avatar + identity card */}
      <div className="card flex items-center gap-4 p-5">
        <div
          className={`grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-white ${dot}`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(user?.name || user?.email || '?')
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-100">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          <p className="mt-1 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
            {user?.role}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={profileForm.handleSubmit(onProfile)} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Account details</h2>
        <Input
          label="Full name"
          {...profileForm.register('name')}
          error={profileForm.formState.errors.name?.message}
        />
        <Input label="Email" value={user?.email || ''} disabled hint="Email cannot be changed." />
        <div className="flex justify-end">
          <button type="submit" disabled={savingProfile} className="btn-primary text-sm">
            {savingProfile ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </button>
        </div>
      </form>

      {/* Avatar upload */}
      <div className="card space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <Upload className="h-4 w-4 text-brand-indigo" /> Avatar
        </h2>
        <FileUpload
          accept="image/*"
          onFile={onAvatar}
          hint="PNG, JPG, or GIF — up to 2MB. Cloudinary-backed."
        />
        {lastAvatarName && (
          <p className="text-[10px] text-slate-500">Last uploaded: {lastAvatarName}</p>
        )}
      </div>

      {/* Resume upload */}
      <div className="card space-y-3 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <FileText className="h-4 w-4 text-brand-indigo" /> Resume (candidates)
        </h2>
        <FileUpload accept=".pdf,.doc,.docx" onFile={onResume} hint="PDF / DOC / DOCX." />
      </div>

      {/* Change password */}
      <form
        onSubmit={passwordForm.handleSubmit(onPassword)}
        className="card space-y-4 p-5"
        noValidate
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <KeyRound className="h-4 w-4 text-brand-indigo" /> Change password
        </h2>
        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          {...passwordForm.register('oldPassword')}
          error={passwordForm.formState.errors.oldPassword?.message}
        />
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          hint="8+ chars with a letter and a number."
          {...passwordForm.register('newPassword')}
          error={passwordForm.formState.errors.newPassword?.message}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          {...passwordForm.register('confirmPassword')}
          error={passwordForm.formState.errors.confirmPassword?.message}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={savingPassword} className="btn-primary text-sm">
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Change password
          </button>
        </div>
      </form>
    </div>
  );
}
