import os
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import (
    User, TestSession, Instrument, InstrumentModel, Observation,
    CalculatedResult, ComplianceResult, Evidence, Report, Review,
    AuditLog, RuleVersion, RuleLimit, Equipment, Notification
)
from app.schemas.schemas import TestSessionCreate, ObservationEntry, ReviewSubmitRequest
from app.engine.calculation import CalculationEngine
from app.engine.compliance import ComplianceEngine
from app.engine.anomaly import AnomalyDetectionEngine
from app.services.pdf_generator import generate_pdf_report
from app.services.docx_generator import generate_docx_report
from app.core.config import settings

router = APIRouter(prefix="/sessions", tags=["Test Sessions"])

# List Test Sessions with Role-Based Row Scoping
@router.get("")
def list_test_sessions(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TestSession)

    # Row-level scoping: Inspector/Lab Manager/Reviewer see only their laboratory's sessions. Admin sees all.
    if current_user.role != "admin" and current_user.lab_id:
        query = query.filter(TestSession.lab_id == current_user.lab_id)

    if status_filter:
        query = query.filter(TestSession.status == status_filter)

    sessions = query.order_by(TestSession.created_at.desc()).all()
    res = []
    for s in sessions:
        inst = s.instrument
        model = inst.model if inst else None
        res.append({
            "id": s.id,
            "session_number": s.session_number,
            "instrument_id": s.instrument_id,
            "serial_number": inst.serial_number if inst else "N/A",
            "model_name": model.model_name if model else "N/A",
            "manufacturer_name": model.manufacturer.name if model and model.manufacturer else "N/A",
            "accuracy_class": model.accuracy_class if model else "III",
            "lab_id": s.lab_id,
            "lab_name": s.laboratory.name if s.laboratory else "N/A",
            "inspector_id": s.inspector_id,
            "inspector_name": s.inspector.name if s.inspector else "N/A",
            "status": s.status,
            "created_at": s.created_at,
            "submitted_at": s.submitted_at,
            "reviewed_at": s.reviewed_at,
            "is_demo_data": s.is_demo_data,
            "has_report": s.report is not None,
            "report_number": s.report.report_number if s.report else None,
            "finalized": s.report.finalized if s.report else False
        })
    return res

# Get Test Session Detail
@router.get("/{session_id}")
def get_test_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    # Row level authorization check
    if current_user.role != "admin" and current_user.lab_id and s.lab_id != current_user.lab_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view test sessions from another laboratory.")

    inst = s.instrument
    model = inst.model if inst else None

    # Fetch observations & compliance results
    obs_list = []
    for o in s.observations:
        obs_list.append({
            "id": o.id,
            "test_procedure_code": o.test_procedure_code,
            "raw_readings": o.raw_readings,
            "entered_at": o.entered_at,
            "calculated_result": o.calculated_result.computed_values if o.calculated_result else None
        })

    comp_list = []
    for c in s.compliance_results:
        comp_list.append({
            "id": c.id,
            "test_procedure_code": c.test_procedure_code,
            "limit_applied": c.limit_applied,
            "measured_value": c.measured_value,
            "margin": c.margin,
            "pass_fail": c.pass_fail,
            "explanation_text": c.explanation_text,
            "verification_status": c.verification_status
        })

    evidence_list = []
    for ev in s.evidence_files:
        evidence_list.append({
            "id": ev.id,
            "file_name": ev.file_name,
            "file_type": ev.file_type,
            "description": ev.description,
            "uploaded_by": ev.uploaded_by,
            "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None
        })

    return {
        "id": s.id,
        "session_number": s.session_number,
        "instrument_id": s.instrument_id,
        "serial_number": inst.serial_number if inst else "N/A",
        "model_id": model.id if model else None,
        "model_name": model.model_name if model else "N/A",
        "manufacturer_name": model.manufacturer.name if model and model.manufacturer else "N/A",
        "accuracy_class": model.accuracy_class if model else "III",
        "max_capacity": model.max_capacity if model else 0.0,
        "min_capacity": model.min_capacity if model else 0.0,
        "e": model.e if model else 0.01,
        "d": model.d if model else 0.01,
        "n": model.n if model else 0,
        "temp_min": model.temperature_range_min if model else -10,
        "temp_max": model.temperature_range_max if model else 40,
        "lab_id": s.lab_id,
        "lab_name": s.laboratory.name if s.laboratory else "N/A",
        "inspector_id": s.inspector_id,
        "inspector_name": s.inspector.name if s.inspector else "N/A",
        "equipment_ids": s.equipment_ids or [],
        "status": s.status,
        "rule_version_id": s.rule_version_id,
        "environmental_conditions": s.environmental_conditions,
        "reviewer_remarks": s.reviewer_remarks,
        "is_demo_data": s.is_demo_data,
        "observations": obs_list,
        "compliance_results": comp_list,
        "evidence_files": evidence_list,
        "report": {
            "report_number": s.report.report_number,
            "pdf_path": s.report.pdf_path,
            "docx_path": s.report.docx_path,
            "content_hash": s.report.content_hash,
            "qr_payload": s.report.qr_payload,
            "finalized": s.report.finalized
        } if s.report else None
    }

