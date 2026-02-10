#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

EXCLUDES=(
  ":(exclude).env.example"
  ":(exclude)backend/.env.example"
  ":(exclude)frontend/.env.example"
  ":(exclude)package-lock.json"
)

PATTERNS=(
  "SG\\.[A-Za-z0-9._-]{20,}"
  "ghp_[A-Za-z0-9]{36}"
  "github_pat_[A-Za-z0-9_]{70,}"
  "AKIA[0-9A-Z]{16}"
  "AIza[0-9A-Za-z_-]{35}"
  "xox[baprs]-[A-Za-z0-9-]{12,}"
  "-----BEGIN (RSA|EC|OPENSSH|DSA|PGP) PRIVATE KEY-----"
)

FOUND=0

for PATTERN in "${PATTERNS[@]}"; do
  MATCHES="$(git grep -nIE -e "$PATTERN" -- . "${EXCLUDES[@]}" || true)"
  if [[ -n "$MATCHES" ]]; then
    if [[ "$FOUND" -eq 0 ]]; then
      echo "Potential secrets detected in tracked files:"
    fi
    FOUND=1
    echo
    echo "Pattern: $PATTERN"
    echo "$MATCHES"
  fi
done

if [[ "$FOUND" -eq 1 ]]; then
  echo
  echo "Secret check failed. Rotate exposed keys immediately and move them to environment variables."
  exit 1
fi

echo "Secret check passed: no obvious secrets found in tracked files."
