import os
import io
import csv
import json
from fastapi import APIRouter, Depends, HTTPException, status, Response, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Report, TestSession, Evidence, AuditLog
from app.core.config import settings

router = APIRouter(prefix="/reports", tags=["Reports Repository"])

# Search & Filter Repository
@router.get("")
def search_reports(
    status_filter: Optional[str] = None,
    accuracy_class: Optional[str] = None,
    manufacturer_id: Optional[int] = None,
    result_filter: Optional[str] = None, # PASS / FAIL
    search_query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Report).join(TestSession)

    # Row level laboratory scoping
    if current_user.role != "admin" and current_user.lab_id:
        query = query.filter(TestSession.lab_id == current_user.lab_id)

    if status_filter:
        query = query.filter(TestSession.status == status_filter)

    reports = query.order_by(Report.generated_at.desc()).all()
    res = []

    for r in reports:
        s = r.session
        inst = s.instrument
        model = inst.model if inst else None

        # Determine overall result
        all_comp = s.compliance_results
        overall_pass = True
        for c in all_comp:
            if c.pass_fail == "FAIL":
                overall_pass = False
                break
        overall_res = "PASS" if overall_pass else "FAIL"

        if result_filter and overall_res != result_filter:
            continue
        if accuracy_class and model and model.accuracy_class != accuracy_class:
            continue
        if manufacturer_id and model and model.manufacturer_id != manufacturer_id:
            continue
        if search_query:
            sq = search_query.lower()
            match = (
                sq in r.report_number.lower() or
                (model and sq in model.model_name.lower()) or
                (inst and sq in inst.serial_number.lower()) or
                (model and model.manufacturer and sq in model.manufacturer.name.lower())
            )
            if not match:
                continue

        res.append({
            "id": r.id,
            "session_id": s.id,
            "report_number": r.report_number,
            "generated_at": r.generated_at,
            "finalized": r.finalized,
            "finalized_at": r.finalized_at,
            "content_hash": r.content_hash,
            "qr_payload": r.qr_payload,
            "overall_result": overall_res,
            "instrument_serial": inst.serial_number if inst else "N/A",
            "model_name": model.model_name if model else "N/A",
            "manufacturer_name": model.manufacturer.name if model and model.manufacturer else "N/A",
            "accuracy_class": model.accuracy_class if model else "III",
            "lab_name": s.laboratory.name if s.laboratory else "N/A",
            "is_demo_data": s.is_demo_data
        })

    return res

