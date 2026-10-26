# ST Constructions - Hostinger Deployment Guide

This application is built with a **Full-Stack Node.js + Express + React (Vite) + Tailwind CSS** architecture, engineered for deployment on **Hostinger** (both Hostinger hPanel Cloud/Node.js hosting and Hostinger VPS).

---

## Architecture Overview

```
├── server.js              # Production Express HTTP Server
├── server/
│   └── api.js             # Express API endpoints (/api/health, /api/enquiries)
├── dist/                  # Production-optimized React SPA build (generated via npm run build)
├── public/                # Static assets (logos, project renders, blueprints)
├── src/                   # React 19 + TypeScript frontend source
├── package.json           # Dependencies and build/start scripts
└── .env.example           # Environment configuration template
```

- **Frontend:** React 19 SPA with client-side routing.
- **Backend:** Node.js Express server (`server.js`) serving static production assets and REST endpoints (`/api/*`).
- **SPA Fallback:** All client routes (`/`, `/about`, `/projects`, `/projects/narayani-villas`, `/refer-a-friend`, etc.) are caught and served `dist/index.html` seamlessly without 404 errors on page reload.

---

## Option 1: Hostinger Cloud Hosting (hPanel Node.js Manager)

Hostinger's Cloud hosting plans include a built-in **Node.js Application Manager**.

### Step 1: Upload Files
1. In your local workspace or Git repository, run:
   ```bash
   npm run build
   ```
2. Upload the project files to your domain directory (e.g. `public_html` or a dedicated app directory):
   - Include: `package.json`, `package-lock.json` or `bun.lock`, `server.js`, `server/`, `dist/`, `public/`, and `.env`.
   - *Tip:* You can zip the folder, upload via Hostinger File Manager, and click **Extract**.

### Step 2: Configure in Hostinger hPanel
1. Navigate to **Websites** → Select your domain → **Node.js**.
2. Configure settings:
   - **Node.js Version:** Select **18.x** or **20.x** (LTS).
   - **Application Mode:** `Production`.
   - **Application Root:** `/public_html` (or your chosen directory).
   - **Application Startup File:** `server.js`.
3. Click **Save Changes**.

### Step 3: Install Dependencies & Run
1. Under the **NPM Operations** tab in hPanel:
   - Run: `npm install --omit=dev`
2. If building on the server:
   - Run: `npm run build`
3. Click **Restart Application**.
4. Test by opening `https://yourdomain.com` and `https://yourdomain.com/api/health`.

---

## Option 2: Hostinger VPS (Ubuntu / Debian + PM2 + Nginx)

For full server control, high concurrency, and automated SSL.

### Step 1: Install Node.js & PM2
Connect to your Hostinger VPS via SSH:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Install PM2 process manager
sudo npm install -g pm2
```

### Step 2: Clone & Build Application
```bash
cd /var/www
git clone <YOUR_GIT_REPO_URL> stconstructions
cd stconstructions

# Install dependencies and build frontend
npm install
npm run build
```

### Step 3: Configure Environment Variables
```bash
cp .env.example .env
nano .env
# Set PORT=3000, NODE_ENV=production, etc.
```

### Step 4: Start with PM2
```bash
# Start server process with automatic restarts
pm2 start server.js --name "st-constructions"

# Ensure PM2 starts on server reboot
pm2 startup
pm2 save
```

### Step 5: Configure Nginx Reverse Proxy
Edit `/etc/nginx/sites-available/stconstructions`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/stconstructions /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Install Free SSL Certificate (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Useful Verification Commands

- Check application status: `pm2 status`
- View live server logs: `pm2 logs st-constructions`
- Health endpoint: `curl http://localhost:3000/api/health`
