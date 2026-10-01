from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import logging

logger = logging.getLogger("backend.database")

# Initialize Engine with Fallback Support
db_url = settings.DATABASE_URL
try:
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {"connect_timeout": 5}
    engine = create_engine(db_url, connect_args=connect_args, echo=False)
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info(f"Database Engine initialized successfully with URL provider: {'PostgreSQL' if db_url.startswith('postgresql') else 'SQLite'}")
except Exception as err:
    logger.warning(f"Failed to connect to primary DB ({db_url}): {err}. Falling back to SQLite local database.")
    fallback_url = "sqlite:///./nawi_reports.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False}, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
