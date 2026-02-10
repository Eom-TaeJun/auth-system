# Auth System - 상세 구현 계획

**프로젝트:** `/home/tj/projects/auth-system/`
**최종 업데이트:** 2026-02-10

---

## 📊 현재 상태

### ✅ 완료됨
- Phase 0: 프로젝트 구조 (커밋: 9b89dff)
- Phase 1: 데이터베이스 설정 (커밋: af42074)
- Phase 4: 프론트엔드 기초 (커밋: af42074)

### 📝 해야 할 일
- Phase 2: Core Services (백엔드)
- Phase 3: API Routes (백엔드)
- Phase 5: Auth Forms (프론트엔드)
- Phase 6: Protected Routes (프론트엔드)
- Phase 7: Backend Testing
- Phase 8: Frontend Testing
- Phase 9: Security Audit
- Phase 10: Documentation
- Phase 11: Final Integration

---

## Phase 2: Core Services (백엔드)

**디렉토리:** `backend/src/`
**예상 시간:** 2-3시간

### 파일 목록

#### 1. `utils/password.ts`
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * 비밀번호를 bcrypt로 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호와 해시 비교
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 비밀번호 강도 검증
 * - 최소 8자
 * - 대문자 1개 이상
 * - 소문자 1개 이상
 * - 숫자 1개 이상
 * - 특수문자 1개 이상
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### 2. `services/tokenService.ts`
```typescript
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { config } from '../config/env';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

interface TokenPayload {
  userId: string;
}

/**
 * JWT Access Token 생성 (15분 유효)
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { userId } as TokenPayload,
    config.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Refresh Token 생성
 * 랜덤 32바이트 토큰 + bcrypt 해시 반환
 */
export async function generateRefreshToken(userId: string): Promise<{
  token: string;
  hash: string;
  expiresAt: Date;
}> {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(token, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  return { token, hash, expiresAt };
}

/**
 * Access Token 검증 및 파싱
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 이메일 검증용 토큰 생성 (랜덤 32바이트)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Refresh Token 검증 (해시 비교)
 */
export async function verifyRefreshToken(
  token: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(token, hash);
}
```

#### 3. `services/emailService.ts`
```typescript
import { config } from '../config/env';

/**
 * 이메일 검증 메일 발송 (현재는 콘솔 로그)
 * TODO: SendGrid 연동
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${config.FRONTEND_URL}/verify-email?token=${token}`;

  console.log('===== EMAIL: Verification =====');
  console.log(`To: ${email}`);
  console.log(`Subject: Verify your email`);
  console.log(`Link: ${verificationUrl}`);
  console.log('================================');

  // TODO: Implement SendGrid
  // await sgMail.send({
  //   to: email,
  //   from: config.FROM_EMAIL,
  //   subject: 'Verify your email',
  //   html: `<a href="${verificationUrl}">Click here to verify</a>`
  // });
}

/**
 * 비밀번호 재설정 메일 발송
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${token}`;

  console.log('===== EMAIL: Password Reset =====');
  console.log(`To: ${email}`);
  console.log(`Subject: Reset your password`);
  console.log(`Link: ${resetUrl}`);
  console.log('==================================');

  // TODO: Implement SendGrid
}
```

#### 4. `utils/validators.ts`
```typescript
/**
 * 이메일 형식 검증 (RFC 5322)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 비밀번호 검증 (password.ts의 validatePasswordStrength와 동일)
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character');
  }

  return { valid: errors.length === 0, errors };
}
```

#### 5. `utils/errors.ts`
```typescript
/**
 * 커스텀 인증 에러
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// 에러 코드 상수
export const ErrorCodes = {
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
} as const;
```

#### 6. `services/authService.ts`
```typescript
import * as User from '../models/User';
import * as VerificationToken from '../models/VerificationToken';
import * as RefreshToken from '../models/RefreshToken';
import * as passwordUtils from '../utils/password';
import * as tokenService from './tokenService';
import * as emailService from './emailService';
import * as validators from '../utils/validators';
import { AuthError, ErrorCodes } from '../utils/errors';

interface RegisterData {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    email_verified: boolean;
  };
}

/**
 * 회원가입
 */
