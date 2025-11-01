# Research: Docker Local Development Environment

**Feature**: 013-docker-local-env
**Date**: 2025-11-01
**Status**: Complete

## Research Questions

### Q1: Go Serverless Function のローカル実行方法

**Problem**: Vercel serverless function (`api/parse.go`) は `Handler(w http.ResponseWriter, r *http.Request)` 形式で、standalone実行できない

**Research Findings**:

**Option A: HTTP Server Wrapper**
- `cmd/server/main.go` に `http.ListenAndServe` wrapper作成
- CORS middleware追加
- Pros: シンプル、Vercel handler再利用可能
- Cons: 本番環境と異なる（ただし開発環境のみなので許容可能）

**Option B: Vercel CLI (`vercel dev`)**
- `vercel dev` コマンドでローカル実行
- Pros: 本番環境と完全一致
- Cons: Docker内でのVercel CLI実行が複雑、認証問題

**Option C: Serverless Framework**
- サードパーティフレームワーク導入
- Pros: 本番環境エミュレーション
- Cons: 過剰な複雑性、YAGNIに反する

**Decision**: **Option A - HTTP Server Wrapper**

**Rationale**:
1. シンプルさ優先（YAGNI原則）
2. 既存の `api/parse.go` Handler関数を変更不要で再利用
3. CORS設定を明示的に制御可能
4. 本番環境はVercelが管理、開発環境は起動速度とDX優先

**Implementation**:
```go
// cmd/server/main.go
package main

import (
    "log"
    "net/http"
    handler "feed-parallel-parse-api/api"
)

func main() {
    http.HandleFunc("/api/parse", func(w http.ResponseWriter, r *http.Request) {
        // CORS headers
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }

        handler.Handler(w, r)
    })

    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

---

### Q2: Dockerfile ベストプラクティス（Go Backend）

**Problem**: Go 1.25.1 の効率的なコンテナイメージ作成

**Research Findings**:

**Multi-stage Build Pattern**:
```dockerfile
# Stage 1: Build
FROM golang:1.25.1-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o /server cmd/server/main.go

# Stage 2: Runtime
FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /server /server
EXPOSE 8080
CMD ["/server"]
```

**Development Optimization**:
- **Volume Mount**: ソースコード変更の即座反映
- **Air (Live Reload Tool)**: Goコード変更時の自動再起動
  - 導入判断: ✅ 採用（DX向上、設定ファイル1つで完結）
  - インストール: `go install github.com/cosmtrek/air@latest`

**Decision**: Multi-stage build + Air for hot reload

**Rationale**:
- イメージサイズ削減（本番用ではないが、ビルド時間短縮に貢献）
- Air導入で15秒以内のホットリロード達成（Success Criteria SC-002）
- Alpine baseでセキュリティスキャン負荷低減

---

### Q3: Dockerfile ベストプラクティス（React Frontend）

**Problem**: Vite dev serverのコンテナ化とホットリロード

**Research Findings**:

**Vite Dev Server in Docker**:
```dockerfile
FROM node:25.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Key Configuration**:
- `--host 0.0.0.0`: Docker内からのアクセス許可
- Volume mount: `./frontend:/app` でソースコード同期
- Hot reload: Vite標準機能（追加設定不要）

**Optimization**:
- `npm ci` (clean install) for reproducibility
- `.dockerignore` で `node_modules` 除外

**Decision**: Node Alpine + Vite dev server (標準設定)

**Rationale**:
- Viteのホットリロードは標準で高速（通常5秒以内）
- 追加ツール不要、シンプル
- Alpine baseで起動時間短縮

---

### Q4: docker-compose.yml 設計パターン

**Problem**: Backend + Frontend の効率的なオーケストレーション

**Research Findings**:

**Service Dependencies**:
- Frontendはbackendに依存（API endpoint必要）
- `depends_on` で起動順序制御

**Network Configuration**:
- Default bridge networkで十分
- Service名でDNS解決（`backend:8080`）

**Environment Variables**:
- Frontend: `VITE_API_BASE_URL=http://localhost:8080` (開発者のホストマシンから)
- Backend: 環境変数不要（ポート8080固定）

**Volume Mounts**:
```yaml
services:
  backend:
    volumes:
      - ./:/app
      - /app/frontend  # Exclude frontend directory

  frontend:
    volumes:
      - ./frontend:/app
      - /app/node_modules  # Preserve container's node_modules
```

**Port Mapping**:
- Backend: `8080:8080`
- Frontend: `5173:5173`

**Decision**: Minimal docker-compose.yml with volume mounts

**Rationale**:
- シンプルさ優先
- ホットリロード対応（volume mount）
- ポート競合時のエラーは Docker Compose標準メッセージで十分

---

### Q5: .dockerignore 最適化

**Problem**: ビルドコンテキストの肥大化防止

**Research Findings**:

**Exclude Patterns**:
```
# Dependencies
node_modules/
vendor/

# Build artifacts
dist/
build/
*.exe

# Development
.git/
.env.local
.vscode/

# Tests
coverage/
*.test
```

**Decision**: 標準的な除外パターンを適用

**Rationale**:
- ビルド時間短縮（不要なファイルコピー削減）
- セキュリティ（.env.local等の機密情報除外）

