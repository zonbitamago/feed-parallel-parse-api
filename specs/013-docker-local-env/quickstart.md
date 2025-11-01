# Quickstart Guide: Docker Local Development Environment

**Feature**: 013-docker-local-env
**Last Updated**: 2025-11-01
**Estimated Setup Time**: 5-10 minutes (初回ビルド含む)

## Prerequisites

### Required Software

- **Docker Desktop** 20.10+ (or Docker Engine + Docker Compose)
  - macOS: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Windows: [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

- **Git** (プロジェクトクローン用)

### System Requirements

- **CPU**: 2 cores以上推奨
- **Memory**: 4GB以上推奨
- **Disk Space**: 5GB以上の空き容量

### Verification

Docker Desktopが起動していることを確認：

```bash
docker --version
# Expected: Docker version 20.10.x or higher

docker-compose --version
# Expected: Docker Compose version 2.0.x or higher
```

---

## Quick Start (3 Steps)

### Step 1: Clone Repository

```bash
git clone https://github.com/zonbitamago/feed-parallel-parse-api.git
cd feed-parallel-parse-api
```

### Step 2: Checkout Docker Feature Branch

```bash
git checkout 013-docker-local-env
```

### Step 3: Start Development Environment

```bash
docker-compose up
```

**Expected Output**:
```
[+] Running 2/2
 ✔ Container feed-api-backend   Created
 ✔ Container feed-api-frontend  Created
Attaching to feed-api-backend, feed-api-frontend
feed-api-backend   | Server starting on :8080
feed-api-frontend  | VITE v7.1.7  ready in 1234 ms
feed-api-frontend  | ➜  Local:   http://localhost:5173/
```

### Step 4: Verify Services

Open your browser:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api/parse (POST endpoint)

**Success Indicators**:
- ✅ Frontend loads without errors
- ✅ Backend responds to API requests
- ✅ Console shows no error messages

---

## Development Workflow

### Making Code Changes

#### Backend (Go)

1. Edit files in `cmd/`, `pkg/`, or `api/`
2. **Air** automatically detects changes
3. Backend restarts within **~5 seconds**
4. Check logs: `docker-compose logs -f backend`

**Example**:
```bash
# Edit cmd/server/main.go
echo '// Added comment' >> cmd/server/main.go

# Watch logs
docker-compose logs -f backend
# Output: Backend restarted automatically
```

#### Frontend (React + TypeScript)

1. Edit files in `frontend/src/`
2. **Vite** automatically detects changes
3. Browser hot-reloads within **~1 second**
4. No manual refresh needed

**Example**:
```bash
# Edit frontend/src/App.tsx
echo '// Added comment' >> frontend/src/App.tsx

# Browser automatically reloads (check Network tab)
```

### Running Tests

#### Backend Tests

```bash
# Inside backend container
docker-compose exec backend go test ./tests/unit/... -v

# Or from host machine (if Go installed)
go test ./tests/unit/... -v
```

#### Frontend Tests

```bash
# Inside frontend container
docker-compose exec frontend npm test

# Or from host machine (if Node.js installed)
cd frontend && npm test
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

---

## Stopping & Cleaning Up

### Stop Services (Keep Containers)

```bash
docker-compose stop
```

Services stopped but containers preserved. Resume with `docker-compose start`.

### Stop & Remove Containers

```bash
docker-compose down
```

Removes containers and networks. Re-run `docker-compose up` to recreate.

### Clean Everything (Including Volumes)

```bash
docker-compose down -v
```

**Warning**: Removes all data in volumes (if any). Use for complete reset.

### Remove Images (Save Disk Space)

```bash
docker-compose down --rmi all
```

Next `docker-compose up` will rebuild images from scratch.

---

## Troubleshooting

### Issue 1: Port Already in Use

**Error**:
```
Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:8080
```

**Solution**:
```bash
# Option A: Stop process using port 8080
lsof -ti:8080 | xargs kill -9

# Option B: Change port in docker-compose.yml
# Edit: "8081:8080" instead of "8080:8080"
```

### Issue 2: Docker Desktop Not Running

**Error**:
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution**:
1. Start Docker Desktop application
2. Wait for "Docker is running" indicator
3. Retry `docker-compose up`

### Issue 3: Slow Build Times

**Symptom**: Initial build takes > 10 minutes

**Solutions**:
```bash
# 1. Check Docker Desktop resource allocation
# Settings → Resources → Advanced
# Increase CPUs to 4, Memory to 8GB

# 2. Clean Docker cache
docker system prune -a

# 3. Use BuildKit
export DOCKER_BUILDKIT=1
docker-compose up --build
```

### Issue 4: Hot Reload Not Working

**Backend (Air)**:
```bash
# Check .air.toml exists
ls .air.toml

# Restart backend service
docker-compose restart backend
```

**Frontend (Vite)**:
```bash
# Check frontend/.env.local for correct API URL
cat frontend/.env.local
# Expected: VITE_API_BASE_URL=http://localhost:8080

# Restart frontend service
docker-compose restart frontend
```

### Issue 5: Module Not Found Errors

**Backend**:
```bash
docker-compose exec backend go mod tidy
docker-compose restart backend
```

**Frontend**:
```bash
docker-compose exec frontend npm install
docker-compose restart frontend
```

---

## Advanced Usage

### Custom Environment Variables

Create `.env` file in project root:

```env
# .env
BACKEND_PORT=8080
FRONTEND_PORT=5173
VITE_API_BASE_URL=http://localhost:8080
```

docker-compose.yml will automatically read this file.

### Running Specific Services

```bash
# Backend only
docker-compose up backend

# Frontend only (backend must be running)
docker-compose up frontend
```

### Rebuild After Dependency Changes

```bash
# Rebuild all images
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Execute Commands Inside Containers

```bash
# Backend (Go shell)
docker-compose exec backend sh

# Frontend (Node.js shell)
docker-compose exec frontend sh

# Run one-off command
docker-compose run --rm backend go version
```

---

## Performance Benchmarks

**Initial Build** (first time):
- Backend: ~2-3 minutes
- Frontend: ~1-2 minutes
- **Total**: ~3-5 minutes

**Subsequent Builds** (with cache):
- Backend: ~30 seconds
- Frontend: ~15 seconds
- **Total**: ~45 seconds

**Hot Reload Times**:
- Backend: ~5 seconds (Air restart)
- Frontend: ~1 second (Vite HMR)

**Success Criteria Compliance**:
- ✅ SC-001: Environment starts < 5 minutes
- ✅ SC-002: Code changes reflect < 15 seconds
- ✅ SC-003: Startup success rate > 95%

---

## Next Steps

### For Developers

1. ✅ Environment running successfully
2. ✅ Make a test change and verify hot reload
3. ✅ Run backend and frontend tests
4. ✅ Read [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines
5. ✅ Check [CLAUDE.md](../../CLAUDE.md) for AI-assisted development rules

### For Project Maintainers

1. Update [README.md](../../README.md) with Docker setup instructions
2. Add GitHub Actions workflow for Docker build validation
3. Document any project-specific environment variables
4. Create docker-compose.override.yml template for custom configs

---

## FAQ

**Q: Can I run backend/frontend outside Docker?**
A: Yes, but you'll need to install Go 1.25.1 and Node.js 25.0 locally. Docker ensures consistency across all developers.

**Q: Do I need to restart after changing environment variables?**
A: Yes, run `docker-compose restart <service>` after changing `.env` or `docker-compose.yml`.

**Q: Can I use this for production deployment?**
A: No, these Docker files are optimized for development. Production deployment uses Vercel (existing setup).

**Q: How do I debug inside containers?**
A: Use `docker-compose exec <service> sh` to access container shell. For Go debugging, consider remote debugging with Delve.

**Q: What's the difference between `docker-compose up` and `docker-compose up -d`?**
A: `-d` runs in detached mode (background). Use `docker-compose logs -f` to view logs when detached.

---

## Support

**Issues**: [GitHub Issues](https://github.com/zonbitamago/feed-parallel-parse-api/issues)
**Discussions**: [GitHub Discussions](https://github.com/zonbitamago/feed-parallel-parse-api/discussions)
**Documentation**: [Project Wiki](https://github.com/zonbitamago/feed-parallel-parse-api/wiki)

---

**Last Tested**: 2025-11-01
**Tested On**: macOS (Apple Silicon), Docker Desktop 4.25.0
**Compatibility**: macOS, Linux, Windows (WSL2)
