#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║         Demigod API Automated Test Suite                  ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if test database is running
echo -e "${YELLOW}[1/6] Checking test database...${NC}"
if ! docker ps | grep -q demi-postgres-test; then
  echo -e "${YELLOW}Test database not running. Starting...${NC}"
  docker compose -f docker-compose.test.yml up -d
  echo -e "${GREEN}✓ Test database started${NC}"

  # Wait for database to be ready
  echo -e "${YELLOW}Waiting for database to be ready...${NC}"
  sleep 5
else
  echo -e "${GREEN}✓ Test database already running${NC}"
fi

# Check database health
echo -e "${YELLOW}[2/6] Verifying database health...${NC}"
if docker exec demi-postgres-test pg_isready -U test > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Database is healthy${NC}"
else
  echo -e "${RED}✗ Database health check failed${NC}"
  exit 1
fi

# Check Redis health
echo -e "${YELLOW}[3/6] Verifying Redis health...${NC}"
if docker exec demi-redis-test redis-cli ping > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Redis is healthy${NC}"
else
  echo -e "${RED}✗ Redis health check failed${NC}"
  exit 1
fi

# Install dependencies if needed
echo -e "${YELLOW}[4/6] Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  pnpm install
  echo -e "${GREEN}✓ Dependencies installed${NC}"
else
  echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Run E2E tests
echo -e "${YELLOW}[5/6] Running E2E tests...${NC}"
echo ""

# Create test reports directory
mkdir -p test-reports

# Run tests with coverage
NODE_ENV=test pnpm test:e2e --coverage --reporters=default --reporters=jest-junit

TEST_EXIT_CODE=$?

# Generate test report
echo ""
echo -e "${YELLOW}[6/6] Test Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
else
  echo -e "${RED}✗ Some tests failed${NC}"
fi

echo ""
echo -e "${BLUE}Test Reports:${NC}"
echo "  Coverage: coverage/e2e/lcov-report/index.html"
echo ""

# Ask if user wants to stop the test database
echo -e "${YELLOW}Do you want to stop the test database? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
  docker compose -f docker-compose.test.yml down
  echo -e "${GREEN}✓ Test database stopped${NC}"
else
  echo -e "${BLUE}Test database is still running. Stop it with:${NC}"
  echo "  docker compose -f docker-compose.test.yml down"
fi

exit $TEST_EXIT_CODE