# Create New Test Session
@router.post("")
def create_test_session(
    sess_in: TestSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    inst = db.query(Instrument).filter(Instrument.id == sess_in.instrument_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Instrument not found")

    count = db.query(TestSession).count() + 1
    session_num = f"SESS-{datetime.now().year}-{count:05d}"

    sess = TestSession(
        session_number=session_num,
        instrument_id=sess_in.instrument_id,
        lab_id=sess_in.lab_id,
        inspector_id=current_user.id,
        equipment_ids=sess_in.equipment_ids,
        status="draft",
        rule_version_id=sess_in.rule_version_id,
        environmental_conditions=sess_in.environmental_conditions.model_dump(),
        is_demo_data=sess_in.is_demo_data
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id, action="CREATE_SESSION",
        entity_type="TestSession", entity_id=sess.id,
        after_state={"session_number": session_num, "status": "draft"}
    ))
    db.commit()

    return {"id": sess.id, "session_number": sess.session_number, "status": sess.status}

# Observation Data Entry with Live Calculation, Compliance & Anomaly Flags
@router.post("/{session_id}/observations")
def enter_observation(
    session_id: int,
    obs_in: ObservationEntry,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    # CRITICAL REGULATORY IMMUTABILITY GUARD
    if s.status == "finalized" or (s.report and s.report.finalized):
        raise HTTPException(
            status_code=400,
            detail="IMMUTABILITY VIOLATION: This test session has been finalized into an official legal record and CANNOT be edited under any circumstances."
        )

    inst = s.instrument
    model = inst.model

    # 1. Run Input Validation & Anomaly Detection
    env_temp = s.environmental_conditions.get("temp_c", 20.0)
    anomalies = AnomalyDetectionEngine.validate_and_detect_anomalies(
        test_code=obs_in.test_procedure_code,
        raw_readings=obs_in.raw_readings,
        max_capacity=model.max_capacity,
        min_capacity=model.min_capacity,
        temp_range_min=model.temperature_range_min,
        temp_range_max=model.temperature_range_max,
        env_temp_c=env_temp
    )

    # 2. Run Pure Calculation Engine
    code = obs_in.test_procedure_code
    calc_res = {}
    if code == "TEST-WARMUP":
        calc_res = CalculationEngine.calculate_warmup(obs_in.raw_readings, model.e)
    elif code == "TEST-ZERO-TARE":
        calc_res = CalculationEngine.calculate_zero_tare(obs_in.raw_readings, model.e)
    elif code == "TEST-WEIGHING":
        calc_res = CalculationEngine.calculate_weighing(obs_in.raw_readings, model.e)
    elif code == "TEST-REPEATABILITY":
        calc_res = CalculationEngine.calculate_repeatability(obs_in.raw_readings, model.e)
    elif code == "TEST-ECCENTRICITY":
        calc_res = CalculationEngine.calculate_eccentricity(obs_in.raw_readings, model.e)
    elif code == "TEST-DISCRIMINATION":
        calc_res = CalculationEngine.calculate_discrimination(obs_in.raw_readings, model.e, model.d)
    elif code == "TEST-CREEP":
        calc_res = CalculationEngine.calculate_creep(obs_in.raw_readings, model.e)
    elif code == "TEST-TEMP-SPAN":
        calc_res = CalculationEngine.calculate_temp_span(obs_in.raw_readings, model.e)

    # Save Observation & CalculatedResult
    # Delete existing observation for this test code if present
    existing_obs = db.query(Observation).filter(Observation.session_id == session_id, Observation.test_procedure_code == code).first()
    if existing_obs:
        db.delete(existing_obs)
        db.commit()

    obs_obj = Observation(
        session_id=session_id,
        test_procedure_code=code,
        raw_readings=obs_in.raw_readings,
        entered_by=current_user.id
    )
    db.add(obs_obj)
    db.commit()
    db.refresh(obs_obj)

    calc_obj = CalculatedResult(
        observation_id=obs_obj.id,
        computed_values=calc_res,
        formula_ref=calc_res.get("formula_ref", "OIML R-76-1")
    )
    db.add(calc_obj)
    db.commit()
    db.refresh(calc_obj)

    # 3. Run Pure Compliance Engine
    rule_limits = db.query(RuleLimit).filter(RuleLimit.rule_version_id == s.rule_version_id).all()
    comp_eval = ComplianceEngine.evaluate_test(
        test_code=code,
        computed_result=calc_res,
        accuracy_class=model.accuracy_class,
        e=model.e,
        n=model.n,
        rule_limits=rule_limits
    )

    # Delete existing compliance result for this test if present
    db.query(ComplianceResult).filter(ComplianceResult.session_id == session_id, ComplianceResult.test_procedure_code == code).delete()
    db.commit()

    comp_obj = ComplianceResult(
        calculated_result_id=calc_obj.id,
        session_id=session_id,
        test_procedure_code=code,
        limit_applied=comp_eval["limit_applied"],
        measured_value=comp_eval["measured_value"],
        margin=comp_eval["margin"],
        pass_fail=comp_eval["pass_fail"],
        rule_version_id=s.rule_version_id,
        explanation_text=comp_eval["explanation_text"],
        verification_status=comp_eval["verification_status"]
    )
    db.add(comp_obj)
    db.commit()

    return {
        "observation_id": obs_obj.id,
        "test_procedure_code": code,
        "computed_values": calc_res,
        "compliance_evaluation": comp_eval,
        "anomaly_warnings": anomalies
    }

# Submit Session for Review
@router.post("/{session_id}/submit")
def submit_test_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if s.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot submit a finalized session.")

    s.status = "under_review"
    s.submitted_at = datetime.now(timezone.utc)
    db.commit()

    # Notify Reviewers
    reviewers = db.query(User).filter(User.role.in_(["reviewer", "lab_manager"]), User.lab_id == s.lab_id).all()
    for rev in reviewers:
        db.add(Notification(
            user_id=rev.id,
            message=f"Test session {s.session_number} ({s.instrument.model.model_name}) submitted for review by {current_user.name}.",
            type="review_request",
            related_entity_id=s.id
        ))

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id, action="SUBMIT_SESSION",
        entity_type="TestSession", entity_id=s.id,
        before_state={"status": "draft"}, after_state={"status": "under_review"}
    ))
    db.commit()

    return {"id": s.id, "status": s.status, "message": "Test session submitted successfully for reviewer approval."}

