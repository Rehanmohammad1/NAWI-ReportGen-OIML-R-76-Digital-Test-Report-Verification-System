from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, TestSession, ComplianceResult, Instrument, InstrumentModel, Equipment, Report

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard-summary")
def get_dashboard_summary(lab_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q_sess = db.query(TestSession)
    q_eq = db.query(Equipment)

    if current_user.role != "admin" and current_user.lab_id:
        q_sess = q_sess.filter(TestSession.lab_id == current_user.lab_id)
        q_eq = q_eq.filter(Equipment.lab_id == current_user.lab_id)
    elif lab_id:
        q_sess = q_sess.filter(TestSession.lab_id == lab_id)
        q_eq = q_eq.filter(Equipment.lab_id == lab_id)

    total_sessions = q_sess.count()
    draft_count = q_sess.filter(TestSession.status == "draft").count()
    submitted_count = q_sess.filter(TestSession.status == "submitted").count()
    under_review_count = q_sess.filter(TestSession.status == "under_review").count()
    finalized_count = q_sess.filter(TestSession.status == "finalized").count()

    today_str = datetime.now().strftime("%Y-%m-%d")
    all_eq = q_eq.all()
    expired_eq_count = sum(1 for eq in all_eq if eq.calibration_due_date < today_str)

    recent_sessions = q_sess.order_by(TestSession.created_at.desc()).limit(5).all()
    recent_list = []
    for s in recent_sessions:
        inst = s.instrument
        model = inst.model if inst else None
        recent_list.append({
            "id": s.id,
            "session_number": s.session_number,
            "model_name": model.model_name if model else "N/A",
            "serial_number": inst.serial_number if inst else "N/A",
            "status": s.status,
            "created_at": s.created_at
        })

    return {
        "total_sessions": total_sessions,
        "draft_count": draft_count,
        "submitted_count": submitted_count,
        "under_review_count": under_review_count,
        "finalized_count": finalized_count,
        "expired_equipment_count": expired_eq_count,
        "recent_sessions": recent_list
    }

@router.get("/failure-patterns")
def get_failure_patterns(lab_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Failure pattern analytics: counts of test procedure failures across all historical sessions.
    """
    comp_query = db.query(ComplianceResult).join(TestSession)
    if current_user.role != "admin" and current_user.lab_id:
        comp_query = comp_query.filter(TestSession.lab_id == current_user.lab_id)
    elif lab_id:
        comp_query = comp_query.filter(TestSession.lab_id == lab_id)

    failures = comp_query.filter(ComplianceResult.pass_fail == "FAIL").all()

    by_test = {}
    by_class = {}

    for f in failures:
        t_code = f.test_procedure_code
        by_test[t_code] = by_test.get(t_code, 0) + 1

        s = f.session
        inst = s.instrument
        ac = inst.model.accuracy_class if (inst and inst.model) else "III"
        by_class[ac] = by_class.get(ac, 0) + 1

    return {
        "total_test_failures": len(failures),
        "failures_by_test_procedure": [{"procedure": k, "count": v} for k, v in by_test.items()],
        "failures_by_accuracy_class": [{"accuracy_class": k, "count": v} for k, v in by_class.items()]
    }

@router.get("/instrument-history/{model_id}")
def get_instrument_history(model_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Instrument-wise historical analysis & cross-report comparison.
    """
    model_obj = db.query(InstrumentModel).filter(InstrumentModel.id == model_id).first()
    if not model_obj:
        return {"error": "Instrument model not found"}

    sessions = db.query(TestSession).join(Instrument).filter(Instrument.model_id == model_id).order_by(TestSession.created_at.asc()).all()

    history_points = []
    for s in sessions:
        inst = s.instrument
        rep = s.report
        all_pass = all(c.pass_fail == "PASS" for c in s.compliance_results) if s.compliance_results else True
        
        # Extract max weighing error or repeatability spread for drift graph
        max_err = 0.0
        for c in s.compliance_results:
            if c.measured_value > max_err:
                max_err = c.measured_value

        history_points.append({
            "session_id": s.id,
            "session_number": s.session_number,
            "serial_number": inst.serial_number,
            "date": s.created_at.strftime("%Y-%m-%d"),
            "status": s.status,
            "overall_result": "PASS" if all_pass else "FAIL",
            "max_measured_error_e": max_err,
            "report_number": rep.report_number if rep else None
        })

    return {
        "model_id": model_id,
        "model_name": model_obj.model_name,
        "manufacturer_name": model_obj.manufacturer.name if model_obj.manufacturer else "N/A",
        "accuracy_class": model_obj.accuracy_class,
        "history_count": len(history_points),
        "history_timeline": history_points
    }
