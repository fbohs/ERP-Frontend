// OWASP ASVS v4 — section 2.1 password requirements

export interface PasswordRule {
  readonly id: string
  readonly label: string
  readonly test: (password: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: 'min-length',
    label: 'At least 8 characters',
    test: (p) => p.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter (A–Z)',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter (a–z)',
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: 'number',
    label: 'At least one number (0–9)',
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: 'special',
    label: 'At least one special character (!@#$…)',
    test: (p) => /\p{P}|\p{S}/u.test(p),
  },
]

// OWASP: passwords must not exceed 128 characters (silent upper bound)
const MAX_LENGTH = 128

export function validatePassword(password: string): string | null {
  if (password.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters.`
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) return rule.label
  }
  return null
}

export function isPasswordValid(password: string): boolean {
  return password.length <= MAX_LENGTH && PASSWORD_RULES.every((rule) => rule.test(password))
}
