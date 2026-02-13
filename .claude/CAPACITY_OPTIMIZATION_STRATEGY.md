# 용량 최적화 전략: Claude vs Codex 역할 분담

> Canonical policy: .claude/OPERATING_MODEL.md (conflict 시 기준 문서 우선, auto-fix 허용, 2계정 기본).

## 📊 용량 현황

### Claude (제한적)
- 주간 사용량 제한 있음
- 토큰당 비용 높음
- 전략/조율에 최적화

### Codex (풍부)
- 주간 용량이 Claude보다 많음
- 코드 생성/수정에 특화
- 실행 중심 작업에 최적

---

## 🎯 최적화된 역할 분담

### ⚡ Claude Agents: 전략 레이어 (경량)

**alpha-lead / beta-lead (Opus)**
- ✅ 프로젝트 계획 수립
- ✅ 작업 분해 및 할당
- ✅ 진행 상황 모니터링
- ✅ 팀 간 조율
- ❌ 직접 코드 작성 (금지)

**alpha-codex / beta-codex (Sonnet)**
- ✅ Codex CLI로 분석 (`codex review`)
- ✅ 보안 이슈 식별
- ✅ 수정 제안 작성
- ❌ 직접 코드 수정 (위임)

**alpha-backend / alpha-frontend (Sonnet)**
- ✅ 아키텍처 설계
- ✅ 기술적 의사결정
- ✅ 코드 리뷰
- ❌ 직접 코드 작성 (위임)

---

### 🚀 Codex: 실행 레이어 (중량)

**codex-executor (Haiku + Codex exec)**
- ✅ 실제 코드 작성 (`codex exec`)
- ✅ 파일 생성 및 수정
- ✅ 테스트 코드 생성
- ✅ 리팩토링 실행
- ✅ 버그 수정 적용

---

## 🔄 워크플로우

### Before (비효율적)
```
사용자 요청
    ↓
alpha-lead: 계획 수립 (200 tokens)
    ↓
alpha-backend: 코드 작성 (5000 tokens) ❌ 비효율!
    ↓
alpha-codex: 리뷰 (1000 tokens)
    ↓
총: 6200 Claude tokens
```

### After (최적화)
```
사용자 요청
    ↓
alpha-lead: 계획 수립 (200 tokens)
    ↓
alpha-backend: 작업 명세 작성 (300 tokens)
    ↓
codex-executor: Codex에 위임 (50 tokens)
    ↓
Codex exec: 실제 코드 작성 (Codex 용량 사용) ✅
    ↓
alpha-codex: 리뷰 (500 tokens)
    ↓
총: 1050 Claude tokens (83% 절감!)
```

---

## 💡 사용 패턴

### Pattern 1: 새 기능 개발

```bash
# 1. alpha-lead가 요구사항 분석 (Claude)
alpha-lead: "2FA 기능이 필요합니다"

# 2. alpha-backend가 설계 (Claude)
alpha-backend: "다음 파일들이 필요합니다:
- backend/src/services/twoFactorService.ts
- backend/src/routes/twoFactor.ts
- backend/tests/twoFactor.test.ts"

# 3. codex-executor가 구현 (Codex)
codex-executor: codex exec --full-auto "
Implement 2FA with TOTP:
- Service: generateSecret, verifyToken
- Routes: POST /enable, POST /verify
- Tests: Full coverage
- Use: speakeasy library
"

# 4. alpha-codex가 리뷰 (Claude)
alpha-codex: codex review --uncommitted
"보안 이슈 없음, 승인"
```

**토큰 사용:**
- alpha-lead: 100
- alpha-backend: 200
- codex-executor: 50
- alpha-codex: 500
- **총 Claude: 850 tokens**
- **Codex: 별도 용량 사용**

---

### Pattern 2: 테스트 커버리지 개선

```bash
# 1. alpha-lead가 목표 설정 (Claude)
alpha-lead: "프론트엔드 커버리지 49% → 80%"

# 2. alpha-frontend가 분석 (Claude)
alpha-frontend: "다음 파일들의 테스트 필요:
- lib/api.ts (0% → 80%)
- lib/authToken.ts (0% → 80%)
- hooks/useAuth.ts (0% → 80%)"

# 3. codex-executor가 테스트 작성 (Codex)
codex-executor: codex exec --full-auto "
Write comprehensive tests for:
- frontend/lib/api.ts
- frontend/lib/authToken.ts
- frontend/hooks/useAuth.ts
Target: 80%+ coverage
Framework: Jest + React Testing Library
"

# 4. beta-qa가 검증 (Claude - 다른 계정)
beta-qa: npm test
"커버리지 82% 달성, 승인"
```

**토큰 사용:**
- alpha-lead: 50
- alpha-frontend: 200
- codex-executor: 50
- beta-qa: 300
- **총 Claude: 600 tokens**

---

### Pattern 3: 보안 이슈 수정

```bash
# 1. beta-codex가 이슈 발견 (Claude)
beta-codex: codex review --uncommitted
"SQL injection: authService.ts:45"

# 2. alpha-backend가 수정 방안 설계 (Claude)
alpha-backend: "parameterized query 사용:
- 변경: db.query(`...${userId}...`)
- 수정: db.query('...WHERE id = $1', [userId])"

# 3. codex-executor가 수정 적용 (Codex)
codex-executor: codex exec --full-auto "
Fix SQL injection in backend/src/services/authService.ts:
- Line 45: Replace string concatenation
- Use: Parameterized query with $1 placeholder
- Add test: Verify injection prevention
"

# 4. beta-codex가 재검증 (Claude)
beta-codex: codex review --uncommitted
"SQL injection 수정 확인, 승인"
```

