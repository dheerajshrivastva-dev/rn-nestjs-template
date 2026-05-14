# VPS Deployment Checklist

> **VPS Specs**: 1 CPU · 4GB RAM · 50GB NVMe
> **Stack**: NestJS + PostgreSQL 16 + Redis 7 + Nginx (Docker)
> **Last reviewed**: 2026-02-21

Mark each item `[x]` as you complete it.

---

## Phase 1 — Infra Setup

> Do this first. Everything else depends on a clean base.

### 1.1 OS & Initial Server

- [ ] Install **Ubuntu 24.04 LTS** (fresh install, no extra packages)
- [ ] Update system immediately after first login
  ```bash
  apt update && apt upgrade -y
  ```
- [ ] Create a non-root sudo user (never run as root day-to-day)
  ```bash
  adduser deploy
  usermod -aG sudo deploy
  ```
- [ ] Copy your SSH public key to the new user
  ```bash
  ssh-copy-id deploy@your-vps-ip
  ```

### 1.2 SSH Hardening

- [ ] Edit `/etc/ssh/sshd_config`:
  - [ ] `PermitRootLogin no`
  - [ ] `PasswordAuthentication no` (SSH keys only)
  - [ ] `Port 2222` (change default port)
  - [ ] `MaxAuthTries 3`
- [ ] Restart SSH: `systemctl restart sshd`
- [ ] **Verify new SSH port works before closing current session**

### 1.3 Firewall (UFW)

- [ ] Install and configure UFW
  ```bash
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 2222/tcp    # Your new SSH port
  ufw allow 80/tcp      # HTTP
  ufw allow 443/tcp     # HTTPS
  ufw enable
  ```
- [ ] Confirm no other ports are open: `ufw status verbose`
- [ ] Verify postgres (5432) and redis (6379) are NOT accessible from outside: `ss -tlnp`

### 1.4 Fail2ban

- [ ] Install: `apt install fail2ban -y`
- [ ] Enable SSH jail for your custom port in `/etc/fail2ban/jail.local`:
  ```ini
  [sshd]
  enabled = true
  port = 2222
  maxretry = 5
  bantime = 3600
  ```
- [ ] Start: `systemctl enable --now fail2ban`

### 1.5 Auto Security Updates

- [ ] Install: `apt install unattended-upgrades -y`
- [ ] Enable: `dpkg-reconfigure --priority=low unattended-upgrades`

### 1.6 Docker Installation

- [ ] Install Docker (official script, not snap):
  ```bash
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker deploy
  ```
- [ ] Install Docker Compose plugin: `apt install docker-compose-plugin -y`
- [ ] Verify: `docker run hello-world`

### 1.7 Server Panel

- [ ] **Coolify** (handles SSL, deployments, env vars, backups UI)
  ```bash
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
  ```
  - [ ] Access Coolify UI at `http://your-ip:8000`, complete setup
  - [ ] Configure your domain/SSL inside Coolify
  - [ ] Add your git repo as a source
- [ ] **Portainer CE** (Docker monitoring, logs, exec)
  ```bash
  docker volume create portainer_data
  docker run -d -p 9000:9000 --name portainer \
    --restart=always \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v portainer_data:/data \
    portainer/portainer-ce:latest
  ```
  - [ ] Access at `http://your-ip:9000`, set admin password
  - [ ] **Block port 9000 from public** — access via SSH tunnel only:
    ```bash
    ssh -L 9000:localhost:9000 deploy@your-vps -p 2222
    ```

### 1.8 Domain & SSL

- [ ] Point your domain A record to VPS IP
- [ ] Let Coolify (Caddy) handle SSL auto-renewal (or use Certbot with Nginx)
- [ ] Verify HTTPS works and HTTP redirects to HTTPS

---

## Phase 2 — Docker & App Hardening

> Fix the gaps in your current `docker-compose.prod.yml`.

### 2.1 Log Rotation

- [ ] Add `logging` config to **every service** in compose:
  ```yaml
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
  ```
  Apply to: `postgres`, `redis`, `app`, `nginx`

### 2.2 Remove Unnecessary Port Exposure

- [ ] Remove `"3000:3000"` from the `app` service (Nginx proxies it, no direct host exposure needed)
- [ ] Confirm postgres and redis have **no `ports:` section** (already done — keep it)

### 2.3 Resource Limits (Protect Against OOM)

