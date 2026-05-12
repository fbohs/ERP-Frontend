export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  return null
}

export function validateName(name: string): string | null {
  if (name.trim().length < 2) return 'Name must be at least 2 characters.'
  if (name.trim().length > 100) return 'Name must be at most 100 characters.'
  return null
}

export function validatePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number (7–15 digits).'
  return null
}
