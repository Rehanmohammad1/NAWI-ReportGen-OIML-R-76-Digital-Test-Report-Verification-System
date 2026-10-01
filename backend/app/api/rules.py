from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, RuleVersion, RuleLimit
from app.schemas.schemas import RuleVersionCreate, RuleLimitCreate

router = APIRouter(prefix="/rules", tags=["Rule Engine Configuration"])

@router.get("/versions")
def get_rule_versions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    versions = db.query(RuleVersion).all()
    res = []
    for v in versions:
        res.append({
            "id": v.id,
            "standard": v.standard,
            "edition_label": v.edition_label,
            "effective_from": v.effective_from,
            "source_document": getattr(v, "source_document", "OIML Recommendation R 76-1 (2006 E)"),
            "source_url": getattr(v, "source_url", "https://www.oiml.org/en/files/pdf_r/r076-1-e06.pdf"),
            "is_active": v.is_active,
            "created_at": v.created_at,
            "limit_count": len(v.limits)
        })
    return res

@router.get("/limits")
def get_rule_limits(
    version_id: Optional[int] = None,
    accuracy_class: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(RuleLimit)
    if version_id:
        query = query.filter(RuleLimit.rule_version_id == version_id)
    if accuracy_class:
        query = query.filter(RuleLimit.accuracy_class == accuracy_class)

    limits = query.all()
    res = []
    for l in limits:
        res.append({
            "id": l.id,
            "rule_version_id": l.rule_version_id,
            "accuracy_class": l.accuracy_class,
            "test_procedure_code": l.test_procedure_code,
            "load_band_min_e": l.load_band_min_e,
            "load_band_max_e": l.load_band_max_e,
            "mpe_working_e": l.mpe_working_e,
            "mpe_type_eval_e": l.mpe_type_eval_e,
            "formula_ref": l.formula_ref,
            "verification_status": l.verification_status
        })
    return res

@router.post("/versions")
def create_rule_version(
    ver_in: RuleVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    rv = RuleVersion(**ver_in.model_dump())
    db.add(rv)
    db.commit()
    db.refresh(rv)
    return rv

@router.post("/limits")
def create_rule_limit(
    lim_in: RuleLimitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    rl = RuleLimit(**lim_in.model_dump())
    db.add(rl)
    db.commit()
    db.refresh(rl)
    return rl
