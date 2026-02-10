// Access token is intentionally kept in memory to reduce XSS exfiltration risk.
let authToken: string | null = null;

export function getStoredAuthToken(): string | null {
  return authToken;
}

export function setStoredAuthToken(token: string): void {
  authToken = token;
}

export function clearStoredAuthToken(): void {
  authToken = null;
}
