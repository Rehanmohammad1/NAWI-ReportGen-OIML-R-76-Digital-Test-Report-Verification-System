import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env file from backend root if present
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH26035 — NAWI Test Report Generation System (OIML R-76)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih26035_oiml_r76_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database connection (Supabase PostgreSQL / SQLite fallback)
    raw_db_url: str = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL", "sqlite:///./nawi_reports.db")

    @property
    def DATABASE_URL(self) -> str:
        url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL", "sqlite:///./nawi_reports.db")
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    # Supabase credentials (optional SDK client connection)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Uploads directory
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    REPORTS_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "reports"))
    EVIDENCE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "evidence"))
    
    # Verification URL base for QR code
    PUBLIC_VERIFY_BASE_URL: str = os.getenv("PUBLIC_VERIFY_BASE_URL", "http://localhost:5173/verify")

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure upload directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORTS_DIR, exist_ok=True)
os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
