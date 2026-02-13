# EIMAS Beta Team Auto-Setup Guide

**다른 터미널에서 이 내용을 Claude에게 전달하세요.**

---

## Beta Team 자동 생성 및 작업 할당

베타팀을 생성하고 EIMAS의 API, DB, 성능, 문서화 작업을 자동으로 진행해줘.

### 팀 생성
```
team-name: eimas-beta
description: EIMAS API, database, performance optimization, and documentation improvement - parallel to alpha team's refactoring
```

### 작업 리스트

**Task B1: FastAPI 백엔드 최적화**
- Subject: Optimize FastAPI backend and API endpoints
- Description:
  - Analyze /home/tj/projects/autoai/eimas/api/ structure
  - Optimize API endpoint performance
  - Improve error handling and validation
  - Add request/response logging
  - Implement WebSocket for real-time updates
  - Review and optimize middleware
- ActiveForm: Optimizing FastAPI backend

**Task B2: PostgreSQL/RA SQL 고도화**
- Subject: Productionize PostgreSQL schema and ETL pipeline
- Description:
  - Implement TODO.md Track E (RA SQL Productionization)
  - Standardize fi_ra schema (company_fundamentals, macro_series, etc.)
  - Add common meta columns (as_of_date, source, ingested_at)
  - Define PK/UK/FK policies
  - Create analysis/report query indexes
  - Implement staging → mart ETL structure
  - Add upsert policies with conflict logging
  - Create batch execution log table
  - Location: /home/tj/projects/autoai/eimas/data/, /home/tj/projects/autoai/eimas/lib/trading_db.py
- ActiveForm: Implementing PostgreSQL schema improvements

**Task B3: 성능 최적화 및 프로파일링**
- Subject: Optimize pipeline performance and profiling
- Description:
  - Implement TODO.md Track C (Performance/Reliability)
  - Extend Phase 2 caching mechanisms (1h TTL)
  - Improve AI validation parallelization
  - Optimize database query performance
  - Add memory profiling
  - Reduce pipeline execution time (target: 249s → 120s)
  - Add performance telemetry
  - Implement fail-fast options for network-heavy operations
  - Location: /home/tj/projects/autoai/eimas/pipeline/
- ActiveForm: Optimizing pipeline performance

**Task B4: API 문서화 및 운영 가이드**
- Subject: Improve documentation and operational guides
- Description:
  - Generate OpenAPI/Swagger documentation
  - Update architecture diagrams
  - Write operational runbooks
  - Document deployment procedures
  - Add code comments and docstrings
  - Create API usage examples
  - Update /home/tj/projects/autoai/eimas/docs/
- ActiveForm: Improving documentation

**Task B5: 테스트 인프라 강화**
- Subject: Strengthen test infrastructure and coverage
- Description:
  - Set up pytest environment properly
  - Add integration tests
  - Expand test coverage
  - Set up CI/CD pipeline foundation
  - Create test fixtures and utilities
  - Location: /home/tj/projects/autoai/eimas/tests/
- ActiveForm: Strengthening test infrastructure

**Task B6: 실시간 파이프라인 개선**
- Subject: Improve real-time data pipeline and streaming
- Description:
  - Stabilize Binance stream integration
  - Implement real-time notification system
  - Improve WebSocket connection management
  - Add real-time data validation
  - Optimize streaming performance
  - Location: /home/tj/projects/autoai/eimas/pipeline/realtime.py, /home/tj/projects/autoai/eimas/lib/binance_stream.py
- ActiveForm: Improving real-time pipeline

### 팀원 구성

**Spawn 3 agents:**

1. **api-optimizer** (general-purpose)
   - Tasks: B1 (FastAPI), B4 (Documentation)
   - Responsibilities: API optimization, documentation

2. **db-perf-specialist** (general-purpose)
   - Tasks: B2 (PostgreSQL), B3 (Performance)
   - Responsibilities: Database optimization, performance tuning

3. **test-realtime-engineer** (general-purpose)
   - Tasks: B5 (Testing), B6 (Real-time)
   - Responsibilities: Test infrastructure, real-time pipelines

### 의존성 설정

```
B4 blocked by: B1
B6 blocked by: B3
```

### 자동 실행 명령

다른 터미널에서 Claude를 시작한 후 이 메시지를 보내세요:

---

베타팀을 자동으로 설정해줘.

**팀 생성:**
- team-name: eimas-beta
- description: EIMAS API, database, performance optimization, and documentation

**6개 작업 생성:**

1. FastAPI 백엔드 최적화 (/home/tj/projects/autoai/eimas/api/)
2. PostgreSQL/RA SQL 고도화 (TODO.md Track E 구현)
3. 성능 최적화 (캐싱, 병렬화, 프로파일링)
4. API 문서화 및 운영 가이드
5. 테스트 인프라 강화 (pytest 환경)
6. 실시간 파이프라인 개선

**3명 팀원 스폰:**

1. api-optimizer (Tasks B1, B4)
2. db-perf-specialist (Tasks B2, B3)
3. test-realtime-engineer (Tasks B5, B6)

**의존성:**
- B4 blocked by B1
- B6 blocked by B3

**자동 모드로 실행:**
모든 팀원이 자율적으로 작업하고, 완료되면 자동으로 다음 작업 시작.

---

이렇게 설정하면 알파팀과 베타팀이 병렬로 자동 실행됩니다!
