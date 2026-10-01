from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Equipment
from app.schemas.schemas import EquipmentCreate, EquipmentResponse

router = APIRouter(prefix="/equipment", tags=["Reference Equipment"])

@router.get("", response_model=List[EquipmentResponse])
def list_equipment(lab_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Equipment)

    if current_user.role != "admin" and current_user.lab_id:
        query = query.filter(Equipment.lab_id == current_user.lab_id)
    elif lab_id:
        query = query.filter(Equipment.lab_id == lab_id)

    items = query.all()
    today_str = datetime.now().strftime("%Y-%m-%d")
    res = []
    for eq in items:
        is_exp = eq.calibration_due_date < today_str
        res.append({
            "id": eq.id,
            "lab_id": eq.lab_id,
            "type": eq.type,
            "identifier": eq.identifier,
            "calibration_cert_no": eq.calibration_cert_no,
            "calibration_date": eq.calibration_date,
            "calibration_due_date": eq.calibration_due_date,
            "status": "expired" if is_exp else eq.status,
            "is_expired": is_exp
        })
    return res

@router.post("", response_model=EquipmentResponse)
def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "lab_manager"]))
):
    eq = Equipment(**eq_in.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)

    today_str = datetime.now().strftime("%Y-%m-%d")
    is_exp = eq.calibration_due_date < today_str
    return {
        "id": eq.id,
        "lab_id": eq.lab_id,
        "type": eq.type,
        "identifier": eq.identifier,
        "calibration_cert_no": eq.calibration_cert_no,
        "calibration_date": eq.calibration_date,
        "calibration_due_date": eq.calibration_due_date,
        "status": "expired" if is_exp else eq.status,
        "is_expired": is_exp
    }