export async function register(data: RegisterData): Promise<{
  userId: string;
  message: string;
}> {
  const { email, password } = data;

  // 1. 이메일 검증
  if (!validators.validateEmail(email)) {
    throw new AuthError('Invalid email address', ErrorCodes.INVALID_CREDENTIALS);
  }

  // 2. 비밀번호 강도 검증
  const passwordCheck = validators.validatePassword(password);
  if (!passwordCheck.valid) {
    throw new AuthError(
      passwordCheck.errors.join(', '),
      ErrorCodes.INVALID_CREDENTIALS
    );
  }

  // 3. 이메일 중복 확인
  const exists = await User.existsByEmail(email);
  if (exists) {
    throw new AuthError('Email already exists', ErrorCodes.EMAIL_EXISTS);
  }

  // 4. 비밀번호 해싱
  const password_hash = await passwordUtils.hashPassword(password);

  // 5. 사용자 생성
  const user = await User.create({ email, password_hash });

  // 6. 검증 토큰 생성 (24시간 유효)
  const token = tokenService.generateVerificationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await VerificationToken.create({
    user_id: user.id,
    token,
    token_type: 'email_verify',
    expires_at: expiresAt,
  });

  // 7. 검증 이메일 발송
  await emailService.sendVerificationEmail(email, token);

  return {
    userId: user.id,
    message: 'Registration successful. Please check your email to verify.',
  };
}

/**
 * 로그인
 */
export async function login(data: LoginData): Promise<LoginResult> {
  const { email, password } = data;

  // 1. 사용자 찾기
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AuthError('Invalid credentials', ErrorCodes.INVALID_CREDENTIALS, 401);
  }

  // 2. 비밀번호 확인
  const valid = await passwordUtils.comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AuthError('Invalid credentials', ErrorCodes.INVALID_CREDENTIALS, 401);
  }

  // 3. 이메일 검증 확인 (선택사항 - 주석 처리 가능)
  // if (!user.email_verified) {
  //   throw new AuthError('Email not verified', ErrorCodes.EMAIL_NOT_VERIFIED, 403);
  // }

  // 4. Access Token 생성
  const accessToken = tokenService.generateAccessToken(user.id);

  // 5. Refresh Token 생성
  const refreshTokenData = await tokenService.generateRefreshToken(user.id);

  // 6. Refresh Token DB 저장
  await RefreshToken.create({
    user_id: user.id,
    token_hash: refreshTokenData.hash,
    expires_at: refreshTokenData.expiresAt,
    device_info: null, // TODO: Extract from request headers
  });

  return {
    accessToken,
    refreshToken: refreshTokenData.token,
    user: {
      id: user.id,
      email: user.email,
      email_verified: user.email_verified,
    },
  };
}

/**
 * Access Token 갱신
 */
export async function refresh(refreshToken: string): Promise<{
  accessToken: string;
}> {
  // 1. Refresh Token 검증
  const tokenRecord = await RefreshToken.findValidToken(refreshToken);
  if (!tokenRecord) {
    throw new AuthError('Invalid refresh token', ErrorCodes.INVALID_TOKEN, 401);
  }

  // 2. 토큰 해시 비교
  const valid = await tokenService.verifyRefreshToken(
    refreshToken,
    tokenRecord.token_hash
  );
  if (!valid) {
    throw new AuthError('Invalid refresh token', ErrorCodes.INVALID_TOKEN, 401);
  }

  // 3. 새 Access Token 생성
  const accessToken = tokenService.generateAccessToken(tokenRecord.user_id);

  return { accessToken };
}

/**
 * 이메일 검증
 */
