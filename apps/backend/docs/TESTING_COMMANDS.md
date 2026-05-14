# Quick Testing Commands Reference

## 🚀 One-Command Testing (Recommended)

```bash
# Run complete automated test suite
pnpm test:auto
# OR
./scripts/run-all-tests.sh
```

**What it does:**
- ✅ Starts test database (PostgreSQL + Redis)
- ✅ Checks database health
- ✅ Runs all E2E tests
- ✅ Generates coverage reports
- ✅ Shows summary

---

## 🗄️ Database Commands

```bash
# Start test database
pnpm test:db:up

# Stop test database
pnpm test:db:down

# Stop and clean all data
pnpm test:db:clean

# Check database status
docker ps | grep demi-postgres-test
```

---

## 🧪 Test Execution Commands

```bash
# Run all E2E tests
pnpm test:e2e

# Run with coverage
pnpm test:e2e:cov

# Run in watch mode (auto-rerun on changes)
pnpm test:e2e:watch

# Run specific test file
pnpm test:e2e auth.e2e-spec

# Run with verbose output
pnpm test:e2e -- --verbose

# Run in debug mode
pnpm test:e2e:debug
```

---

## 📊 Coverage Commands

```bash
# Generate coverage report
pnpm test:e2e:cov

# View coverage in browser
open coverage/e2e/lcov-report/index.html

# Check coverage summary
cat coverage/e2e/lcov.info | head -20
```

---

## 📦 Postman Testing

```bash
# Generate Postman collection
pnpm postman:generate

# Run with Newman (Postman CLI)
npx newman run postman-collection.json

# Run with HTML report
npx newman run postman-collection.json -r html --reporter-html-export report.html
```

---

## 🔍 Debugging Commands

```bash
# View test database logs
docker logs demi-postgres-test -f

# Connect to test database
docker exec -it demi-postgres-test psql -U test -d demi_test

# View Redis logs
docker logs demi-redis-test -f

# Connect to Redis CLI
docker exec -it demi-redis-test redis-cli

# Check test environment variables
cat .env.test
```

---

## 🏃 Quick Workflows

### First Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start test database
pnpm test:db:up

# 3. Wait a moment
sleep 5

# 4. Run tests
pnpm test:e2e
```

### Daily Development

```bash
# Start database once (in background)
pnpm test:db:up

# Run tests in watch mode
pnpm test:e2e:watch

# When done for the day
pnpm test:db:down
```

### Before Commit

```bash
# Run full automated suite
pnpm test:auto

# If all pass, commit!
git add .
git commit -m "Your message"
```

### CI/CD Pipeline

```bash
# Full test suite with coverage
pnpm test:db:up
sleep 5
pnpm test:e2e:cov
pnpm test:db:clean
```

---

## 📝 Test Writing Commands

```bash
# Create new test file
touch test/e2e/my-module.e2e-spec.ts

# Run only your new test
pnpm test:e2e my-module.e2e-spec

# Run in watch mode while developing
pnpm test:e2e:watch my-module.e2e-spec
```

---

## 🆘 Troubleshooting

```bash
# Database won't start
docker compose -f docker-compose.test.yml down -v
docker compose -f docker-compose.test.yml up -d

# Port already in use
lsof -i :5433
# Kill the process or change port in docker-compose.test.yml

# Tests fail with connection error
docker compose -f docker-compose.test.yml ps
docker compose -f docker-compose.test.yml logs

# Clear Jest cache
pnpm test:e2e -- --clearCache

# Rebuild everything
pnpm test:db:clean
pnpm install
pnpm test:db:up
sleep 5
pnpm test:e2e
```

---

## 💡 Pro Tips

```bash
# Run only failed tests from last run
pnpm test:e2e -- --onlyFailures

# Run tests matching pattern
pnpm test:e2e -- --testNamePattern="should create"

# Run with maximum workers (faster)
pnpm test:e2e -- --maxWorkers=4

# Run silently (only show failures)
pnpm test:e2e -- --silent

# Generate JSON report
pnpm test:e2e -- --json --outputFile=test-results.json
```

---

## 📚 More Information

- [API Testing Guide](./API_TESTING_GUIDE.md) - Comprehensive testing guide
- [Testing Quick Start](./TESTING_QUICK_START.md) - Detailed setup guide
- [Testing Strategy](./TESTING_STRATEGY.md) - Full testing strategy

---

**Need help?** Check the [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
