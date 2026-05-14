# Docker Setup Guide

## Services Overview

Your Docker setup includes all services mentioned in the HLD:

| Service | Port | Description | UI/Access |
|---------|------|-------------|-----------|
| **PostgreSQL 16** | 5432 | Main database | psql, pgAdmin, DBeaver |
| **Redis 7** | 6379 | Cache, sessions, Bull queues | redis-cli |
| **Redis Commander** | 8081 | Redis GUI | http://localhost:8081 |
| **MinIO** | 9000, 9001 | S3-compatible storage (dev) | http://localhost:9001 |
| **Mailpit** | 1025, 8025 | Email testing (dev) | http://localhost:8025 |
| **Jaeger** | 16686, 4318 | Distributed tracing | http://localhost:16686 |
| **NestJS App** | 3000 | Backend API | http://localhost:3000 |

---

## Quick Start

### Option 1: Development (Recommended)
**Run services in Docker, app locally**

```bash
# 1. Start PostgreSQL, Redis, MinIO, Mailpit
docker compose -f docker-compose.dev.yml up -d

# 2. Wait for services to be healthy
docker compose -f docker-compose.dev.yml ps

# 3. Copy environment file
cp .env.example .env

# 4. Install dependencies
pnpm install

# 5. Run migrations
pnpm run migration:run

# 6. Start app locally (with hot reload)
pnpm run start:dev
```

**Access:**
- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs
- Redis GUI: http://localhost:8081
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)
- Mailpit (Email): http://localhost:8025
- PostgreSQL: localhost:5432

---

### Option 2: Everything in Docker
**All services including app in Docker**

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down
```

---

### Option 3: Production
**Optimized production setup**

```bash
# Build production image
docker compose -f docker-compose.prod.yml build

# Start production services
docker compose -f docker-compose.prod.yml up -d

# Check health
docker compose -f docker-compose.prod.yml ps
```

---

## Environment Setup

### Development (.env)
```env
# Database - connects to Docker container
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres123
DB_DATABASE=demi_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# Email (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025

# Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### Production (.env.production)
```env
# Database - internal Docker network
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=your_db_user
DB_PASSWORD=strong_password_here

# Redis - internal Docker network
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password

# Email (SendGrid or SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=demi-documents-prod
```

---

## Service Details

### PostgreSQL 16
```bash
# Connect to PostgreSQL
docker exec -it demi-postgres psql -U postgres -d demi_db

# View logs
docker logs demi-postgres -f

# Backup database
docker exec demi-postgres pg_dump -U postgres demi_db > backup.sql

# Restore database
docker exec -i demi-postgres psql -U postgres demi_db < backup.sql
```

**Extensions installed:**
- `uuid-ossp` - UUID generation
- `pg_trgm` - Fast text search

### Redis 7
```bash
# Connect to Redis
docker exec -it demi-redis redis-cli -a redis123

# Monitor Redis commands
docker exec -it demi-redis redis-cli -a redis123 MONITOR

# View Redis GUI
open http://localhost:8081
```

**Redis Commander credentials:**
- Auto-configured, no login required

### MinIO (S3-compatible storage)
```bash
# Access MinIO Console
open http://localhost:9001

# Login credentials
Username: minioadmin
Password: minioadmin123

# Create bucket (first time)
# 1. Open MinIO Console
# 2. Go to Buckets
# 3. Create bucket: demi-documents
# 4. Set access policy to "public" or "private"
```

**MinIO vs AWS S3:**
- Development: Use MinIO (local, fast, free)
- Production: Use AWS S3 (scalable, reliable)

### Mailpit (Email testing)
```bash
# Access Mailpit UI
open http://localhost:8025

# All emails sent from the app appear here
# No configuration needed - just works!
```

**Features:**
- View all sent emails
- Test email templates
- Check attachments
- No emails actually sent to real addresses

---

## Useful Commands

