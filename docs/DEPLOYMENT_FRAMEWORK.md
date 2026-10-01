# DEPLOYMENT FRAMEWORK DOCUMENTATION
**Project:** SIH26035 — NAWI Legal Metrology Evaluation & Certificate System  
**Platform:** Multi-platform (Windows / Linux / macOS)  
**Database:** Supabase PostgreSQL (Production) / SQLite (Local Backup)  

---

## 1. PREREQUISITES & ENVIRONMENT REQUIREMENTS

- **Python:** 3.10 or higher
- **Node.js:** v18.0 or higher
- **npm:** v9.0 or higher
- **Database:** Supabase PostgreSQL instance (or local PostgreSQL 14+)

---

## 2. REPOSITORY & ENVIRONMENT SETUP

### 2.1 Clone and Directory Structure
```bash
git clone <repository_url>
cd "2nd title"
```

### 2.2 Backend Environment Setup
```bash
# Create Python virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 2.3 Environment Variable Configuration (`backend/.env`)
Create `backend/.env` based on `.env.example`:
```ini
PROJECT_NAME="NAWI Legal Metrology Certificate System"
API_V1_STR="/api/v1"
SECRET_KEY="<generate_secure_random_64_character_hex_string>"
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Supabase PostgreSQL Configuration
SUPABASE_URL="https://dysirmubdnvyafotcrsc.supabase.co"
SUPABASE_ANON_KEY="<your_supabase_anon_key>"
SUPABASE_SERVICE_ROLE_KEY="<your_supabase_service_role_key>"
SUPABASE_DB_URL="postgresql://postgres:<password>@db.dysirmubdnvyafotcrsc.supabase.co:5432/postgres"

# Active Database Connection
DATABASE_URL="postgresql://postgres:<password>@db.dysirmubdnvyafotcrsc.supabase.co:5432/postgres"
```

### 2.4 Database Migration & Seeding
```bash
# Apply complete 18-table schema migration to Supabase PostgreSQL
python backend/supabase_migration.sql # or execute in Supabase SQL Editor

# Migrate seed data and initial OIML R-76 rules
python backend/migrate_to_supabase.py
```

---

## 3. RUNNING LOCALLY (DEVELOPMENT MODE)

### 3.1 Start FastAPI Backend Server
```bash
cd backend
..\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- ReDoc API Spec: `http://127.0.0.1:8000/redoc`

### 3.2 Start Vite Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
- Application Web UI: `http://localhost:5173`

---

## 4. PRODUCTION DEPLOYMENT ARCHITECTURE

In a production environment (e.g., State Legal Metrology Department Cloud Server), the application is deployed using a reverse proxy and daemonized process managers.

```
                  +-----------------------+
                  |  Internet / Intranet  |
                  +-----------------------+
                              |
                     Port 443 (HTTPS)
                              v
                  +-----------------------+
                  |  Nginx Reverse Proxy  |
                  |  - SSL Termination    |
                  |  - Static Assets      |
                  +-----------------------+
                              |
               +--------------+--------------+
               |                             |
      Port 8000 (HTTP)              Port 3000 / Static Files
               v                             v
   +-----------------------+     +-----------------------+
   |   Gunicorn / Uvicorn  |     |   Vite Dist Static    |
   |   FastAPI Backend     |     |   React SPA Bundle    |
   +-----------------------+     +-----------------------+
               |
        PostgreSQL Connection (SSL)
               v
   +-----------------------+
   |   Supabase PostgreSQL |
   |   18 Tables + RLS     |
   +-----------------------+
```

### 4.1 Frontend Build
```bash
cd frontend
npm run build
# Production build bundle generated in frontend/dist/
```

### 4.2 Production Server Configuration (Systemd Service Example)
Create `/etc/systemd/system/nawi-backend.service`:
```ini
[Unit]
Description=SIH26035 NAWI FastAPI Backend Service
After=network.target

[Service]
User=nawi
WorkingDirectory=/var/www/nawi/backend
ExecStart=/var/www/nawi/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 5. BACKUP & RECOVERY PROCEDURES

1. **Database Backups:** Automated daily PostgreSQL pg_dump scheduled via Supabase dashboard / cron.
2. **Evidence File Storage Backup:** Periodic rsync/S3 backup of `backend/uploads/evidence/` directory.
3. **Environment Backup:** Store `.env` configuration securely in encrypted vault.
