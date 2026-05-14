# VPS Deployment Checklist

## Server Prep

- [ ] Ubuntu 22.04+ or Debian 12+
- [ ] SSH key auth, password auth disabled (`PasswordAuthentication no`)
- [ ] Non-root user with sudo
- [ ] Firewall: allow 22, 80, 443 — block everything else (`ufw enable`)
- [ ] `docker` + `docker compose` installed
- [ ] `certbot` or reverse proxy (Nginx/Caddy/Coolify) installed

## Environment

- [ ] `.env` file in place with all required vars (see [ENV_VARS.md](../setup/ENV_VARS.md))
- [ ] `NODE_ENV=production`
- [ ] `DB_SYNC=false`
- [ ] Strong, unique `JWT_SECRET`, `JWT_REFRESH_SECRET`, `AES_SECRET_KEY` (min 32 chars)
- [ ] `CORS_ORIGINS` set to your frontend domain
- [ ] `SWAGGER_ALLOWED_IPS` set (restrict Swagger to office/VPN IPs, or leave empty to disable)

## Database

- [ ] PostgreSQL running and accessible
- [ ] Database created, credentials match `.env`
- [ ] Migrations applied (`pnpm --filter forge-backend migration:run`)
- [ ] Database backups configured (daily minimum)

## Redis

- [ ] Redis running and accessible
- [ ] `REDIS_PASSWORD` set (not empty in production)

## App

- [ ] Docker image builds successfully
- [ ] Container starts and health check passes (`GET /api/v1/health`)
- [ ] `DB_MIGRATIONS_RUN=true` OR manual migration run before first deploy
- [ ] Logs shipping to a persistent location

## TLS

- [ ] SSL certificate issued and auto-renewing
- [ ] HTTP → HTTPS redirect configured
- [ ] `secure: true` on cookies (enforced when `NODE_ENV=production`)

## Email / SMS / Push

- [ ] Email provider configured and test email sent
- [ ] SMS provider configured (if using OTP via SMS)
- [ ] FCM service account configured (if using push notifications)

## Monitoring

- [ ] Uptime monitoring set up (e.g., Better Uptime, UptimeRobot)
- [ ] Error alerting configured
- [ ] Disk space alerts configured

## Post-Deploy

- [ ] `GET /api/v1/health` returns healthy
- [ ] Login flow works end-to-end
- [ ] Email delivery confirmed
- [ ] Swagger accessible only from allowed IPs (or disabled)