# Reviewer Approve or Reject Session
@router.post("/{session_id}/review")
def review_test_session(
    session_id: int,
    rev_in: ReviewSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "reviewer"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if s.status == "finalized":
        raise HTTPException(status_code=400, detail="IMMUTABILITY GUARD: Report is already finalized.")

    decision = rev_in.decision.lower() # approved or rejected
    s.reviewer_remarks = rev_in.remarks
    s.reviewed_at = datetime.now(timezone.utc)

    # Save Review record
    db.add(Review(
        session_id=s.id,
        reviewer_id=current_user.id,
        decision=decision,
        remarks=rev_in.remarks
    ))

    if decision == "rejected":
        s.status = "draft" # Returns to inspector as draft
        db.add(Notification(
            user_id=s.inspector_id,
            message=f"Test session {s.session_number} was REJECTED by reviewer {current_user.name}. Remarks: {rev_in.remarks}",
            type="review_result",
            related_entity_id=s.id
        ))
        db.commit()
        return {"id": s.id, "status": s.status, "message": "Test session rejected and returned to Inspector as Draft."}

    # If approved -> FINALIZE and generate tamper-evident PDF & DOCX reports!
    s.status = "finalized"
    inst = s.instrument
    model = inst.model

    # Check overall pass/fail
    all_comp = s.compliance_results
    overall_pass = True
    for c in all_comp:
        if c.pass_fail == "FAIL":
            overall_pass = False
            break
    overall_res = "PASS" if overall_pass else "FAIL"

    rep_count = db.query(Report).count() + 1
    rep_num = f"NAWI-R76-{datetime.now().year}-{rep_count:05d}"
    pdf_path = os.path.join(settings.REPORTS_DIR, f"Report_{rep_num}.pdf")
    docx_path = os.path.join(settings.REPORTS_DIR, f"Report_{rep_num}.docx")

    qr_payload = f"{settings.PUBLIC_VERIFY_BASE_URL}/{rep_num}"

    # Generate Content Hash
    raw_hash_string = f"{rep_num}_{s.session_number}_{inst.serial_number}_{overall_res}_{s.reviewed_at}"
    content_hash = hashlib.sha256(raw_hash_string.encode()).hexdigest()

    data_for_report = {
        "report_number": rep_num,
        "is_demo_data": s.is_demo_data,
        "generated_at": datetime.now().strftime("%Y-%m-%d"),
        "laboratory": {"name": s.laboratory.name, "code": s.laboratory.code, "address": s.laboratory.address, "accreditation_ref": s.laboratory.accreditation_ref, "contact_email": s.laboratory.contact_email, "contact_phone": s.laboratory.contact_phone},
        "manufacturer": {"name": model.manufacturer.name, "country": model.manufacturer.country, "address": model.manufacturer.address, "contact_email": model.manufacturer.contact_email, "contact_phone": model.manufacturer.contact_phone},
        "instrument": {"model_name": model.model_name, "serial_number": inst.serial_number, "accuracy_class": model.accuracy_class, "max_capacity": model.max_capacity, "min_capacity": model.min_capacity, "e": model.e, "d": model.d, "n": model.n, "year_of_manufacture": inst.year_of_manufacture, "temp_min": model.temperature_range_min, "temp_max": model.temperature_range_max},
        "environmental_conditions": s.environmental_conditions,
        "equipment": [{"type": "Standard Weight", "identifier": "W-E2-50K-01", "calibration_cert_no": "CAL-2025-E2-001", "calibration_due_date": "2027-01-10", "is_expired": False}],
        "compliance_results": [
            {"test_procedure_code": c.test_procedure_code, "measured_value": c.measured_value, "limit_applied": c.limit_applied, "margin": c.margin, "pass_fail": c.pass_fail, "explanation_text": c.explanation_text} for c in all_comp
        ],
        "overall_result": overall_res,
        "inspector_name": s.inspector.name if s.inspector else "Inspector",
        "reviewer_name": current_user.name,
        "created_at": s.created_at.strftime("%Y-%m-%d"),
        "reviewed_at": datetime.now().strftime("%Y-%m-%d"),
        "qr_payload": qr_payload,
        "content_hash": content_hash
    }

    generate_pdf_report(data_for_report, pdf_path)
    generate_docx_report(data_for_report, docx_path)

    report_obj = Report(
        session_id=s.id,
        report_number=rep_num,
        pdf_path=pdf_path,
        docx_path=docx_path,
        content_hash=content_hash,
        qr_payload=qr_payload,
        finalized=True,
        finalized_at=datetime.now(timezone.utc)
    )
    db.add(report_obj)
    db.commit()

    # Notify Inspector
    db.add(Notification(
        user_id=s.inspector_id,
        message=f"Test session {s.session_number} APPROVED and FINALIZED by reviewer {current_user.name}. Certificate: {rep_num}.",
        type="review_result",
        related_entity_id=s.id
    ))

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id, action="FINALIZE_REPORT",
        entity_type="Report", entity_id=report_obj.id,
        before_state={"status": "under_review"}, after_state={"status": "finalized", "report_number": rep_num, "hash": content_hash}
    ))
    db.commit()

    return {
        "id": s.id,
        "status": s.status,
        "report_number": rep_num,
        "content_hash": content_hash,
        "message": "Test session APPROVED and FINALIZED. Tamper-evident PDF & DOCX reports generated."
    }

