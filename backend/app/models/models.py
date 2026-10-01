from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # admin, lab_manager, inspector, reviewer
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=True)
    status = Column(String(50), default="active") # active, pending, rejected
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    laboratory = relationship("Laboratory", back_populates="users")

class Laboratory(Base):
    __tablename__ = "laboratories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    address = Column(Text, nullable=False)
    accreditation_ref = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)

    users = relationship("User", back_populates="laboratory")
    equipment = relationship("Equipment", back_populates="laboratory")
    test_sessions = relationship("TestSession", back_populates="laboratory")

class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    type = Column(String(100), nullable=False) # standard_weight, thermometer, barometer, hygrometer
    identifier = Column(String(100), nullable=False) # e.g. W-E2-10KG-01
    calibration_cert_no = Column(String(100), nullable=False)
    calibration_date = Column(String(50), nullable=False)
    calibration_due_date = Column(String(50), nullable=False) # YYYY-MM-DD
    status = Column(String(50), default="active") # active, expired, maintenance

    laboratory = relationship("Laboratory", back_populates="equipment")

class Manufacturer(Base):
    __tablename__ = "manufacturers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    address = Column(Text, nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    country = Column(String(100), default="India")

    models = relationship("InstrumentModel", back_populates="manufacturer")

class InstrumentModel(Base):
    __tablename__ = "instrument_models"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False)
    model_name = Column(String(255), nullable=False)
    accuracy_class = Column(String(10), nullable=False) # I, II, III, IIII
    max_capacity = Column(Float, nullable=False) # in kg or g
    min_capacity = Column(Float, nullable=False)
    e = Column(Float, nullable=False) # verification scale interval
    d = Column(Float, nullable=False) # actual scale interval
    n = Column(Float, nullable=False) # number of scale intervals (Max/e)
    temperature_range_min = Column(Float, default=-10.0) # °C
    temperature_range_max = Column(Float, default=40.0) # °C
    tare_range_max = Column(Float, default=0.0)
    multi_interval = Column(Boolean, default=False)
    tier_details = Column(JSON, nullable=True) # for multi-interval tiers

    manufacturer = relationship("Manufacturer", back_populates="models")
    instruments = relationship("Instrument", back_populates="model")

class Instrument(Base):
    __tablename__ = "instruments"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(Integer, ForeignKey("instrument_models.id"), nullable=False)
    serial_number = Column(String(100), nullable=False)
    year_of_manufacture = Column(Integer, nullable=False)
    is_demo_data = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint('model_id', 'serial_number', name='_model_serial_uc'),)

    model = relationship("InstrumentModel", back_populates="instruments")
    sessions = relationship("TestSession", back_populates="instrument")

