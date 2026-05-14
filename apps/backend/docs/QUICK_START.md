# Quick Start Guide 🚀

## All Services URLs

After starting Docker and your app, access these URLs:

| Service | URL | Description |
|---------|-----|-------------|
| **API** | <http://localhost:3000> | Backend API |
| **Swagger** | <http://localhost:3000/api/docs> | API Documentation |
| **Jaeger** | <http://localhost:16686> | Distributed Tracing UI |
| **Mailpit** | <http://localhost:8025> | Email Testing |
| **MinIO** | <http://localhost:9001> | S3 Storage Console |
| **Redis Commander** | <http://localhost:8081> | Redis GUI |

---

## 🏁 Complete Setup (First Time)

```bash
# 1. Start all Docker services
docker-compose -f docker-compose.dev.yml up -d

# 2. Wait for services to be healthy
docker-compose -f docker-compose.dev.yml ps

# 3. Setup environment
cp .env.example .env

# 4. Install dependencies
pnpm install

# 5. Start the app
pnpm run start:dev
```

**Open in browser:** <http://localhost:3000/api/docs>

---

## 📊 View Real-Time Traces

1. **Make an API request:**
```bash
curl http://localhost:3000/api/v1/health
```

2. **Open Jaeger:** <http://localhost:16686>

3. **Select Service:** `demi-backend`

4. **Click "Find Traces"**

5. **See your request flow!** 🎉

---

## 🛠️ Useful Commands

### Docker
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart a service
docker-compose -f docker-compose.dev.yml restart jaeger
```

### App
```bash
# Development (hot reload)
pnpm run start:dev

# Build
pnpm run build

# Production
pnpm run start:prod

# Run tests
pnpm test
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it demi-postgres psql -U postgres -d demi_db

# Connect to Redis
docker exec -it demi-redis redis-cli -a redis123

# Backup database
docker exec demi-postgres pg_dump -U postgres demi_db > backup.sql
```

---

## 🔍 Monitoring & Debugging

### Check Service Health
```bash
# All services status
docker-compose -f docker-compose.dev.yml ps

# Check logs for specific service
docker logs demi-jaeger -f
docker logs demi-postgres -f
docker logs demi-redis -f
```

### View Traces
1. Open Jaeger: <http://localhost:16686>
2. Service: `demi-backend`
3. Click "Find Traces"
4. Click any trace to see details

### Test Email
1. Trigger an email in your app
2. Open Mailpit: <http://localhost:8025>
3. See the email (never actually sent)

### View S3 Files
1. Open MinIO: <http://localhost:9001>
2. Login: `minioadmin` / `minioadmin123`
3. Browse buckets and files

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `TRACING_GUIDE.md` | Complete Jaeger/OpenTelemetry guide |
| `DOCKER_SETUP.md` | Docker setup and troubleshooting |
| `RBAC_GUIDE.md` | Role-based access control guide |
| `GOOGLE_OAUTH_SETUP.md` | Google OAuth integration |
| `NESTJS_GUIDE_FOR_EXPRESS_DEVS.md` | NestJS concepts for Express devs |

---

## 🎯 What's Been Set Up

✅ **PostgreSQL 16** - Main database
✅ **Redis 7** - Cache, sessions, queues
✅ **MinIO** - S3-compatible storage
✅ **Mailpit** - Email testing
✅ **Jaeger** - Distributed tracing
✅ **Redis Commander** - Redis GUI
✅ **OpenTelemetry** - Auto-instrumentation
✅ **RBAC** - Role-based access control (4 roles)
✅ **JWT + OAuth2** - Authentication
✅ **Swagger** - API documentation

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Services Not Starting
```bash
# Remove everything and start fresh
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### No Traces in Jaeger
```bash
# Check Jaeger is running
curl http://localhost:16686/

# Check OTLP endpoint
curl http://localhost:4318/

# Verify environment variable
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec demi-postgres pg_isready -U postgres

# Check logs
docker logs demi-postgres --tail=50
```

---

## ⚡ Performance Tips

### Enable Caching
```typescript
// Redis caching reduces DB load by 60-70%
// Already configured for company settings, user profiles
```

### Monitor Slow Queries
1. Open Jaeger: <http://localhost:16686>
2. Set Min Duration: `500ms`
3. Find slow requests
4. Optimize database queries

### Check Resource Usage
```bash
# View Docker stats
docker stats

# Specific container
docker stats demi-postgres
```

---

## 🎉 You're Ready!

**Everything is set up and ready to use!**

Start coding and watch your traces in real-time! 🚀

```bash
# Start everything
docker-compose -f docker-compose.dev.yml up -d
pnpm run start:dev

# Open these tabs:
# - API Docs: http://localhost:3000/api/docs
# - Jaeger: http://localhost:16686
# - Mailpit: http://localhost:8025

# Make a request and see it traced!
curl http://localhost:3000/api/v1/health
```
