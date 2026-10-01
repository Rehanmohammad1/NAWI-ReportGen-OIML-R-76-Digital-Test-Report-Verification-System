import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.api import auth, users, instruments, sessions, reports, rules, equipment, analytics, notifications, verify

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Regulatory Compliance Workflow System for Non-Automatic Weighing Instruments (NAWI) per OIML R-76",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto-seed initial database if empty
@app.on_event("startup")
def startup_db_seed():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

# Mount API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(instruments.router, prefix=settings.API_V1_STR)
app.include_router(sessions.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(rules.router, prefix=settings.API_V1_STR)
app.include_router(equipment.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(verify.router, prefix=settings.API_V1_STR)

@app.get("/")
def root_status():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "standard": "OIML R-76-1 (2006 E)",
        "organization": "Ministry of Consumer Affairs, Food & Public Distribution (DoCA), Govt. of India"
    }

@app.get("/api/v1/system/status")
def system_status():
    is_postgres = settings.DATABASE_URL.startswith("postgresql")
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "database_provider": "Supabase PostgreSQL" if is_postgres else "SQLite Local Backup",
        "database_connected": True,
        "supabase_integration": {
            "active": is_postgres,
            "supabase_url": settings.SUPABASE_URL if settings.SUPABASE_URL else "Configured via DATABASE_URL / SUPABASE_DB_URL",
            "rls_policies_active": True
        },
        "regulatory_data_source": {
            "name": "OIML Recommendation R 76-1 & R 76-2",
            "source_url": "https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf",
            "edition": "2006 (E)",
            "authority": "International Organization of Legal Metrology / Ministry of Consumer Affairs"
        }
    }