export async function verifyEmail(token: string): Promise<void> {
  // 1. 토큰 찾기
  const tokenRecord = await VerificationToken.findValidToken(
    token,
    'email_verify'
  );
  if (!tokenRecord) {
    throw new AuthError('Invalid or expired token', ErrorCodes.INVALID_TOKEN);
  }

  // 2. 사용자 이메일 검증 처리
  await User.update(tokenRecord.user_id, { email_verified: true });

  // 3. 토큰 사용 처리
  await VerificationToken.markAsUsed(tokenRecord.id);

  // 4. 토큰 삭제 (선택)
  await VerificationToken.deleteToken(tokenRecord.id);
}

/**
 * 비밀번호 재설정 요청
 */
export async function requestPasswordReset(email: string): Promise<void> {
  // 1. 사용자 찾기
  const user = await User.findByEmail(email);
  if (!user) {
    // 보안: 사용자가 없어도 성공 메시지 (이메일 유출 방지)
    return;
  }

  // 2. 기존 리셋 토큰 삭제 (중복 방지)
  // TODO: VerificationToken.deleteByUserIdAndType(user.id, 'password_reset');

  // 3. 리셋 토큰 생성 (1시간 유효)
  const token = tokenService.generateVerificationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await VerificationToken.create({
    user_id: user.id,
    token,
    token_type: 'password_reset',
    expires_at: expiresAt,
  });

  // 4. 리셋 이메일 발송
  await emailService.sendPasswordResetEmail(email, token);
}

/**
 * 비밀번호 재설정
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  // 1. 토큰 검증
  const tokenRecord = await VerificationToken.findValidToken(
    token,
    'password_reset'
  );
  if (!tokenRecord) {
    throw new AuthError('Invalid or expired token', ErrorCodes.INVALID_TOKEN);
  }

  // 2. 비밀번호 강도 검증
  const passwordCheck = validators.validatePassword(newPassword);
  if (!passwordCheck.valid) {
    throw new AuthError(
      passwordCheck.errors.join(', '),
      ErrorCodes.INVALID_CREDENTIALS
    );
  }

  // 3. 비밀번호 해싱
  const password_hash = await passwordUtils.hashPassword(newPassword);

  // 4. 비밀번호 업데이트
  await User.update(tokenRecord.user_id, { password_hash });

  // 5. 토큰 사용 처리
  await VerificationToken.markAsUsed(tokenRecord.id);
  await VerificationToken.deleteToken(tokenRecord.id);

  // 6. 모든 Refresh Token 무효화 (보안)
  await RefreshToken.revokeAllForUser(tokenRecord.user_id);
}

/**
 * 로그아웃
 */
export async function logout(refreshToken: string): Promise<void> {
  // Refresh Token 무효화
  await RefreshToken.revokeToken(refreshToken);
}
```

### 테스트 파일

#### `tests/unit/password.test.ts`
```typescript
import { hashPassword, comparePassword, validatePasswordStrength } from '../../src/utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash password', async () => {
      const hash = await hashPassword('Test123!');
      expect(hash).toBeTruthy();
      expect(hash).not.toBe('Test123!');
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const hash = await hashPassword('Test123!');
      const result = await comparePassword('Test123!', hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await hashPassword('Test123!');
      const result = await comparePassword('Wrong123!', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('Test123!@#');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Test1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('test123!@#');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain uppercase letter');
    });
  });
});
```

#### `tests/unit/tokenService.test.ts`
```typescript
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateVerificationToken
} from '../../src/services/tokenService';

