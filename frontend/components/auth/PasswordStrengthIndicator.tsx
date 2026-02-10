"use client";

import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const checks = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "upper",
    label: "Contains uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lower",
    label: "Contains lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "Contains number",
    test: (value: string) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "Contains special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const passedCount = checks.filter((check) => check.test(password)).length;
  const percentage = Math.round((passedCount / checks.length) * 100);

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percentage < 40 && "bg-destructive",
            percentage >= 40 && percentage < 80 && "bg-amber-500",
            percentage >= 80 && "bg-emerald-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className="space-y-1 text-xs">
        {checks.map((check) => {
          const passed = check.test(password);
          return (
            <li
              key={check.id}
              className={cn(
                "transition-colors",
                passed ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {passed ? "✓" : "•"} {check.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