---

### Q6: ホットリロード実現方法の比較

**Problem**: ソースコード変更を15秒以内に反映（SC-002）

**Research Findings**:

| Tool | Backend (Go) | Frontend (React) | Setup Complexity | Reload Speed |
|------|--------------|------------------|------------------|--------------|
| Volume Mount Only | ❌ Manual restart required | ❌ Requires Vite config | Low | N/A |
| Air (Go) + Vite | ✅ Auto restart ~5s | ✅ HMR ~1s | Medium | < 10s |
| Nodemon + Vite | ⚠️ Goに不適 | ✅ HMR ~1s | Medium | N/A |
| Custom watcher | ⚠️ 開発コスト高 | ⚠️ Viteで十分 | High | Variable |

**Decision**: Air (Backend) + Vite標準 (Frontend)

**Rationale**:
- 両方とも業界標準ツール
- 設定ファイル1つで完結（`.air.toml`）
- 合計リロード時間: 5s (backend) + 1s (frontend) = 6s < 15s (Success Criteria満たす)

**Air Configuration** (`.air.toml`):
```toml
root = "."
tmp_dir = "tmp"

[build]
  cmd = "go build -o ./tmp/main cmd/server/main.go"
  bin = "tmp/main"
  include_ext = ["go"]
  exclude_dir = ["frontend", "tmp", "vendor"]
  delay = 1000
```

---

### Q7: Error Handling & Logging Strategy

**Problem**: 起動エラーの原因を5分以内に特定（SC-004）

**Research Findings**:

**Docker Compose Logging**:
- 標準出力に全ログ集約
- `docker-compose logs -f [service]` でリアルタイム表示

**Common Errors & Solutions**:
| Error | Detection | Solution Hint |
|-------|-----------|---------------|
| Port in use | `bind: address already in use` | ポート番号を`.env`で変更可能に |
| Docker not running | `Cannot connect to Docker daemon` | Docker Desktop起動を促すメッセージ |
| Build failure | Exit code 1 with error logs | ログにビルドエラー詳細表示 |
| OOM | Container killed | Memory制限緩和提案 |

**Decision**: Structured logging + 明確なエラーメッセージ

**Implementation**:
- Backend: Go標準 `log` package + structured output
- Frontend: Vite標準エラー表示
- docker-compose: `--verbose` フラグでデバッグモード

---

## Best Practices Summary

### Must Implement

1. **Multi-stage Dockerfile** (Backend) - イメージサイズ削減
2. **Air for hot reload** (Backend) - 自動再起動
3. **Volume mounts** - ソースコード同期
4. **CORS middleware** (Backend) - フロントエンド通信許可
5. **`.dockerignore`** - ビルド最適化
6. **Structured logging** - エラー診断効率化

### Should Implement

7. **Health check endpoints** - 起動確認自動化
8. **Environment variables** - ポート番号カスタマイズ
9. **README update** - セットアップ手順明記

### Could Implement (Future)

10. **docker-compose.override.yml** - 個別開発者カスタマイズ
11. **Makefile** - コマンド簡略化
12. **Pre-commit hooks** - docker-compose up 前のlint

---

## Alternatives Considered & Rejected

### Rejected: Kubernetes for Local Development

**Reason**: 過剰な複雑性、2サービスのみならdocker-composeで十分

### Rejected: Dev Containers (VS Code)

**Reason**: エディタ依存、docker-compose の方が汎用的

### Rejected: Tilt / Skaffold

**Reason**: YAGNI、シンプルなdocker-composeで要件満たす

---

## Technology Decisions Summary

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| Backend Container | Go Alpine | 1.25.1-alpine | 軽量、セキュリティスキャン高速 |
| Frontend Container | Node Alpine | 25.0-alpine | 既存Node.js version一致 |
| Orchestration | Docker Compose | 2.0+ | 2サービスに最適、学習コスト低 |
| Backend Hot Reload | Air | Latest | Go標準ツール、設定簡単 |
| Frontend Hot Reload | Vite (Built-in) | 7.1.7 | 既存ツール、追加設定不要 |
| Logging | stdout/stderr | N/A | Docker Compose標準、追加ツール不要 |

---

## Open Questions (Resolved)

~~Q: Air導入によるCPU負荷は許容範囲か？~~
**A**: ✅ Air は file watcher最適化済み、CPU負荷はnodemon並（許容範囲）

~~Q: Vite dev server の `--host 0.0.0.0` はセキュリティリスクか？~~
**A**: ✅ ローカル開発環境のみ、Docker network内限定なので問題なし

~~Q: Multi-stage buildは開発環境で必要か？~~
**A**: ✅ 初回ビルド時間は増加するが、2回目以降はキャッシュ効果でトータル高速化

---

## References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Air - Live reload for Go](https://github.com/cosmtrek/air)
- [Vite - Server Options](https://vitejs.dev/config/server-options.html)
- [Docker Compose - Networking](https://docs.docker.com/compose/networking/)
- [Go Docker Multi-stage Builds](https://docs.docker.com/language/golang/build-images/)

---

**Status**: ✅ All research questions resolved, ready for Phase 1 (Design & Contracts)