class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id = Column(Integer, primary_key=True, index=True)
    standard = Column(String(100), default="OIML R-76-1")
    edition_label = Column(String(100), nullable=False) # e.g. "2006 (E)"
    effective_from = Column(String(50), nullable=False)
    source_document = Column(String(255), default="OIML Recommendation R 76-1 (2006 E)")
    source_url = Column(String(500), default="https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    limits = relationship("RuleLimit", back_populates="rule_version")

class RuleLimit(Base):
    __tablename__ = "rule_limits"

    id = Column(Integer, primary_key=True, index=True)
    rule_version_id = Column(Integer, ForeignKey("rule_versions.id"), nullable=False)
    accuracy_class = Column(String(10), nullable=False) # I, II, III, IIII
    test_procedure_code = Column(String(50), nullable=False) # TEST-WEIGHING, TEST-ECCENTRICITY, etc.
    load_band_min_e = Column(Float, nullable=False) # in units of e
    load_band_max_e = Column(Float, nullable=False) # in units of e
    mpe_working_e = Column(Float, nullable=False) # MPE in units of e for working/service inspection
    mpe_type_eval_e = Column(Float, nullable=False) # MPE in units of e for initial type evaluation
    formula_ref = Column(String(255), nullable=False)
    verification_status = Column(String(255), default="REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION")

    rule_version = relationship("RuleVersion", back_populates="limits")

class TestProcedure(Base):
    __tablename__ = "test_procedures"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    applicable_classes = Column(JSON, nullable=False) # ["I", "II", "III", "IIII"]
    required_parameters = Column(JSON, nullable=False)

class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_number = Column(String(100), unique=True, index=True, nullable=False)
    instrument_id = Column(Integer, ForeignKey("instruments.id"), nullable=False)
    lab_id = Column(Integer, ForeignKey("laboratories.id"), nullable=False)
    inspector_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    equipment_ids = Column(JSON, nullable=True) # list of equipment IDs used
    status = Column(String(50), default="draft") # draft, submitted, under_review, approved, rejected, finalized
    rule_version_id = Column(Integer, ForeignKey("rule_versions.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    environmental_conditions = Column(JSON, nullable=False) # {temp_c: 20.5, humidity_pct: 55, pressure_hpa: 1013}
    reviewer_remarks = Column(Text, nullable=True)
    is_demo_data = Column(Boolean, default=False)

    instrument = relationship("Instrument", back_populates="sessions")
    laboratory = relationship("Laboratory", back_populates="test_sessions")
    inspector = relationship("User", foreign_keys=[inspector_id])
    observations = relationship("Observation", back_populates="session", cascade="all, delete-orphan")
    compliance_results = relationship("ComplianceResult", back_populates="session", cascade="all, delete-orphan")
    evidence_files = relationship("Evidence", back_populates="session", cascade="all, delete-orphan")
    report = relationship("Report", back_populates="session", uselist=False)

class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    test_procedure_code = Column(String(50), nullable=False)
    raw_readings = Column(JSON, nullable=False) # flexible per-test observation payload
    entered_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    entered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("TestSession", back_populates="observations")
    calculated_result = relationship("CalculatedResult", back_populates="observation", uselist=False, cascade="all, delete-orphan")

class CalculatedResult(Base):
    __tablename__ = "calculated_results"

    id = Column(Integer, primary_key=True, index=True)
    observation_id = Column(Integer, ForeignKey("observations.id"), nullable=False)
    computed_values = Column(JSON, nullable=False) # errors, spread, deviations, stats
    formula_ref = Column(String(255), nullable=False)

    observation = relationship("Observation", back_populates="calculated_result")
    compliance_result = relationship("ComplianceResult", back_populates="calculated_result", uselist=False, cascade="all, delete-orphan")

class ComplianceResult(Base):
    __tablename__ = "compliance_results"

    id = Column(Integer, primary_key=True, index=True)
    calculated_result_id = Column(Integer, ForeignKey("calculated_results.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    test_procedure_code = Column(String(50), nullable=False)
    limit_applied = Column(String(255), nullable=False)
    measured_value = Column(Float, nullable=False)
    margin = Column(Float, nullable=False) # limit - measured_error (positive = safe margin)
    pass_fail = Column(String(20), nullable=False) # PASS, FAIL, WARN
    rule_version_id = Column(Integer, ForeignKey("rule_versions.id"), nullable=False)
    explanation_text = Column(Text, nullable=False)
    verification_status = Column(String(255), default="REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION")

    session = relationship("TestSession", back_populates="compliance_results")
    calculated_result = relationship("CalculatedResult", back_populates="compliance_result")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False) # photo, pdf, calibration_cert
    description = Column(String(255), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("TestSession", back_populates="evidence_files")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), unique=True, nullable=False)
    report_number = Column(String(100), unique=True, index=True, nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    pdf_path = Column(String(500), nullable=False)
    docx_path = Column(String(500), nullable=False)
    content_hash = Column(String(64), nullable=False) # SHA-256 hash of report data payload
    qr_payload = Column(Text, nullable=False)
    finalized = Column(Boolean, default=False)
    finalized_at = Column(DateTime, nullable=True)

    session = relationship("TestSession", back_populates="report")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("test_sessions.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    decision = Column(String(50), nullable=False) # approved, rejected
    remarks = Column(Text, nullable=False)
    decided_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # CREATE_SESSION, SUBMIT_SESSION, APPROVE_SESSION, REJECT_SESSION, FINALIZE_REPORT
    entity_type = Column(String(100), nullable=False) # TestSession, Report, Instrument, etc.
    entity_id = Column(Integer, nullable=False)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ip_address = Column(String(50), default="127.0.0.1")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info") # info, warning, review_request, review_result
    related_entity_id = Column(Integer, nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
