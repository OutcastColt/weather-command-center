# RGVIG Local Dev VM Setup Guide

**Standard: VirtualBox + Ubuntu Server 22.04 LTS**

This guide sets up a consistent local Linux environment that mirrors production. Every developer on the team should follow these steps before testing any code.

---

## Prerequisites

- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) installed on Windows
- [Ubuntu Server 22.04 LTS ISO](https://ubuntu.com/download/server) downloaded

---

## 1. VM Creation

1. Open VirtualBox and click **New**.
2. Set the following:
   - **Name:** `rgvig-dev` (or your preference)
   - **Type:** Linux
   - **Version:** Ubuntu (64-bit)
3. **Memory:** At least 1024 MB (2048 MB recommended).
4. **Hard disk:** Create a virtual hard disk — 20 GB, VDI, dynamically allocated.
5. Click **Create**.

### Attach the ISO

1. Select the VM → **Settings** → **Storage**.
2. Under **Controller: IDE**, click the empty disc icon.
3. Click the disc icon on the right → **Choose a disk file** → select your Ubuntu ISO.
4. Click **OK**.

### Install Ubuntu Server

1. Start the VM.
2. Follow the Ubuntu installer prompts:
   - Language: English
   - Keyboard: match your layout
   - Network: leave default (will be replaced by Host-Only in step 3)
   - Storage: use the entire disk (default)
   - Profile: set your username, server name (`rgvig-dev`), and password
   - **OpenSSH server:** select **Install OpenSSH server** ✓
3. Wait for installation to complete, then remove the ISO and reboot.

---

## 2. Web Server — Nginx

Once the VM is running and you are logged in:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify Nginx is running:

```bash
sudo systemctl status nginx
```

The default web root is `/var/www/html`. You can verify locally inside the VM with:

```bash
curl http://localhost
```

---

## 3. Networking — Host-Only Adapter

The Host-Only Adapter gives the VM a static IP reachable from your Windows browser without exposing it to the wider network.

### In VirtualBox

1. **File** → **Host Network Manager** → click **Create** if no host-only network exists (e.g., `vboxnet0` / `VirtualBox Host-Only Ethernet Adapter`). Note the IPv4 address range shown (typically `192.168.56.0/24`).
2. Select your VM → **Settings** → **Network**.
3. **Adapter 1** — keep as NAT (for internet access inside the VM).
4. **Adapter 2** — enable it:
   - Attached to: **Host-only Adapter**
   - Name: select the adapter created above.
5. Click **OK** and start/restart the VM.

### Inside the VM — assign a static IP

Find the new interface name:

```bash
ip link show
# Look for enp0s8 or similar (not enp0s3 which is NAT)
```

Edit Netplan (Ubuntu 22.04 uses Netplan):

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Add the host-only interface (replace `enp0s8` with your interface name):

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true          # NAT adapter — internet
    enp0s8:
      dhcp4: no
      addresses:
        - 192.168.56.199/24  # Static IP on host-only network
```

Apply the config:

```bash
sudo netplan apply
```

Verify the IP is assigned:

```bash
ip addr show enp0s8
```

From your Windows host, open a browser and go to `http://192.168.56.199` — you should see the Nginx welcome page.

---

## 4. File Deployment

Choose one of the following methods to push site files to the VM.

### Option A — SCP (recommended for one-off deploys)

From your Windows terminal (Git Bash, WSL, or PowerShell with OpenSSH):

```bash
scp -r ./your-site-folder/ username@192.168.56.199:/var/www/html/
```

Fix permissions if needed:

```bash
ssh username@192.168.56.199 "sudo chown -R www-data:www-data /var/www/html"
```

### Option B — Shared Folder (VirtualBox Guest Additions)

1. Install Guest Additions inside the VM:

```bash
sudo apt install -y virtualbox-guest-utils
sudo reboot
```

2. In VirtualBox → **Settings** → **Shared Folders** → add a folder from your Windows host, check **Auto-mount** and **Make Permanent**.
3. After reboot, the folder appears at `/media/sf_<foldername>`.
4. Add your user to the `vboxsf` group:

```bash
sudo usermod -aG vboxsf $USER
# Log out and back in for the group to take effect
```

### Option C — Local Git Pull

On the VM, clone your repo and pull updates when ready:

```bash
cd /var/www/html
sudo git clone https://github.com/your-org/your-repo.git .
# To update later:
sudo git pull
```

---

## 5. Testing — Access from Windows Browser

1. Make sure the VM is running and Nginx is active.
2. On your Windows host, open any browser.
3. Navigate to `http://192.168.56.199` (or the static IP you assigned).
4. You should see your deployed site.

**Troubleshooting:**

| Problem | Fix |
|---|---|
| Browser times out | Check the Host-Only Adapter is enabled in VM settings |
| `curl` works inside VM but browser fails | Confirm Windows Firewall is not blocking VirtualBox host-only adapter |
| 403 Forbidden | Check file permissions: `sudo chown -R www-data:www-data /var/www/html` |
| Nginx not running | `sudo systemctl restart nginx` |

---

## 6. Snapshots — Safe Testing Workflow

Snapshots let you roll back the VM to a known-good state instantly.

### Take a snapshot (before risky changes)

1. With the VM running (or powered off), go to **Machine** → **Take Snapshot**.
2. Give it a descriptive name, e.g., `clean-nginx-working` or `before-config-change`.

### Restore a snapshot

1. Power off the VM.
2. In VirtualBox Manager, select the VM → click the list icon → **Snapshots** tab.
3. Select the snapshot you want → click **Restore**.

### Recommended snapshot points

- After completing this guide (clean baseline)
- Before installing new packages or changing Nginx config
- Before any major file deployment to `/var/www/html`

---

## Quick-Reference Cheat Sheet

```bash
# SSH into VM from Windows
ssh username@192.168.56.199

# Restart Nginx
sudo systemctl restart nginx

# Deploy files via SCP
scp -r ./dist/ username@192.168.56.199:/var/www/html/

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check VM IP
ip addr show enp0s8
```

---

*Approved in [RGV-74](/RGV/issues/RGV-74). For questions or updates, file a new issue in the RGV project.*
