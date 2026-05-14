# SSH Guide — Demigod VPS

> Your local machine: Linux
> Your existing keys: `bevarc_server`, `bev_id_ed25519`, `id_ed25519`, `id_rsa`
> Goal: Clean, named key for Demigod VPS only

---

## Part 1 — Create a Dedicated Key for This VPS

Always create a separate key per server. If one key is compromised, others are safe.

```bash
# Generate a new ed25519 key named specifically for demigod vps
ssh-keygen -t ed25519 -C "demigod-vps" -f ~/.ssh/demigod_vps

# It will ask for a passphrase — SET ONE (extra security layer)
# You'll only type it once per session if using ssh-agent
```

This creates two files:
```
~/.ssh/demigod_vps        ← private key (never share, never commit)
~/.ssh/demigod_vps.pub    ← public key (this goes on the server)
```

---

## Part 2 — Add to SSH Config

Your config file is at `~/.ssh/config`. Add this block:

```bash
# Open config
nano ~/.ssh/config
```

Add at the top (replace values with your actual VPS details):

```
Host demigod
  Hostname YOUR_VPS_IP
  Port 2222
  User deploy
  IdentityFile ~/.ssh/demigod_vps
  IdentitiesOnly yes
```

**What each line does:**
- `Host demigod` — the alias you type (`ssh demigod` instead of full command)
- `Hostname` — your VPS IP or domain
- `Port 2222` — your SSH port (change default 22 → 2222 later in Part 5)
- `User deploy` — the non-root user you create on VPS
- `IdentityFile` — use ONLY this key for this host
- `IdentitiesOnly yes` — don't try other keys, only use specified one

**After adding, your full config looks like:**
```
Host demigod
  Hostname YOUR_VPS_IP
  Port 2222
  User deploy
  IdentityFile ~/.ssh/demigod_vps
  IdentitiesOnly yes

Host bevarc-web
  Hostname 145.79.211.4
  Port 65002
  User u619146027
  IdentityFile ~/.ssh/bevarc_server

Host bevarc
  Hostname 31.97.224.234
  Port 22
  User root

Host server2
  Hostname 172.16.249.6
  Port 22
  User dheeraj

Host serverBevarcOld
  Hostname 82.112.227.224
  Port 22
  User dheeraj
```

---

## Part 3 — Upload Key to VPS (First Time Setup)

### Step 1: Get your public key content
```bash
cat ~/.ssh/demigod_vps.pub
# Copy the entire output — starts with: ssh-ed25519 AAAA...
```

### Step 2: Add via Hostinger Panel (Safest First Method)
1. Go to Hostinger VPS panel
2. Find **SSH Keys** section
3. Paste the content of `demigod_vps.pub`
4. Save — it gets added to root's `authorized_keys` automatically

### Step 3: First login as root (Hostinger sets root initially)
```bash
# Before your config is set up, use full command
ssh -i ~/.ssh/demigod_vps root@YOUR_VPS_IP

# After config is set up (Port 22 initially, change later to 2222)
ssh demigod
```

---

## Part 4 — Server Initial Setup (Run Once After First Login)

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Create non-root user
adduser deploy
usermod -aG sudo deploy

# 3. Copy root's authorized_keys to deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 4. Test deploy user login (open NEW terminal, don't close current one yet)
# On your local machine:
ssh demigod   # Should log in as deploy now

# 5. Only after confirming deploy works — continue with hardening
```

---

## Part 5 — Harden SSH on Server

**Do this after confirming deploy user login works.**

```bash
# Login as deploy, then:
sudo nano /etc/ssh/sshd_config
```

Find and change these lines (use Ctrl+W to search):

```
Port 2222                        # Change from 22
PermitRootLogin no               # Disable root login
PasswordAuthentication no        # Keys only, no passwords
MaxAuthTries 3                   # Lock after 3 failed attempts
PubkeyAuthentication yes         # Ensure key auth is on
AuthorizedKeysFile .ssh/authorized_keys
X11Forwarding no                 # Not needed, disable
AllowTcpForwarding no            # Disable unless you need tunneling
```

```bash
# Save file, then restart SSH
sudo systemctl restart sshd

# Update Hostinger firewall: change SSH rule from port 22 → 2222
# Then test new port connection (NEW terminal):
ssh demigod   # Uses port 2222 from your config

# If it works — old root session can be closed
```

---

## Part 6 — Daily Usage Commands

```bash
# Connect to VPS
ssh demigod

# Copy file TO server
scp localfile.txt demigod:/home/deploy/

# Copy file FROM server
scp demigod:/home/deploy/file.txt ./

# Copy entire folder to server
scp -r ./myfolder demigod:/home/deploy/

# Run command without logging in (one-liner)
ssh demigod "docker ps"
ssh demigod "docker compose -f /app/docker-compose.prod.yml logs --tail=50"

