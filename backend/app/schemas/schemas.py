from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str # admin, lab_manager, inspector, reviewer
    lab_id: Optional[int] = None
    active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    lab_id: Optional[int] = None
    active: Optional[bool] = None

class PasswordResetRequest(BaseModel):
    new_password: str

class UserStatusToggleRequest(BaseModel):
    active: bool

class UserRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    requested_role: str # admin, lab_manager, inspector, reviewer
    lab_id: Optional[int] = None

class UserApproveRequest(BaseModel):
    role: Optional[str] = None
    lab_id: Optional[int] = None

class UserRejectRequest(BaseModel):
    reason: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    lab_id: Optional[int] = None
    lab_name: Optional[str] = None
    status: Optional[str] = "active"
    active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Laboratory Schemas
class LaboratoryCreate(BaseModel):
    name: str
    code: str
    address: str
    accreditation_ref: str
    contact_email: EmailStr
    contact_phone: str

class LaboratoryResponse(BaseModel):
    id: int
    name: str
    code: str
    address: str
    accreditation_ref: str
    contact_email: str
    contact_phone: str

    class Config:
        from_attributes = True

# Equipment Schemas
class EquipmentCreate(BaseModel):
    lab_id: int
    type: str # standard_weight, thermometer, barometer, hygrometer
    identifier: str
    calibration_cert_no: str
    calibration_date: str
    calibration_due_date: str
    status: str = "active"

class EquipmentResponse(BaseModel):
    id: int
    lab_id: int
    type: str
    identifier: str
    calibration_cert_no: str
    calibration_date: str
    calibration_due_date: str
    status: str
    is_expired: bool = False

    class Config:
        from_attributes = True

# Manufacturer & Model Schemas
class ManufacturerCreate(BaseModel):
    name: str
    address: str
    contact_email: EmailStr
    contact_phone: str
    country: str = "India"

class ManufacturerResponse(BaseModel):
    id: int
    name: str
    address: str
    contact_email: str
    contact_phone: str
    country: str

    class Config:
        from_attributes = True

class InstrumentModelCreate(BaseModel):
    manufacturer_id: int
    model_name: str
    accuracy_class: str # I, II, III, IIII
    max_capacity: float
    min_capacity: float
    e: float
    d: float
    temperature_range_min: float = -10.0
    temperature_range_max: float = 40.0
    tare_range_max: float = 0.0
    multi_interval: bool = False
    tier_details: Optional[List[Dict[str, Any]]] = None

class InstrumentModelResponse(BaseModel):
    id: int
    manufacturer_id: int
    manufacturer_name: Optional[str] = None
    model_name: str
    accuracy_class: str
    max_capacity: float
    min_capacity: float
    e: float
    d: float
    n: float
    temperature_range_min: float
    temperature_range_max: float
    tare_range_max: float
    multi_interval: bool
    tier_details: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class InstrumentCreate(BaseModel):
    model_id: int
    serial_number: str
    year_of_manufacture: int
    is_demo_data: bool = False

class InstrumentResponse(BaseModel):
    id: int
    model_id: int
    model_name: Optional[str] = None
    manufacturer_name: Optional[str] = None
    accuracy_class: Optional[str] = None
    serial_number: str
    year_of_manufacture: int
    is_demo_data: bool

    class Config:
        from_attributes = True

# Test Session & Observations
class EnvironmentalConditions(BaseModel):
    temp_c: float
    humidity_pct: float
    pressure_hpa: Optional[float] = 1013.25

class TestSessionCreate(BaseModel):
    instrument_id: int
    lab_id: int
    equipment_ids: List[int] = []
    rule_version_id: int
    environmental_conditions: EnvironmentalConditions
    is_demo_data: bool = False

class ObservationEntry(BaseModel):
    test_procedure_code: str
    raw_readings: Dict[str, Any]

class TestSessionResponse(BaseModel):
    id: int
    session_number: str
    instrument_id: int
    instrument_serial: Optional[str] = None
    model_name: Optional[str] = None
    manufacturer_name: Optional[str] = None
    accuracy_class: Optional[str] = None
    max_capacity: Optional[float] = None
    e: Optional[float] = None
    lab_id: int
    lab_name: Optional[str] = None
    inspector_id: int
    inspector_name: Optional[str] = None
    equipment_ids: List[int] = []
    status: str
    rule_version_id: int
    created_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    environmental_conditions: Dict[str, Any]
    reviewer_remarks: Optional[str] = None
    is_demo_data: bool
    applicable_test_codes: List[str] = []
    observations: List[Dict[str, Any]] = []
    compliance_results: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True

# Rule Engine Schemas
class RuleVersionCreate(BaseModel):
    standard: str = "OIML R-76-1"
    edition_label: str
    effective_from: str
    is_active: bool = True

class RuleLimitCreate(BaseModel):
    rule_version_id: int
    accuracy_class: str
    test_procedure_code: str
    load_band_min_e: float
    load_band_max_e: float
    mpe_working_e: float
    mpe_type_eval_e: float
    formula_ref: str
    verification_status: str = "REQUIRES VERIFICATION AGAINST THE APPLICABLE OIML R-76 EDITION"

# Report & Review
class ReviewSubmitRequest(BaseModel):
    decision: str # approved, rejected
    remarks: str

class PublicVerificationResponse(BaseModel):
    report_number: str
    finalized: bool
    finalized_at: Optional[datetime] = None
    overall_result: str
    instrument_model: str
    manufacturer_name: str
    serial_number: str
    issuing_laboratory: str
    hash_valid: bool
    content_hash: str
    is_demo_data: bool
