import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PASSWORD_RULES } from '@/utils/password'

interface PasswordStrengthProps {
  readonly password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <li
            key={rule.id}
            className={cn(
              'flex items-center gap-2 text-xs transition-colors',
              passed ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {passed ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
