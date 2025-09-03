## Deploy: Frontend on Vercel, Backend on Render (Flask + FAISS)

This guide shows how to host the chat UI as a static site on Vercel, and run the Flask backend (uploads, FAISS index, OpenAI calls) on Render with persistent storage.

### Overview
- Frontend: Vercel (static `frontend/index.html`)
- Backend API: Render (Python/Flask)
- Persistent data on Render at `/opt/data` (uploads and FAISS index)

---

## 1) One-time small code tweaks (production readiness)

Make these minimal changes to support server environments:

### 1.1 CORS on backend
Install CORS and allow your Vercel domain to call `/api/*`.

```bash
pip install flask-cors
```

In `src/interfaces/web/app.py`:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*").split(",")}})
```

Tip: Later set `CORS_ORIGINS` to your Vercel domain (step 5).

### 1.2 Respect the platform PORT
Render injects a `PORT` env var. Use it instead of a hardcoded port.

In `web_app.py`:

```python
app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5500)), debug=True)
```

In `src/interfaces/web/app.py` (at the bottom `__main__` runner):

```python
app.run(debug=debug_mode, host='0.0.0.0', port=int(os.environ.get("PORT", 5500)))
```

### 1.3 Configure storage paths via env vars
Keep uploads and indexes on a mounted persistent disk.

In `src/interfaces/web/app.py` (upload path):

```python
file_path = Path(os.getenv("DOCUMENTS_DIR", "./data/documents")) / filename
```

In `src/core/rag_system.py` constructor: allow overriding base dir.

```python
def __init__(self, base_storage_dir: str = None, ...):
    base_storage_dir = base_storage_dir or os.getenv("RAG_BASE_DIR", "./data/indexes")
    self.base_storage_dir = Path(base_storage_dir)
```

### 1.4 Disable file monitor on the server (optional, recommended)
In `src/interfaces/web/app.py` initialization:

```python
rag_system = get_rag_system()
file_monitor = get_file_monitor()
if os.getenv("FILE_MONITOR_ENABLED", "true").lower() in {"1", "true", "yes"}:
    file_monitor.start_monitoring()
```

On Render set `FILE_MONITOR_ENABLED=false`.

---

## 2) Deploy backend on Render

1) In the Render dashboard: New → Web Service → connect your Git repo.
2) Environment: Python 3.x
3) Build command:
```bash
pip install -r requirements.txt
```
4) Start command:
```bash
python web_app.py
```
5) Environment Variables (Render → Settings → Environment):
   - `OPENAI_API_KEY`: your key
   - Optional: `LLAMA_CLOUD_API_KEY`, `TAVILY_API_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_HOST`
   - `FILE_MONITOR_ENABLED`: `false`
   - `RAG_BASE_DIR`: `/opt/data/indexes`
   - `DOCUMENTS_DIR`: `/opt/data/documents`
   - Later: `CORS_ORIGINS` → `https://your-app.vercel.app`
6) Add a Persistent Disk (Render → Disks):
   - Size: 1–2 GB
   - Mount path: `/opt/data`
7) Deploy. Verify health:
   - `GET https://<your-backend>.onrender.com/api/stats`

Uploads and FAISS index are persisted under `/opt/data`.

---

## 3) Prepare a static frontend for Vercel

1) Create a `frontend/` folder at repo root.
2) Copy `src/interfaces/web/templates/chat.html` → `frontend/index.html`.
3) In `frontend/index.html`, add an API base constant near the top:

```html
<script>
  const API_BASE = 'https://<your-backend>.onrender.com';
</script>
```

4) Replace all fetch calls to use the full API URL:
   - `/api/ask` → `${API_BASE}/api/ask`
   - `/api/upload` → `${API_BASE}/api/upload`
   - `/api/stats` → `${API_BASE}/api/stats`
   - `/api/files` → `${API_BASE}/api/files`
   - `/api/files/delete` → `${API_BASE}/api/files/delete`

Keep the original Flask template for local dev; `frontend/index.html` is the production UI for Vercel.

---

## 4) Deploy the frontend on Vercel

1) In Vercel: New Project → Import your Git repo.
2) Framework Preset: Other
3) Root Directory: `frontend`
4) Build & Output:
   - Build command: (leave empty for static)
   - Output directory: `.`
5) Deploy → you’ll get `https://your-app.vercel.app`.

---

## 5) Lock down CORS

In Render backend env vars, set:

```
CORS_ORIGINS=https://your-app.vercel.app
```

Save to restart. Now only your Vercel app can call `/api/*`.

---

## 6) Verify end-to-end

1) Open `https://your-app.vercel.app`.
2) Upload a small `.pdf`/`.txt` and ask a question.
3) Check stats:
   - `GET ${API_BASE}/api/stats` shows Files/Chunks/Index Size increasing.

---

## 7) Troubleshooting

- 400/500 from `/api/ask`:
  - Ensure `OPENAI_API_KEY` is set on Render.
  - Check Render logs for import errors; install `flask-cors` if missing.
- Uploads fail:
  - Verify `DOCUMENTS_DIR` exists under the mounted disk path.
  - Confirm your plan’s disk is attached and mounted at `/opt/data`.
- FAISS index not growing:
  - Ensure `RAG_BASE_DIR` points to a writable path on the mounted disk.
- CORS blocked in browser:
  - Set `CORS_ORIGINS` on Render to the exact Vercel URL.
- Slow first request:
  - Server cold start is normal; subsequent requests will be faster.

---

## Optional hardening

- Increase `MAX_CONTENT_LENGTH` in `src/interfaces/web/app.py` if you need bigger uploads.
- Add a simple `/healthz` route for Render health checks.
- If needed, protect `/api/*` with an API key header. Set a shared secret in both Vercel (as a client env var) and Render; send it in `fetch` headers and validate on the server.