- [ ] Add memory limits to prevent one service from killing others:
  ```yaml
  # app service
  deploy:
    resources:
      limits:
        memory: 1200m
      reservations:
        memory: 512m

  # postgres service
  deploy:
    resources:
      limits:
        memory: 1g
      reservations:
        memory: 512m

  # redis service
  deploy:
    resources:
      limits:
        memory: 600m
      reservations:
        memory: 256m
  ```

### 2.4 Fix Redis Eviction Policy

- [ ] Change `--maxmemory-policy allkeys-lru` → `--maxmemory-policy noeviction`
  - Current `allkeys-lru` will silently drop Bull queue jobs under memory pressure
  - `noeviction` errors instead of data loss (app can handle errors, not silent drops)

### 2.5 Run App as Non-Root

- [ ] Add `user: node` to `app` service in compose (if your Dockerfile supports it)
- [ ] Or add in Dockerfile.prod: `USER node` before `CMD`

### 2.6 Postgres Tuning for 4GB RAM

- [ ] Add postgres config via environment or mounted `postgresql.conf`:
  ```yaml
  environment:
    POSTGRES_SHARED_BUFFERS: "256MB"
    POSTGRES_EFFECTIVE_CACHE_SIZE: "768MB"
    POSTGRES_WORK_MEM: "4MB"
    POSTGRES_MAX_CONNECTIONS: "50"
  ```

### 2.7 Nginx Hardening

- [ ] Confirm Nginx `nginx.conf` has:
  - [ ] `server_tokens off;` (hide Nginx version)
  - [ ] Rate limiting on auth endpoints (`limit_req_zone`)
  - [ ] `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` headers
  - [ ] SSL: TLS 1.2+ only, strong ciphers
  - [ ] `client_max_body_size` set appropriately

### 2.8 Environment & Secrets

- [ ] `.env` file is **not committed to git** (check `.gitignore`)
- [ ] `.env` file has restricted permissions: `chmod 600 .env`
- [ ] All secrets are strong random strings (use `openssl rand -hex 32` for JWT_SECRET, REDIS_PASSWORD etc.)
- [ ] No default/weak passwords anywhere

---

## Phase 3 — Backup & Disaster Recovery

> Your single biggest risk is data loss. This phase protects against it.

### 3.1 Remote Storage Setup

- [ ] Create a **Backblaze B2** account (cheapest: ~$0.006/GB/month)
  - [ ] Create a bucket: `demi-backups`
  - [ ] Create an application key with write-only access to that bucket
- [ ] **Alternative**: AWS S3 (already have credentials in your env)
  - [ ] Create a dedicated `demi-backups` S3 bucket
  - [ ] Create an IAM user with S3-only write access (least privilege)

### 3.2 Automated PostgreSQL Backups

- [ ] Create backup script at `/home/deploy/scripts/pg-backup.sh`:
  ```bash
  #!/bin/bash
  set -e
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="/tmp/db_backup_${TIMESTAMP}.sql.gz"

  # Dump and compress
  docker exec demi-postgres-prod pg_dump -U $DB_USERNAME $DB_DATABASE \
    | gzip > "$BACKUP_FILE"

  # Upload to S3/B2
  aws s3 cp "$BACKUP_FILE" "s3://demi-backups/postgres/${TIMESTAMP}.sql.gz"

  # Cleanup local temp file
  rm "$BACKUP_FILE"

  echo "Backup completed: ${TIMESTAMP}"
  ```
- [ ] Make executable: `chmod +x /home/deploy/scripts/pg-backup.sh`
- [ ] Add cron job (runs at 2AM daily):
  ```bash
  crontab -e
  # Add:
  0 2 * * * /home/deploy/scripts/pg-backup.sh >> /var/log/pg-backup.log 2>&1
  ```
- [ ] Test manually: `bash /home/deploy/scripts/pg-backup.sh`
- [ ] Verify backup appears in S3/B2

### 3.3 Backup Retention Policy

- [ ] Add cleanup to keep only last 14 daily backups:
  ```bash
  # In pg-backup.sh, add after upload:
  aws s3 ls s3://demi-backups/postgres/ \
    | sort \
    | head -n -14 \
    | awk '{print $4}' \
    | xargs -I{} aws s3 rm s3://demi-backups/postgres/{}
  ```

### 3.4 Backup Monitoring

- [ ] Verify backup log after first week: `tail -20 /var/log/pg-backup.log`
- [ ] Set up a dead man's switch: use [Healthchecks.io](https://healthchecks.io) (free tier)
  - Add a `curl` ping at end of backup script so you get alerted if backup stops running

