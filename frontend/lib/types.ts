import type {
  ApiErrorPayload,
  ForgotPasswordRequestContract,
  LoginRequestContract,
  LoginResponseContract,
  MessageResponseContract,
  RefreshResponseContract,
  RegisterRequestContract,
  RegisterResponseContract,
  ResetPasswordRequestContract,
  UpdateProfileRequestContract,
  UserContract,
} from "@contracts";

export type User = UserContract;
export type LoginResponse = LoginResponseContract;
export type RegisterResponse = RegisterResponseContract;
export type MessageResponse = MessageResponseContract;
export type RefreshResponse = RefreshResponseContract;
export type LoginCredentials = LoginRequestContract;
export type RegisterCredentials = RegisterRequestContract;
export type ForgotPasswordRequest = ForgotPasswordRequestContract;
export type ResetPasswordRequest = ResetPasswordRequestContract;
export type UpdateProfileRequest = UpdateProfileRequestContract;

/**
 * API error response structure
 */
export interface ApiError {
  message: string;
  error?: ApiErrorPayload["error"];
  details?: Array<{
    path: string;
    message: string;
  }>;
  statusCode?: number;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
}
