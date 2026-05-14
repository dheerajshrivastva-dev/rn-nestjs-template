-- Initial database setup script
-- This runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For faster text search

-- Create database if it doesn't exist (optional, as docker-compose creates it)
-- SELECT 'CREATE DATABASE demi_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'demi_db')\gexec

-- Set timezone
SET timezone = 'Asia/Kolkata';

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully at %', NOW();
END $$;