### 3.5 VPS Snapshot

- [ ] Enable **weekly VPS snapshots** from your provider's control panel (Hetzner/DO/Vultr etc.)
  - This captures the entire disk including Docker volumes
  - Keep last 2 snapshots

### 3.6 Restore Test (Critical)

- [ ] Do a test restore within first month:
  ```bash
  # Download backup
  aws s3 cp s3://demi-backups/postgres/latest.sql.gz /tmp/restore.sql.gz

  # Restore to a test container
  gunzip -c /tmp/restore.sql.gz | docker exec -i demi-postgres-prod psql -U $DB_USERNAME $DB_DATABASE
  ```
- [ ] **A backup you've never restored is not a backup.**

---

## Phase 4 — Security Hardening

### 4.1 Application Security

- [ ] `DB_SYNC: false` in prod (already done — keep it)
- [ ] JWT secrets are > 32 chars random strings
- [ ] CORS is restricted to your actual frontend domain (not `*`)
- [ ] Rate limiting is enabled on auth endpoints in NestJS
- [ ] Helmet.js is enabled in NestJS (`app.use(helmet())`)
- [ ] No sensitive data in logs (passwords, tokens, PII)

### 4.2 Dependency Security

- [ ] Run `npm audit` (or `pnpm audit`) and fix high/critical issues before deploy
- [ ] Pin Docker image versions (already using `postgres:16-alpine`, `redis:7-alpine` — good)
- [ ] Set up **Dependabot** or **Renovate** on your git repo for automated dependency PRs

### 4.3 Container Security

- [ ] No `--privileged` flag on any container
- [ ] No sensitive files bind-mounted (e.g. avoid `- /etc:/etc`)
- [ ] Docker socket not exposed to app container
- [ ] `.env` file not mounted into containers — use `env_file` or Coolify env vars

### 4.4 Network Security

- [ ] Only `nginx` is in the public network; all others are internal-only
- [ ] Consider adding `internal: true` to `demi-network` and a separate public network for nginx only:
  ```yaml
  networks:
    demi-network:
      driver: bridge
      internal: true      # postgres, redis, app — no internet access
    public-network:
      driver: bridge      # nginx only
  ```

### 4.5 Monitoring & Alerting

- [ ] Enable Docker health check alerts (Portainer can notify via email/Slack)
- [ ] Monitor disk usage — alert at 80%:
  ```bash
  # Add to crontab:
  0 * * * * df -h / | awk 'NR==2 {if ($5+0 > 80) print "Disk usage: "$5}' | mail -s "Disk Alert" you@email.com
  ```
- [ ] Monitor memory: consider `ctop` for real-time container stats (`apt install ctop`)

---

## Phase 5 — Go-Live Verification

- [ ] All environment variables are set in production `.env`
- [ ] `docker compose -f docker-compose.prod.yml up -d` runs without errors
- [ ] All containers show `healthy` status: `docker ps`
- [ ] API health endpoint responds: `curl https://yourdomain.com/api/v1/health`
- [ ] HTTPS certificate is valid (green padlock)
- [ ] HTTP redirects to HTTPS
- [ ] Auth flow works end-to-end (login → JWT → protected route)
- [ ] File uploads work (S3 connection)
- [ ] Email sending works (SMTP connection)
- [ ] Push notifications work (FCM)
- [ ] WebSocket connection works (if applicable)
- [ ] First manual backup completed and verified

---

## Quick Reference — RAM Budget (4GB)

| Service | Reserved | Limit |
|---------|----------|-------|
| OS + Docker daemon | ~400MB | — |
| Coolify | ~400MB | — |
| Portainer | ~50MB | — |
| Nginx | ~50MB | 200MB |
| PostgreSQL | 512MB | 1GB |
| Redis | 256MB | 600MB |
| NestJS App | 512MB | 1.2GB |
| **Total** | **~2.2GB** | **~3.5GB** |
| **Headroom** | **~500MB** | — |

---

## Tools Summary

| Tool | Purpose | Install |
|------|---------|---------|
| UFW | Firewall | `apt install ufw` |
| Fail2ban | Brute force protection | `apt install fail2ban` |
| Coolify | Deploy panel + SSL + backups | Script install |
| Portainer CE | Docker UI + monitoring | Docker run |
| ctop | Real-time container stats | `apt install ctop` |
| Healthchecks.io | Backup job monitoring | Free SaaS |
| Backblaze B2 / S3 | Remote backup storage | Cloud |
