# Codex MCP Server 설정 가이드

Codex CLI를 MCP (Model Context Protocol) 서버로 설정하여 더 긴밀한 통합을 제공합니다.

## 설정 방법

프로젝트의 Claude 설정에 다음을 추가:

### 옵션 1: 프로젝트별 설정 (.claude/mcp.json)

```json
{
  "mcpServers": {
    "codex": {
      "type": "stdio",
      "command": "codex",
      "args": ["mcp"],
      "env": {}
    }
  }
}
```

### 옵션 2: 전역 설정 (~/.claude.json)

```json
{
  "projects": {
    "/home/tj/projects/auth-system": {
      "mcpServers": {
        "codex": {
          "type": "stdio",
          "command": "codex",
          "args": ["mcp"]
        }
      }
    }
  }
}
```

## 사용 방법

MCP 서버로 설정하면:
- `mcp__codex__*` 형태의 도구로 접근 가능
- CLI보다 구조화된 응답
- 에러 처리 개선

현재는 CLI 직접 호출 방식 사용 중:
- `codex review --uncommitted`
- `codex exec "보안 분석 요청"`