# Export Report Repository as CSV
@router.get("/export/csv")
def export_reports_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Report).join(TestSession)
    if current_user.role != "admin" and current_user.lab_id:
        query = query.filter(TestSession.lab_id == current_user.lab_id)

    reports = query.order_by(Report.generated_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Report Number", "Session Number", "Generated Date", "Finalized",
        "Overall Result", "Manufacturer", "Model Name", "Accuracy Class",
        "Serial Number", "Laboratory", "Content SHA256 Hash", "Is Demo Data"
    ])

    for r in reports:
        s = r.session
        inst = s.instrument
        model = inst.model if inst else None
        overall_pass = True
        for c in s.compliance_results:
            if c.pass_fail == "FAIL":
                overall_pass = False
                break

        writer.writerow([
            r.report_number, s.session_number, r.generated_at.strftime("%Y-%m-%d"),
            r.finalized, "PASS" if overall_pass else "FAIL",
            model.manufacturer.name if model and model.manufacturer else "N/A",
            model.model_name if model else "N/A",
            model.accuracy_class if model else "N/A",
            inst.serial_number if inst else "N/A",
            s.laboratory.name if s.laboratory else "N/A",
            r.content_hash, s.is_demo_data
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=NAWI_Reports_Repository.csv"}
    )

# Export Single Report Record as JSON Interoperability Payload
@router.get("/{report_id}/export/json")
def export_single_report_json(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    s = r.session
    inst = s.instrument
    model = inst.model

    payload = {
        "report_number": r.report_number,
        "generated_at": r.generated_at.isoformat(),
        "finalized": r.finalized,
        "content_hash": r.content_hash,
        "qr_payload": r.qr_payload,
        "laboratory": {
            "name": s.laboratory.name,
            "code": s.laboratory.code,
            "accreditation_ref": s.laboratory.accreditation_ref
        },
        "manufacturer": {
            "name": model.manufacturer.name,
            "country": model.manufacturer.country
        },
        "instrument_specifications": {
            "model_name": model.model_name,
            "serial_number": inst.serial_number,
            "accuracy_class": model.accuracy_class,
            "max_capacity_kg": model.max_capacity,
            "min_capacity_kg": model.min_capacity,
            "e_kg": model.e,
            "d_kg": model.d,
            "n": model.n
        },
        "environmental_conditions": s.environmental_conditions,
        "compliance_results": [
            {
                "test_procedure_code": c.test_procedure_code,
                "measured_value_e": c.measured_value,
                "limit_applied": c.limit_applied,
                "margin_e": c.margin,
                "pass_fail": c.pass_fail,
                "explanation": c.explanation_text
            } for c in s.compliance_results
        ],
        "is_demo_data": s.is_demo_data
    }
    return Response(
        content=json.dumps(payload, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={r.report_number}.json"}
    )

from datetime import datetime
from app.services.pdf_generator import generate_pdf_report

# Download PDF Report File (Authenticated)
@router.get("/{report_id}/download/pdf")
def download_pdf_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Report).filter((Report.id == report_id) | (Report.session_id == report_id)).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report record not found")

    # Failsafe: if physical PDF file is missing from disk, regenerate dynamically
    if not r.pdf_path or not os.path.exists(r.pdf_path):
        s = r.session
        if s:
            inst = s.instrument
            model = inst.model if inst else None
            all_comp = s.compliance_results
            overall_pass = True
            for c in all_comp:
                if c.pass_fail == "FAIL":
                    overall_pass = False
                    break
            overall_res = "PASS" if overall_pass else "FAIL"

            os.makedirs(settings.REPORTS_DIR, exist_ok=True)
            pdf_path = os.path.join(settings.REPORTS_DIR, f"Report_{r.report_number}.pdf")
            data_for_report = {
                "report_number": r.report_number,
                "is_demo_data": s.is_demo_data,
                "generated_at": r.generated_at.strftime("%Y-%m-%d") if r.generated_at else datetime.now().strftime("%Y-%m-%d"),
                "laboratory": {"name": s.laboratory.name if s.laboratory else "N/A", "code": s.laboratory.code if s.laboratory else "N/A", "address": s.laboratory.address if s.laboratory else "N/A", "accreditation_ref": s.laboratory.accreditation_ref if s.laboratory else "N/A", "contact_email": s.laboratory.contact_email if s.laboratory else "N/A", "contact_phone": s.laboratory.contact_phone if s.laboratory else "N/A"},
                "manufacturer": {"name": model.manufacturer.name if model and model.manufacturer else "N/A", "country": model.manufacturer.country if model and model.manufacturer else "N/A", "address": model.manufacturer.address if model and model.manufacturer else "N/A", "contact_email": model.manufacturer.contact_email if model and model.manufacturer else "N/A", "contact_phone": model.manufacturer.contact_phone if model and model.manufacturer else "N/A"},
                "instrument": {"model_name": model.model_name if model else "N/A", "serial_number": inst.serial_number if inst else "N/A", "accuracy_class": model.accuracy_class if model else "III", "max_capacity": model.max_capacity if model else 0, "min_capacity": model.min_capacity if model else 0, "e": model.e if model else 0, "d": model.d if model else 0, "n": model.n if model else 0, "year_of_manufacture": inst.year_of_manufacture if inst else 2026, "temp_min": model.temperature_range_min if model else -10, "temp_max": model.temperature_range_max if model else 40},
                "environmental_conditions": s.environmental_conditions or {},
                "equipment": [{"type": "Standard Weight", "identifier": "W-E2-50K-01", "calibration_cert_no": "CAL-2025-E2-001", "calibration_due_date": "2027-01-10", "is_expired": False}],
                "compliance_results": [
                    {"test_procedure_code": c.test_procedure_code, "measured_value": c.measured_value, "limit_applied": c.limit_applied, "margin": c.margin, "pass_fail": c.pass_fail, "explanation_text": c.explanation_text} for c in all_comp
                ],
                "overall_result": overall_res,
                "inspector_name": s.inspector.name if s.inspector else "Inspector",
                "reviewer_name": "Approved Reviewer",
                "created_at": s.created_at.strftime("%Y-%m-%d") if s.created_at else "2026-09-25",
                "reviewed_at": r.finalized_at.strftime("%Y-%m-%d") if r.finalized_at else "2026-09-25",
                "qr_payload": r.qr_payload or f"{settings.PUBLIC_VERIFY_BASE_URL}/{r.report_number}",
                "content_hash": r.content_hash
            }
            generate_pdf_report(data_for_report, pdf_path)
            r.pdf_path = pdf_path
            db.commit()

    if not r.pdf_path or not os.path.exists(r.pdf_path):
        raise HTTPException(status_code=404, detail="PDF report file not found on server")

    # Audit log download action
    db.add(AuditLog(
        actor_id=current_user.id, action="DOWNLOAD_PDF_REPORT",
        entity_type="Report", entity_id=r.id,
        after_state={"report_number": r.report_number}
    ))
    db.commit()

    return FileResponse(
        r.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(r.pdf_path)
    )

# Download DOCX Report File (Authenticated)
@router.get("/{report_id}/download/docx")
def download_docx_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(Report).filter((Report.id == report_id) | (Report.session_id == report_id)).first()
    if not r or not os.path.exists(r.docx_path):
        raise HTTPException(status_code=404, detail="DOCX report file not found")

    # Audit log download action
    db.add(AuditLog(
        actor_id=current_user.id, action="DOWNLOAD_DOCX_REPORT",
        entity_type="Report", entity_id=r.id,
        after_state={"report_number": r.report_number}
    ))
    db.commit()

    return FileResponse(
        r.docx_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=os.path.basename(r.docx_path)
    )

# Upload Evidence File to Test Session
@router.post("/sessions/{session_id}/evidence")
def upload_evidence_file(
    session_id: int,
    file: UploadFile = File(...),
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))
):
    s = db.query(TestSession).filter(TestSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Test session not found")

    if s.status == "finalized":
        raise HTTPException(status_code=400, detail="Cannot upload evidence to a finalized session.")

    file_ext = os.path.splitext(file.filename)[1]
    safe_name = f"Evid_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_ext}"
    file_path = os.path.join(settings.EVIDENCE_DIR, safe_name)

    with open(file_path, "wb") as f:
        f.write(file.file.read())

    ev = Evidence(
        session_id=session_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_ext.replace(".", ""),
        description=description,
        uploaded_by=current_user.id
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)

    return {"id": ev.id, "file_name": ev.file_name, "uploaded_at": ev.uploaded_at}
