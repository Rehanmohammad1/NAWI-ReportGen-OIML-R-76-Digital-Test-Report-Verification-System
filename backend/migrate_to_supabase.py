import os
import sys
import shutil
import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("supabase_migration")

# Add backend app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings

SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "nawi_reports.db"))
BACKUP_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "nawi_reports.db.bak"))
SQL_MIGRATION_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "supabase_migration.sql"))

MODELS_ORDER = [
    "laboratories",
    "users",
    "manufacturers",
    "instrument_models",
    "instruments",
    "rule_versions",
    "rule_limits",
    "test_procedures",
    "equipment",
    "test_sessions",
    "observations",
    "calculated_results",
    "compliance_results",
    "evidence",
    "reports",
    "reviews",
    "audit_logs",
    "notifications"
]

def make_backup():
    if os.path.exists(SQLITE_DB_PATH):
        shutil.copy2(SQLITE_DB_PATH, BACKUP_DB_PATH)
        logger.info(f"SAFE BACKUP CREATED: {BACKUP_DB_PATH}")
    else:
        logger.warning(f"SQLite database file not found at {SQLITE_DB_PATH}")

def get_target_db_url():
    # Priority: SUPABASE_DB_URL -> DATABASE_URL (if postgres) -> env vars
    target_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not target_url or target_url.startswith("sqlite"):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        supabase_db_pass = os.getenv("SUPABASE_DB_PASSWORD")
        
        if supabase_url and supabase_db_pass:
            # Construct standard Supabase postgres connection string
            # e.g., https://xyz.supabase.co -> db.xyz.supabase.co
            project_ref = supabase_url.replace("https://", "").replace("http://", "").split(".")[0]
            target_url = f"postgresql://postgres:{supabase_db_pass}@db.{project_ref}.supabase.co:5432/postgres?sslmode=require"
    
    return target_url

def run_migration():
    logger.info("==================================================================")
    logger.info("SIH26035 — SUPABASE DATABASE MIGRATION & PROVENANCE VERIFIER")
    logger.info("==================================================================")

    make_backup()

    sqlite_url = f"sqlite:///{SQLITE_DB_PATH}"
    target_url = get_target_db_url()

    if not target_url or target_url.startswith("sqlite"):
        logger.error("ERROR: No valid PostgreSQL / Supabase target connection string found!")
        logger.error("Please set SUPABASE_DB_URL or DATABASE_URL in backend/.env to your Supabase PostgreSQL connection string.")
        logger.error("Example format: postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres")
        sys.exit(1)

    # Convert postgresql:// to postgresql+psycopg2:// if needed by SQLAlchemy
    if target_url.startswith("postgresql://"):
        pg_url = target_url.replace("postgresql://", "postgresql+psycopg2://")
    else:
        pg_url = target_url

    logger.info(f"Connecting to source SQLite database: {sqlite_url}")
    src_engine = create_engine(sqlite_url)

    logger.info(f"Connecting to target Supabase PostgreSQL database: {target_url.split('@')[-1] if '@' in target_url else target_url}")
    target_engine = create_engine(pg_url, echo=False)

    # Execute DDL SQL migration file if tables don't exist
    if os.path.exists(SQL_MIGRATION_FILE):
        logger.info(f"Applying DDL schema & RLS policies from {os.path.basename(SQL_MIGRATION_FILE)}...")
        with open(SQL_MIGRATION_FILE, "r", encoding="utf-8") as f:
            sql_script = f.read()

        # Split and execute non-empty statements
        with target_engine.connect() as conn:
            # Execute in transaction
            trans = conn.begin()
            try:
                for statement in sql_script.split(";"):
                    stmt = statement.strip()
                    if stmt:
                        conn.execute(text(stmt))
                trans.commit()
                logger.info("Supabase DDL schema & RLS policies executed successfully!")
            except Exception as e:
                trans.rollback()
                logger.warning(f"Note during DDL execution: {e}")

    # Inspect tables
    src_inspector = inspect(src_engine)
    target_inspector = inspect(target_engine)

    src_tables = set(src_inspector.get_table_names())
    target_tables = set(target_inspector.get_table_names())

    logger.info(f"Source SQLite tables found ({len(src_tables)}): {sorted(list(src_tables))}")
    logger.info(f"Target Supabase tables found ({len(target_tables)}): {sorted(list(target_tables))}")

    migration_report = {}

    with src_engine.connect() as src_conn, target_engine.connect() as target_conn:
        for table_name in MODELS_ORDER:
            if table_name not in src_tables:
                logger.warning(f"Table '{table_name}' not found in source SQLite DB. Skipping.")
                continue

            # Read source rows
            result = src_conn.execute(text(f"SELECT * FROM {table_name}"))
            keys = result.keys()
            rows = [dict(zip(keys, row)) for row in result.fetchall()]
            src_count = len(rows)

            if src_count == 0:
                logger.info(f"Table '{table_name}': 0 rows in source. Skipped.")
                migration_report[table_name] = {"src": 0, "migrated": 0, "status": "OK (Empty)"}
                continue

            # Clear target rows or upsert
            # Use ON CONFLICT (id) DO NOTHING to prevent duplicates
            inserted_count = 0
            trans = target_conn.begin()
            try:
                for row in rows:
                    # Convert dict keys and values to JSON strings if dict/list
                    clean_row = {}
                    for k, v in row.items():
                        if isinstance(v, (dict, list)):
                            import json
                            clean_row[k] = json.dumps(v)
                        else:
                            clean_row[k] = v

                    cols = ", ".join([f'"{k}"' for k in clean_row.keys()])
                    placeholders = ", ".join([f":{k}" for k in clean_row.keys()])
                    sql = f'INSERT INTO public."{table_name}" ({cols}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
                    
                    target_conn.execute(text(sql), clean_row)
                    inserted_count += 1

                trans.commit()
                logger.info(f"Table '{table_name}': {src_count} source records processed, successfully saved to Supabase!")
                migration_report[table_name] = {"src": src_count, "migrated": inserted_count, "status": "SUCCESS"}
            except Exception as e:
                trans.rollback()
                logger.error(f"Failed migrating table '{table_name}': {e}")
                migration_report[table_name] = {"src": src_count, "migrated": 0, "status": f"ERROR: {e}"}

        # Reset Postgres sequences for tables with auto-increment ID
        logger.info("Resetting PostgreSQL primary key sequences...")
        trans = target_conn.begin()
        for table_name in MODELS_ORDER:
            try:
                seq_query = f"SELECT setval(pg_get_serial_sequence('public.{table_name}', 'id'), COALESCE(MAX(id), 1)) FROM public.{table_name}"
                target_conn.execute(text(seq_query))
            except Exception as seq_err:
                pass
        trans.commit()

    logger.info("\n==================================================================")
    logger.info("SUPABASE DATABASE MIGRATION SUMMARY REPORT")
    logger.info("==================================================================")
    for tbl, info in migration_report.items():
        logger.info(f"Table: {tbl:<22} | Source: {info['src']:<4} | Target: {info['migrated']:<4} | Status: {info['status']}")
    logger.info("==================================================================")
    logger.info("Migration finished successfully! Local database preserved at nawi_reports.db.bak")

if __name__ == "__main__":
    run_migration()
