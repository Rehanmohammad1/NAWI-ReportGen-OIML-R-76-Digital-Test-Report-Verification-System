-- ==============================================================================
-- SIH26035 NAWI TEST REPORT GENERATION SYSTEM (OIML R-76)
-- SUPABASE POSTGRESQL COMPLETE DATABASE MIGRATION & RLS SCHEMA
-- ==============================================================================

-- Enable UUID & Crypto extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. LABORATORIES
CREATE TABLE IF NOT EXISTS public.laboratories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    accreditation_ref VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- admin, lab_manager, inspector, reviewer
    lab_id INTEGER REFERENCES public.laboratories(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, pending, rejected
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_lab_id ON public.users(lab_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 3. EQUIPMENT
CREATE TABLE IF NOT EXISTS public.equipment (
    id SERIAL PRIMARY KEY,
    lab_id INTEGER NOT NULL REFERENCES public.laboratories(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- standard_weight, thermometer, barometer, hygrometer
    identifier VARCHAR(100) NOT NULL,
    calibration_cert_no VARCHAR(100) NOT NULL,
    calibration_date VARCHAR(50) NOT NULL,
    calibration_due_date VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' -- active, expired, maintenance
);

CREATE INDEX IF NOT EXISTS idx_equipment_lab_id ON public.equipment(lab_id);

-- 4. MANUFACTURERS
CREATE TABLE IF NOT EXISTS public.manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    country VARCHAR(100) DEFAULT 'India'
);

-- 5. INSTRUMENT MODELS
CREATE TABLE IF NOT EXISTS public.instrument_models (
    id SERIAL PRIMARY KEY,
    manufacturer_id INTEGER NOT NULL REFERENCES public.manufacturers(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    accuracy_class VARCHAR(10) NOT NULL, -- I, II, III, IIII
    max_capacity DOUBLE PRECISION NOT NULL,
    min_capacity DOUBLE PRECISION NOT NULL,
    e DOUBLE PRECISION NOT NULL,
    d DOUBLE PRECISION NOT NULL,
    n DOUBLE PRECISION NOT NULL,
    temperature_range_min DOUBLE PRECISION DEFAULT -10.0,
    temperature_range_max DOUBLE PRECISION DEFAULT 40.0,
    tare_range_max DOUBLE PRECISION DEFAULT 0.0,
    multi_interval BOOLEAN DEFAULT FALSE,
    tier_details JSONB
);

CREATE INDEX IF NOT EXISTS idx_models_mfg_id ON public.instrument_models(manufacturer_id);

-- 6. INSTRUMENTS
CREATE TABLE IF NOT EXISTS public.instruments (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES public.instrument_models(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) NOT NULL,
    year_of_manufacture INTEGER NOT NULL,
    is_demo_data BOOLEAN DEFAULT FALSE,
    CONSTRAINT _model_serial_uc UNIQUE (model_id, serial_number)
);

CREATE INDEX IF NOT EXISTS idx_instruments_model_id ON public.instruments(model_id);

-- 7. RULE VERSIONS (REGULATORY PROVENANCE)
CREATE TABLE IF NOT EXISTS public.rule_versions (
    id SERIAL PRIMARY KEY,
    standard VARCHAR(100) DEFAULT 'OIML R-76-1',
    edition_label VARCHAR(100) NOT NULL, -- e.g. "2006 (E)"
    effective_from VARCHAR(50) NOT NULL,
    source_document VARCHAR(255) DEFAULT 'OIML Recommendation R 76-1 (2006 E)',
    source_url VARCHAR(500) DEFAULT 'https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. RULE LIMITS (OIML MPE TOLERANCE RULES & PROVENANCE)
CREATE TABLE IF NOT EXISTS public.rule_limits (
    id SERIAL PRIMARY KEY,
    rule_version_id INTEGER NOT NULL REFERENCES public.rule_versions(id) ON DELETE CASCADE,
    accuracy_class VARCHAR(10) NOT NULL,
    test_procedure_code VARCHAR(50) NOT NULL,
    load_band_min_e DOUBLE PRECISION NOT NULL,
    load_band_max_e DOUBLE PRECISION NOT NULL,
    mpe_working_e DOUBLE PRECISION NOT NULL,
    mpe_type_eval_e DOUBLE PRECISION NOT NULL,
    formula_ref VARCHAR(255) NOT NULL,
    verification_status VARCHAR(255) DEFAULT 'VERIFIED AGAINST OIML R-76-1 (2006 E) SPECIFICATION'
);

CREATE INDEX IF NOT EXISTS idx_rule_limits_ver_class ON public.rule_limits(rule_version_id, accuracy_class);

-- 9. TEST PROCEDURES
CREATE TABLE IF NOT EXISTS public.test_procedures (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    applicable_classes JSONB NOT NULL,
    required_parameters JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_procedures_code ON public.test_procedures(code);

-- 10. TEST SESSIONS
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id SERIAL PRIMARY KEY,
    session_number VARCHAR(100) NOT NULL UNIQUE,
    instrument_id INTEGER NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
    lab_id INTEGER NOT NULL REFERENCES public.laboratories(id) ON DELETE CASCADE,
    inspector_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    equipment_ids JSONB,
    status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, under_review, approved, rejected, finalized
    rule_version_id INTEGER NOT NULL REFERENCES public.rule_versions(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    environmental_conditions JSONB NOT NULL,
    reviewer_remarks TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_test_sessions_session_num ON public.test_sessions(session_number);
CREATE INDEX IF NOT EXISTS idx_test_sessions_lab_id ON public.test_sessions(lab_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON public.test_sessions(status);

-- 11. OBSERVATIONS
CREATE TABLE IF NOT EXISTS public.observations (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    test_procedure_code VARCHAR(50) NOT NULL,
    raw_readings JSONB NOT NULL,
    entered_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    entered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_observations_session_id ON public.observations(session_id);

-- 12. CALCULATED RESULTS
CREATE TABLE IF NOT EXISTS public.calculated_results (
    id SERIAL PRIMARY KEY,
    observation_id INTEGER NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
    computed_values JSONB NOT NULL,
    formula_ref VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calc_results_obs_id ON public.calculated_results(observation_id);

-- 13. COMPLIANCE RESULTS
CREATE TABLE IF NOT EXISTS public.compliance_results (
    id SERIAL PRIMARY KEY,
    calculated_result_id INTEGER NOT NULL REFERENCES public.calculated_results(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    test_procedure_code VARCHAR(50) NOT NULL,
    limit_applied VARCHAR(255) NOT NULL,
    measured_value DOUBLE PRECISION NOT NULL,
    margin DOUBLE PRECISION NOT NULL,
    pass_fail VARCHAR(20) NOT NULL, -- PASS, FAIL, WARN
    rule_version_id INTEGER NOT NULL REFERENCES public.rule_versions(id) ON DELETE RESTRICT,
    explanation_text TEXT NOT NULL,
    verification_status VARCHAR(255) DEFAULT 'VERIFIED AGAINST OIML R-76-1 (2006 E) SPECIFICATION'
);

CREATE INDEX IF NOT EXISTS idx_compliance_results_sess_id ON public.compliance_results(session_id);

-- 14. EVIDENCE
CREATE TABLE IF NOT EXISTS public.evidence (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    uploaded_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_session_id ON public.evidence(session_id);

-- 15. REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL UNIQUE REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    report_number VARCHAR(100) NOT NULL UNIQUE,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    pdf_path VARCHAR(500) NOT NULL,
    docx_path VARCHAR(500) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    qr_payload TEXT NOT NULL,
    finalized BOOLEAN DEFAULT FALSE,
    finalized_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_report_number ON public.reports(report_number);

-- 16. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL, -- approved, rejected
    remarks TEXT NOT NULL,
    decided_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);

-- 17. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    before_state JSONB,
    after_state JSONB,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1'
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    related_entity_id INTEGER,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instrument_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculated_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Service Role / Admin Bypass (Allows backend API with service_role / db connection full access)
CREATE POLICY service_role_all_access_laboratories ON public.laboratories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_users ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_equipment ON public.equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_manufacturers ON public.manufacturers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_instrument_models ON public.instrument_models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_instruments ON public.instruments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_rule_versions ON public.rule_versions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_rule_limits ON public.rule_limits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_test_procedures ON public.test_procedures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_test_sessions ON public.test_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_observations ON public.observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_calculated_results ON public.calculated_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_compliance_results ON public.compliance_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_evidence ON public.evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_reports ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_reviews ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_audit_logs ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_access_notifications ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 2. Public / Anon Read Policy for QR Verification
CREATE POLICY anon_read_reports_for_qr ON public.reports FOR SELECT USING (true);
