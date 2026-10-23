// Misc validators that aren't tied to a Zod schema (used directly in forms).
export function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password = '') {
  // ≥ 8 chars, at least one letter and one number — minimum bar.
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

export default { isValidEmail, isStrongPassword, classNames };
