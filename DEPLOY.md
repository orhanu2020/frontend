# Deploying the frontend on a VPS

## Run like on your local machine (no Docker, no build step)

To run the app on the VPS the same way as locally (dev server with `npm start`).

### Install Node.js and npm on the VPS

If the VPS doesn’t have Node/npm, install them first (Node 18+).

**Ubuntu / Debian** (NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # e.g. v20.x
npm -v
```

**Or with nvm** (no sudo, any Linux):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # or close and reopen the terminal
nvm install 20
nvm use 20
node -v && npm -v
```

### Run the app

1. **Copy the project** to the VPS (git clone, scp, rsync, etc.), then install dependencies:
   ```bash
   cd /path/to/frontend
   npm install
   ```

2. **Set the API URL** – on the VPS, edit **`public/config.js`** and set `window.__API_BASE_URL__ = 'http://YOUR_VPS_IP:8080/api/v1';` (use your VPS IP). No restart needed; just refresh the browser. Or use `.env` with `REACT_APP_API_URL=...` and restart the app.

3. **Start the app** so it listens on all interfaces (not only localhost):
   ```bash
   HOST=0.0.0.0 npm start
   ```
   The app will be available at `http://your-vps-ip:3000`.

4. **Keep it running** after you disconnect (e.g. with PM2):
   ```bash
   npm install -g pm2
   HOST=0.0.0.0 pm2 start "npm start" --name frontend
   pm2 save && pm2 startup   # optional: run on reboot
   ```

To stop: `pm2 stop frontend`. To view logs: `pm2 logs frontend`.

### "Network Error" when searching (frontend + backend on same VPS)

If you see **"Tweet search: Network Error; User search: Network Error"**, the browser cannot reach your backend. The frontend runs in the **user’s browser**, so API requests are made from the user’s machine. If `REACT_APP_API_URL` is `http://localhost:8080/api/v1`, the browser tries to call **your own PC**, not the VPS.

**Fix (easiest – no restart needed):**

1. **Edit `public/config.js` on the VPS** and set your backend URL. This file is loaded in the browser on every page load, so **no restart or rebuild** is needed:
   ```javascript
   window.__API_BASE_URL__ = 'http://75.119.146.174:8080/api/v1';   // use your VPS IP
   ```
   Replace `75.119.146.174` with your VPS IP (or domain). Save the file and **refresh the browser** (Ctrl+Shift+R). The app will then call the backend on the VPS.

**Alternative (using `.env`):**

2. Use the VPS address in **`.env`** (file must be named exactly `.env` in the project root):
   ```bash
   REACT_APP_API_URL=http://YOUR_VPS_IP:8080/api/v1
   ```
   Then **restart the frontend** (e.g. `pm2 restart frontend`); CRA only reads `.env` at startup.

3. **Ensure the backend listens on all interfaces** (see below).

4. **Open port 8080** on the VPS firewall if you use a firewall (e.g. `sudo ufw allow 8080` then `sudo ufw reload`).

#### How to check and fix “listen on all interfaces”

- **127.0.0.1** (localhost) = only this machine can connect. Requests from the internet (or from the browser) will not reach the app.
- **0.0.0.0** = listen on every network interface, so the app can be reached via the VPS IP or domain.

**Check with Postman (from your PC):**

1. In Postman, send a GET to `http://YOUR_VPS_IP:8080/api/v1/...` (e.g. `http://YOUR_VPS_IP:8080/api/v1/monitoring/entries` or any endpoint your backend has).
2. **If you get a response** (200, 401, 404, etc.) → the backend is reachable from outside (listening on all interfaces and port open).
3. **If you get "Connection refused" or timeout** → the backend is likely only on `127.0.0.1`, or the firewall is blocking port 8080.

**Check what is listening (on the VPS):**

```bash
# Linux: show what listens on port 8080 (use your backend port if different)
ss -tlnp | grep 8080
# or
sudo lsof -i :8080
```

- If you see `127.0.0.1:8080` or `localhost:8080` → the backend is **only** accepting local connections. Change it to listen on `0.0.0.0`.
- If you see `0.0.0.0:8080` or `*:8080` → it’s already listening on all interfaces.

**Typical fixes in backend code/config:**

| Stack | Change |
|-------|--------|
| **Node/Express** | `app.listen(8080, '0.0.0.0', () => { ... })` or set env `HOST=0.0.0.0` before starting. |
| **Node/Fastify** | `fastify.listen({ port: 8080, host: '0.0.0.0' })`. |
| **Java/Spring Boot** | In `application.properties`: `server.address=0.0.0.0` or run with `--server.address=0.0.0.0`. |
| **Python (Flask)** | `app.run(host='0.0.0.0', port=8080)`. |
| **Python (uvicorn)** | `uvicorn app:app --host 0.0.0.0 --port 8080`. |
| **Go (net/http)** | Listen on `:8080` (same as `0.0.0.0:8080`); avoid `127.0.0.1:8080`. |

After changing the backend, restart it and run `ss -tlnp | grep 8080` again to confirm it shows `0.0.0.0:8080`.

---

## Other options (build + serve)

### Set the API URL

The app calls your backend at a URL that must be set **at build time**.

- **Copy the example env file:**
  ```bash
  cp .env.example .env
  ```
- **Edit `.env`** and set your backend base URL, for example:
  - Same server, nginx proxying API: `REACT_APP_API_URL=/api/v1`
  - Backend on another host: `REACT_APP_API_URL=https://api.yourdomain.com/api/v1`

If you leave it empty, it defaults to `http://localhost:8080/api/v1` (for local dev).

## 2. Build the app

On your machine or on the VPS:

```bash
npm ci
npm run build
```

This creates a `build/` folder with static files (HTML, JS, CSS).

## 3. Serve the build on the VPS

### Option A: Nginx (recommended)

1. **Copy the build to the VPS** (e.g. to `/var/www/frontend`):
   ```bash
   scp -r build/* user@your-vps:/var/www/frontend/
   ```

2. **Install nginx** on the VPS if needed:
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```

3. **Add a site config** (e.g. `/etc/nginx/sites-available/frontend`):

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;   # or your VPS IP

       root /var/www/frontend;
       index index.html;

       # SPA: all routes → index.html
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Optional: proxy API to your backend (if same server)
       # location /api/ {
       #     proxy_pass http://127.0.0.1:8080/api/;
       #     proxy_http_version 1.1;
       #     proxy_set_header Host $host;
       #     proxy_set_header X-Real-IP $remote_addr;
       # }
   }
   ```

4. **Enable and reload nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. **HTTPS (recommended):** use Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### Option B: Node with `serve`

```bash
npm install -g serve
serve -s build -l 3000
```

Use a process manager (e.g. systemd or PM2) so it keeps running and restarts on reboot.

## Checklist

- [ ] Set `REACT_APP_API_URL` in `.env` before `npm run build`.
- [ ] Backend is reachable from the browser (same origin or CORS allowed).
- [ ] If you use client-side routing (React Router), the server must serve `index.html` for all routes (nginx `try_files` or equivalent).
- [ ] For HTTPS, use Certbot or your provider’s SSL and redirect HTTP → HTTPS.