**토큰 사용:**
- beta-codex: 300 (분석)
- alpha-backend: 150 (설계)
- codex-executor: 50 (위임)
- beta-codex: 300 (재검증)
- **총 Claude: 800 tokens**

---

## 📈 용량 절감 효과

### 시나리오: 중형 기능 개발

| 작업 | 기존 (Claude만) | 최적화 (Claude+Codex) | 절감 |
|------|----------------|---------------------|------|
| 계획 수립 | 200 | 200 | 0% |
| 아키텍처 설계 | 500 | 400 | 20% |
| 코드 작성 | 8000 | 100 | **99%** |
| 테스트 작성 | 3000 | 100 | **97%** |
| 코드 리뷰 | 1000 | 800 | 20% |
| **총계** | **12,700** | **1,600** | **87%** |

### 주간 프로젝트 예상

**기존 방식:**
- 5개 기능 개발: 63,500 tokens
- Claude 주간 한도 초과 위험

**최적화 방식:**
- 5개 기능 개발: 8,000 tokens (Claude)
- + Codex 용량 사용
- Claude 주간 한도 안전

---

## 🎯 에이전트별 토큰 예산

### Alpha 팀 (계정 1: tjeom01@gmail.com)

| 에이전트 | 모델 | 작업당 예상 | 역할 |
|----------|------|------------|------|
| alpha-lead | Opus | 100-300 | 전략, 조율 |
| alpha-backend | Sonnet | 200-500 | 설계, 리뷰 |
| alpha-frontend | Sonnet | 200-500 | 설계, 리뷰 |
| alpha-codex | Sonnet | 300-800 | 분석, 검증 |
| codex-executor | **Haiku** | **30-100** | **위임만** |

**팀 총계 (작업당): 830-2200 tokens**

### Beta 팀 (계정 2: eomtj2001@gmail.com)

| 에이전트 | 모델 | 작업당 예상 | 역할 |
|----------|------|------------|------|
| beta-lead | Opus | 100-300 | 조율, 승인 |
| beta-codex | Sonnet | 500-1000 | 심층 감사 |
| beta-qa | Sonnet | 300-600 | 테스트 검증 |

**팀 총계 (작업당): 900-1900 tokens**

---

## 🚀 codex-executor 활성화

### Team Alpha에 추가

```bash
# 현재 터미널 (Team Alpha)
# codex-executor 스폰 요청
"alpha-lead에게: codex-executor 에이전트를 추가해줘.
이 에이전트는 Haiku 모델을 사용하고
실제 코드 작성을 Codex exec에 위임해서
Claude 토큰을 절약하는 역할이야."
```

### 사용 예시

```bash
# alpha-lead가 codex-executor에 작업 할당
"codex-executor에게:
backend/src/routes/auth.ts에 rate limiting을 추가해줘.
요구사항:
- 로그인: 5 attempts / 15분
- 회원가입: 3 attempts / 1시간
- express-rate-limit 사용
- 테스트 추가

Codex exec로 실행해줘."
```

---

## 📊 모니터링

### 토큰 사용량 추적

```bash
# Claude 사용량 확인 (계정 1)
cat ~/.claude/.claude.json | jq '.projects["/home/tj/projects/auth-system"].lastCost'

# Claude 사용량 확인 (계정 2)
cat ~/.claude-account1/.claude.json | jq '.projects["/home/tj/projects/auth-system"].lastCost'
```

### 효율성 측정

```bash
# 작업당 평균 토큰
echo "총 토큰: XXXX"
echo "작업 수: YY"
echo "작업당 평균: $(bc <<< "scale=2; XXXX/YY")"
```

---

## 🎯 베스트 프랙티스

### ✅ Do

1. **큰 코드 작업은 항상 codex-executor 사용**
   - 새 파일 생성
   - 대규모 리팩토링
   - 테스트 코드 생성

2. **Claude는 전략/리뷰에 집중**
   - 아키텍처 결정
   - 코드 리뷰
   - 보안 분석

3. **명확한 명세 작성**
   - Codex가 이해하기 쉽게
   - 요구사항 구체화
   - 예상 결과 명시

### ❌ Don't

1. **작은 작업에 codex-executor 사용 금지**
   - 한 줄 수정: Claude가 빠름
   - 간단한 변경: 오버헤드

2. **전략적 결정을 Codex에 위임 금지**
   - 아키텍처 선택
   - 기술 스택 결정
   - 보안 정책

3. **검증 없이 Codex 결과 수용 금지**
   - 항상 리뷰 필요
   - 테스트 실행 확인
   - 보안 검증

---

## 🎉 요약

### 핵심 전략
```
Claude (제한적 용량):
전략 수립 → 설계 → 명세 작성 → 리뷰 → 승인

Codex (풍부한 용량):
명세 수신 → 코드 생성 → 테스트 작성 → 결과 보고

결과:
Claude 토큰 87% 절감
Codex 용량 최대 활용
더 많은 기능 개발 가능!
```

### 구현 완료 체크리스트
- ✅ codex-executor.yaml 생성
- ✅ 용량 최적화 전략 문서화
- ⏳ codex-executor 에이전트 스폰 (다음 단계)
- ⏳ 실제 작업에서 검증

---

**이제 Claude의 두뇌와 Codex의 손을 결합했습니다!** 🧠🤝✋