describe('Token Service', () => {
  const userId = 'test-user-id';

  describe('Access Token', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(userId);
      expect(token).toBeTruthy();

      const payload = verifyAccessToken(token);
      expect(payload).toBeTruthy();
      expect(payload?.userId).toBe(userId);
    });

    it('should reject invalid token', () => {
      const payload = verifyAccessToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('Refresh Token', () => {
    it('should generate refresh token with hash', async () => {
      const result = await generateRefreshToken(userId);
      expect(result.token).toBeTruthy();
      expect(result.hash).toBeTruthy();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should verify refresh token', async () => {
      const { token, hash } = await generateRefreshToken(userId);
      const valid = await verifyRefreshToken(token, hash);
      expect(valid).toBe(true);
    });

    it('should reject wrong token', async () => {
      const { hash } = await generateRefreshToken(userId);
      const valid = await verifyRefreshToken('wrong-token', hash);
      expect(valid).toBe(false);
    });
  });

  describe('Verification Token', () => {
    it('should generate random hex token', () => {
      const token = generateVerificationToken();
      expect(token).toBeTruthy();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateVerificationToken();
      const token2 = generateVerificationToken();
      expect(token1).not.toBe(token2);
    });
  });
});
```

#### `tests/unit/validators.test.ts`
```typescript
import { validateEmail, validatePassword } from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('no@domain')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong password', () => {
      const result = validatePassword('Test123!@#');
      expect(result.valid).toBe(true);
    });

    it('should list all errors', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

#### `tests/unit/authService.test.ts`
```typescript
import * as authService from '../../src/services/authService';
import * as User from '../../src/models/User';
import * as VerificationToken from '../../src/models/VerificationToken';
import * as RefreshToken from '../../src/models/RefreshToken';

// Mock all database models
jest.mock('../../src/models/User');
jest.mock('../../src/models/VerificationToken');
jest.mock('../../src/models/RefreshToken');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user', async () => {
      (User.existsByEmail as jest.Mock).mockResolvedValue(false);
      (User.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
      });
      (VerificationToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.userId).toBe('user-id');
      expect(User.create).toHaveBeenCalled();
      expect(VerificationToken.create).toHaveBeenCalled();
    });

    it('should reject duplicate email', async () => {
      (User.existsByEmail as jest.Mock).mockResolvedValue(true);

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Test123!@#',
        })
      ).rejects.toThrow('Email already exists');
    });

    it('should reject weak password', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'weak',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      (User.findByEmail as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password_hash: '$2b$12$hashedpassword',
        email_verified: true,
      });
      // Mock bcrypt.compare
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      (RefreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test123!@#',
      });

      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
      expect(result.user.id).toBe('user-id');
    });

    it('should reject invalid credentials', async () => {
      (User.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'wrong@example.com',
          password: 'Test123!@#',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

---

## Phase 3: API Routes (백엔드)

**디렉토리:** `backend/src/`
**예상 시간:** 2시간

### 파일 목록

#### 1. `index.ts` (Fastify 서버)
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import { errorHandler } from './middleware/errorHandler';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // CORS
    await fastify.register(cors, {
      origin: config.FRONTEND_URL,
      credentials: true,
    });

    // Cookie parser
    await fastify.register(cookie);

    // Rate limiting
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    });

    // Routes
    await fastify.register(authRoutes, { prefix: '/api/auth' });
    await fastify.register(userRoutes, { prefix: '/api/users' });

    // Error handler
    fastify.setErrorHandler(errorHandler);

    // Health check
    fastify.get('/health', async () => ({ status: 'ok' }));

    // Start server
    await fastify.listen({
      port: config.PORT,
      host: '0.0.0.0'
    });

    console.log(`Server running on http://localhost:${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
```

#### 2. `middleware/authenticate.ts`
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../services/tokenService';
import { AuthError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

/**
 * JWT 인증 미들웨어
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('No token provided', 'NO_TOKEN', 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
    }

    // userId를 request에 추가
    request.userId = payload.userId;
  } catch (error) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
}
```

#### 3. `middleware/errorHandler.ts`
```typescript
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AuthError } from '../utils/errors';

/**
 * 글로벌 에러 핸들러
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // AuthError 처리
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
    });
  }

  // Validation error (Zod 등)
  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: error.validation,
    });
  }

  // 서버 에러
  request.log.error(error);
  return reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

#### 4. `routes/auth.ts`
```typescript
import { FastifyInstance } from 'fastify';
import * as authService from '../services/authService';

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const { email, password } = request.body as any;

    const result = await authService.register({ email, password });

    return reply.status(201).send(result);
  });

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body as any;

    const result = await authService.login({ email, password });

    // Refresh token을 httpOnly 쿠키로 설정
    reply.setCookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return reply.send({
      accessToken: result.accessToken,
      user: result.user,
    });
  });

  // POST /api/auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        error: 'NO_REFRESH_TOKEN',
        message: 'Refresh token not found',
      });
    }

    const result = await authService.refresh(refreshToken);

    return reply.send(result);
  });

  // POST /api/auth/logout
  fastify.post('/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // 쿠키 삭제
    reply.clearCookie('refreshToken');

    return reply.send({ message: 'Logged out successfully' });
  });

  // GET /api/auth/verify-email?token=xxx
  fastify.get('/verify-email', async (request, reply) => {
    const { token } = request.query as { token: string };

    await authService.verifyEmail(token);

    return reply.send({ message: 'Email verified successfully' });
  });

  // POST /api/auth/forgot-password
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body as { email: string };

    await authService.requestPasswordReset(email);

    return reply.send({
      message: 'If the email exists, a reset link has been sent',
    });
  });

  // POST /api/auth/reset-password
  fastify.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body as {
      token: string;
      password: string;
    };

    await authService.resetPassword(token, password);

    return reply.send({ message: 'Password reset successfully' });
  });
}
```

#### 5. `routes/users.ts`
```typescript
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/authenticate';
import * as User from '../models/User';

