# SSH Access

## Generate a Key Pair

```bash
ssh-keygen -t ed25519 -C "deploy@yourapp" -f ~/.ssh/yourapp_deploy
```

## Copy Public Key to Server

```bash
ssh-copy-id -i ~/.ssh/yourapp_deploy.pub user@your-server-ip
```

Or manually append to `~/.ssh/authorized_keys` on the server.

## Connect

```bash
ssh -i ~/.ssh/yourapp_deploy user@your-server-ip
```

Add to `~/.ssh/config` for convenience:

```
Host yourapp
  HostName your-server-ip
  User ubuntu
  IdentityFile ~/.ssh/yourapp_deploy
  ServerAliveInterval 60
```

Then: `ssh yourapp`

## Harden SSH (on server)

Edit `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
```

Restart: `sudo systemctl restart sshd`

## Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw allow 80
sudo ufw allow 443
```