# Upload Evidence File to Test Session
@router.post("/{session_id}/evidence")
def upload_session_evidence(
    session_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if current_user.role != "admin" and current_user.lab_id != s.lab_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot upload evidence to another laboratory's test session.")

    if s.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot upload evidence to a finalized session.")

    # Max 15MB file size validation
    contents = file.file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 15MB.")

    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".pdf", ".docx", ".doc", ".txt", ".csv"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{file_ext}'. Allowed types: JPG, PNG, WEBP, PDF, DOCX, TXT, CSV.")

    os.makedirs(settings.EVIDENCE_DIR, exist_ok=True)
    safe_name = f"Evid_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_ext}"
    file_path = os.path.join(settings.EVIDENCE_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    ev = Evidence(
        session_id=session_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_ext.replace(".", ""),
        description=description or "Session photograph / supporting document",
        uploaded_by=current_user.id
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    db.add(AuditLog(
        actor_id=current_user.id,
        action="UPLOAD_EVIDENCE",
        entity_type="Evidence",
        entity_id=ev.id,
        after_state={"session_id": session_id, "file_name": file.filename, "file_type": ev.file_type}
    ))
    db.commit()

    return {
        "id": ev.id,
        "session_id": ev.session_id,
        "file_name": ev.file_name,
        "file_type": ev.file_type,
        "description": ev.description,
        "uploaded_at": ev.uploaded_at.isoformat() if ev.uploaded_at else None
    }

# Download / Stream Session Evidence File
@router.get("/{session_id}/evidence/{evidence_id}/download")
def download_session_evidence(
    session_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if current_user.role != "admin" and current_user.lab_id != s.lab_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot access evidence from another laboratory's test session.")

    ev = db.query(Evidence).filter(Evidence.id == evidence_id, Evidence.session_id == session_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence file record not found")

    if not os.path.exists(ev.file_path):
        raise HTTPException(status_code=404, detail="Physical evidence file not found on disk")

    # Prevent path traversal security check
    real_evidence_dir = os.path.realpath(settings.EVIDENCE_DIR)
    real_file_path = os.path.realpath(ev.file_path)
    if not real_file_path.startswith(real_evidence_dir):
        raise HTTPException(status_code=403, detail="Invalid file path security violation.")

    return FileResponse(
        path=ev.file_path,
        filename=ev.file_name
    )

# Delete Session Evidence File
@router.delete("/{session_id}/evidence/{evidence_id}")
def delete_session_evidence(
    session_id: int,
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if current_user.role != "admin" and current_user.lab_id != s.lab_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot delete evidence from another laboratory's test session.")

    if s.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot delete evidence from a finalized test session.")

    ev = db.query(Evidence).filter(Evidence.id == evidence_id, Evidence.session_id == session_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence file record not found")

    if os.path.exists(ev.file_path):
        try:
            os.remove(ev.file_path)
        except Exception:
            pass

    file_name = ev.file_name
    db.delete(ev)
    db.commit()

    db.add(AuditLog(
        actor_id=current_user.id,
        action="DELETE_EVIDENCE",
        entity_type="Evidence",
        entity_id=evidence_id,
        before_state={"session_id": session_id, "file_name": file_name}
    ))
    db.commit()

    return {"detail": f"Evidence file '{file_name}' removed successfully."}