### Docker Compose
```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (clean slate)
docker compose -f docker-compose.dev.yml down -v

# View logs
docker compose -f docker-compose.dev.yml logs -f

# View logs for specific service
docker compose -f docker-compose.dev.yml logs -f postgres

# Restart a service
docker compose -f docker-compose.dev.yml restart redis

# Check service health
docker compose -f docker-compose.dev.yml ps

# Execute command in container
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres
```

### Docker
```bash
# View all containers
docker ps -a

# View container logs
docker logs demi-postgres -f --tail=100

# Execute command in container
docker exec -it demi-postgres sh

# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 5432
lsof -i :5432
# or
netstat -tuln | grep 5432

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Host:Container
```

### Container Won't Start
```bash
# View container logs
docker logs demi-postgres

# Check container status
docker inspect demi-postgres

# Restart container
docker restart demi-postgres

# Remove and recreate
docker compose -f docker-compose.dev.yml up -d --force-recreate postgres
```

### Can't Connect to Database
```bash
# 1. Check container is running
docker ps | grep postgres

# 2. Check health
docker inspect demi-postgres | grep Health

# 3. Test connection
docker exec demi-postgres pg_isready -U postgres

# 4. Check logs
docker logs demi-postgres --tail=50

# 5. Try connecting
psql -h localhost -U postgres -d demi_db
```

### Reset Everything
```bash
# Stop and remove everything
docker compose -f docker-compose.dev.yml down -v

# Remove all volumes
docker volume rm $(docker volume ls -q | grep demi)

# Start fresh
docker compose -f docker-compose.dev.yml up -d
```

---

## Data Persistence

### Volumes
Data is persisted in Docker volumes:

```bash
# List volumes
docker volume ls | grep demi

# Inspect volume
docker volume inspect demi-backend_postgres_data

# Backup volume
docker run --rm -v demi-backend_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v demi-backend_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

### Database Backups
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
docker exec demi-postgres pg_dump -U postgres demi_db | gzip > $BACKUP_DIR/demi_db_$TIMESTAMP.sql.gz

# Keep only last 7 backups
ls -t $BACKUP_DIR/demi_db_*.sql.gz | tail -n +8 | xargs rm -f
```

---

## Production Deployment

### 1. Build Production Image
```bash
docker build -f Dockerfile.prod -t demi-backend:latest .
```

### 2. Push to Registry
```bash
# Tag image
docker tag demi-backend:latest your-registry.com/demi-backend:latest

# Push
docker push your-registry.com/demi-backend:latest
```

### 3. Deploy
```bash
# On production server
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 4. Health Check
```bash
curl http://localhost:3000/api/v1/health
```

---

## Best Practices

1. **Never commit `.env`** - Keep secrets in environment
2. **Use `.env.example`** - Document required variables
3. **Named volumes** - For data persistence
4. **Health checks** - Monitor service health
5. **Non-root user** - Run app as non-root in production
6. **Multi-stage builds** - Smaller production images
7. **Version pins** - Use specific image versions (postgres:16, not postgres:latest)
8. **Backup regularly** - Automate database backups
9. **Monitor logs** - Set up log aggregation
10. **Resource limits** - Set memory/CPU limits in production

---

## Monitoring

### Docker Stats
```bash
# View resource usage
docker stats

# Specific container
docker stats demi-postgres
```

### Health Checks
```bash
# Check all services
docker compose -f docker-compose.dev.yml ps

# Check app health
curl http://localhost:3000/api/v1/health

# Check database
docker exec demi-postgres pg_isready -U postgres
```

---

## Next Steps

1. ✅ Start Docker services: `docker compose -f docker-compose.dev.yml up -d`
2. ✅ Copy `.env.example` to `.env`
3. ✅ Run migrations: `pnpm run migration:run`
4. ✅ Start app: `pnpm run start:dev`
5. ✅ Access Swagger: http://localhost:3000/api/docs
6. ✅ Test email: http://localhost:8025
7. ✅ Upload files: http://localhost:9001 (MinIO)

**Happy coding!** 🚀