export default async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users/me (인증 필요)
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId!;

    const user = await User.findById(userId);

    if (!user) {
      return reply.status(404).send({
        error: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    // 비밀번호 해시 제외
    const { password_hash, ...userData } = user;

    return reply.send(userData);
  });

  // PATCH /api/users/me (인증 필요)
  fastify.patch('/me', { preHandler: authenticate }, async (request, reply) => {
    const userId = request.userId!;
    const updates = request.body as Partial<{ email: string }>;

    // 업데이트 가능한 필드만 허용
    const allowedUpdates = { email: updates.email };

    await User.update(userId, allowedUpdates);

    const user = await User.findById(userId);
    const { password_hash, ...userData } = user!;

    return reply.send(userData);
  });
}
```

### Integration 테스트

#### `tests/integration/auth.test.ts`
```typescript
import Fastify from 'fastify';
import authRoutes from '../../src/routes/auth';

describe('Auth API Integration', () => {
  let fastify: any;

  beforeAll(async () => {
    fastify = Fastify();
    await fastify.register(authRoutes, { prefix: '/api/auth' });
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Test123!@#',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toHaveProperty('userId');
    });

    it('should reject duplicate email', async () => {
      // 첫 번째 등록
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@example.com',
          password: 'Test123!@#',
        },
      });

      // 두 번째 등록 (중복)
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'duplicate@example.com',
          password: 'Test123!@#',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // 먼저 등록
      await fastify.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'login@example.com',
          password: 'Test123!@#',
        },
      });

      // 로그인
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'Test123!@#',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('accessToken');
      expect(response.cookies).toHaveLength(1);
      expect(response.cookies[0]).toHaveProperty('name', 'refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'wrong@example.com',
          password: 'WrongPassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
```

---

## Phase 5: Auth Forms (프론트엔드)

**디렉토리:** `frontend/`
**예상 시간:** 3시간

### 파일 구조
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
├── components/
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── PasswordStrengthIndicator.tsx
└── lib/
    └── schemas.ts
```

### 상세 내용은 다음 문서에서 계속...

---

이 문서는 너무 길어서 계속 작성하겠습니다. `IMPLEMENTATION_PLAN_FRONTEND.md`로 분리할까요?
