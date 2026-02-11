export interface ApiValidationIssue {
  path: string;
  message: string;
}

export interface ApiErrorPayload {
  error: string;
  message: string;
  details?: ApiValidationIssue[];
}

export interface UserContract {
  id: string;
  email: string;
  email_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequestContract {
  email: string;
  password: string;
}

export interface RegisterRequestContract {
  email: string;
  password: string;
}

export interface ForgotPasswordRequestContract {
  email: string;
}

export interface ResetPasswordRequestContract {
  token: string;
  password: string;
}

export interface UpdateProfileRequestContract {
  email?: string;
}

export interface LoginResponseContract {
  accessToken: string;
  user: UserContract;
}

export interface RegisterResponseContract {
  userId?: string;
  message: string;
}

export interface RefreshResponseContract {
  accessToken: string;
}

export interface MessageResponseContract {
  message: string;
}