# Forward remote port to local (access Portainer safely)
ssh -L 9000:localhost:9000 demigod
# Then open http://localhost:9000 in your browser
```

---

## Part 7 — Adding a New PC / New Key

### New PC, copy existing key (same key approach)
```bash
# On old PC — transfer private key to new PC
scp ~/.ssh/demigod_vps new-pc-user@new-pc-ip:~/.ssh/demigod_vps
scp ~/.ssh/demigod_vps.pub new-pc-user@new-pc-ip:~/.ssh/demigod_vps.pub

# On new PC — fix permissions
chmod 600 ~/.ssh/demigod_vps
chmod 644 ~/.ssh/demigod_vps.pub

# Add SSH config on new PC (same block as Part 2)
```

### New PC, new separate key (recommended)
```bash
# On NEW PC — generate new key
ssh-keygen -t ed25519 -C "demigod-vps-laptop" -f ~/.ssh/demigod_vps_laptop

# Show public key
cat ~/.ssh/demigod_vps_laptop.pub

# From OLD PC — add new key to server
ssh demigod
echo "PASTE_NEW_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# OR from old PC directly:
ssh-copy-id -i ~/.ssh/demigod_vps_laptop.pub demigod
```

---

## Part 8 — Revoke Access (Lost/Stolen PC)

```bash
# Login via another PC or Hostinger panel terminal
ssh demigod

# View all authorized keys (each line = one key)
cat ~/.ssh/authorized_keys

# Edit and delete the compromised key line
nano ~/.ssh/authorized_keys
# Find the line ending with the key comment (e.g. "demigod-vps-oldlaptop")
# Delete that entire line
# Save — access revoked immediately, no restart needed
```

---

## Part 9 — Emergency Recovery (Locked Out)

If you accidentally lock yourself out:

### Method 1: Hostinger Panel Terminal
1. Go to Hostinger VPS control panel
2. Open browser-based terminal / VNC console
3. Login as root via panel (bypasses SSH entirely)
4. Fix `sshd_config` or add your key back to `authorized_keys`

### Method 2: Hostinger Panel — Reset SSH
1. Some panels have "Reset SSH key" option
2. Upload your public key via panel UI again

### Method 3: Rescue Mode
1. Hostinger panel → Boot into rescue mode
2. Mount your disk
3. Edit `authorized_keys` or `sshd_config`
4. Reboot normally

**Recovery commands once you have root access:**
```bash
# Re-add your public key
echo "YOUR_PUBLIC_KEY" >> /home/deploy/.ssh/authorized_keys

# Fix SSH config back to working state
nano /etc/ssh/sshd_config
# Change Port back to 22 temporarily if needed
# Set PasswordAuthentication yes temporarily to get in

# Restart SSH
systemctl restart sshd
```

---

## Part 10 — Key Backup (Do This Now)

Your private key `demigod_vps` is irreplaceable if lost.

```bash
# View private key (to copy into password manager)
cat ~/.ssh/demigod_vps
```

**Store in at least one of:**
- Password manager (Bitwarden / 1Password — store as secure note)
- Encrypted USB drive stored safely
- Encrypted cloud note (NOT plain Google Drive / Notion)

**Never store private key in:**
- Git repositories
- Unencrypted cloud storage
- Chat apps / email

---

## Quick Reference Card

| Task | Command |
|------|---------|
| Connect to VPS | `ssh demigod` |
| Copy file to VPS | `scp file.txt demigod:/home/deploy/` |
| Copy file from VPS | `scp demigod:/home/deploy/file.txt ./` |
| Run remote command | `ssh demigod "command"` |
| Access Portainer locally | `ssh -L 9000:localhost:9000 demigod` |
| View your public key | `cat ~/.ssh/demigod_vps.pub` |
| View all authorized keys on server | `cat ~/.ssh/authorized_keys` |
| Add new PC key to server | `ssh-copy-id -i ~/.ssh/newkey.pub demigod` |
| Revoke a key | `nano ~/.ssh/authorized_keys` → delete line |
| Restart SSH on server | `sudo systemctl restart sshd` |
| Check SSH status | `sudo systemctl status sshd` |
| View SSH login attempts | `sudo journalctl -u sshd --since "1 hour ago"` |
| View failed login attempts | `sudo grep "Failed password" /var/log/auth.log` |

---

## Your Key Inventory

| Key File | Used For | Status |
|----------|----------|--------|
| `demigod_vps` | Demigod VPS only | New — active |
| `bevarc_server` | bevarc-web server | Existing |
| `bev_id_ed25519` | Bevarc related | Existing |
| `id_ed25519` | General / GitHub? | Existing |
| `id_rsa` | Legacy (old) | Consider retiring |

> `id_rsa` is RSA — older algorithm. If nothing critical depends on it, delete it and use ed25519 everywhere. ed25519 is faster, smaller, and more secure.
