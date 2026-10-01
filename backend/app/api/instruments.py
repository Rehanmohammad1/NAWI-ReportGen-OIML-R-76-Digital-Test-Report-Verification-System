from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Manufacturer, InstrumentModel, Instrument, TestProcedure
from app.schemas.schemas import (
    ManufacturerCreate, ManufacturerResponse,
    InstrumentModelCreate, InstrumentModelResponse,
    InstrumentCreate, InstrumentResponse
)

router = APIRouter(prefix="/instruments", tags=["Instruments"])

# Manufacturers
@router.get("/manufacturers", response_model=List[ManufacturerResponse])
def get_manufacturers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Manufacturer).all()

@router.post("/manufacturers", response_model=ManufacturerResponse)
def create_manufacturer(mfg_in: ManufacturerCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))):
    existing = db.query(Manufacturer).filter(Manufacturer.name == mfg_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Manufacturer with this name already exists")
    mfg = Manufacturer(**mfg_in.model_dump())
    db.add(mfg)
    db.commit()
    db.refresh(mfg)
    return mfg

# Instrument Models
@router.get("/models", response_model=List[InstrumentModelResponse])
def get_instrument_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    models = db.query(InstrumentModel).all()
    res = []
    for m in models:
        res.append({
            "id": m.id,
            "manufacturer_id": m.manufacturer_id,
            "manufacturer_name": m.manufacturer.name if m.manufacturer else "N/A",
            "model_name": m.model_name,
            "accuracy_class": m.accuracy_class,
            "max_capacity": m.max_capacity,
            "min_capacity": m.min_capacity,
            "e": m.e,
            "d": m.d,
            "n": m.n,
            "temperature_range_min": m.temperature_range_min,
            "temperature_range_max": m.temperature_range_max,
            "tare_range_max": m.tare_range_max,
            "multi_interval": m.multi_interval,
            "tier_details": m.tier_details
        })
    return res

@router.post("/models", response_model=InstrumentModelResponse)
def create_instrument_model(model_in: InstrumentModelCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))):
    # Calculate scale intervals n = Max / e
    n = model_in.max_capacity / model_in.e
    m_dict = model_in.model_dump()
    model_obj = InstrumentModel(**m_dict, n=n)
    db.add(model_obj)
    db.commit()
    db.refresh(model_obj)
    return {
        "id": model_obj.id,
        "manufacturer_id": model_obj.manufacturer_id,
        "manufacturer_name": model_obj.manufacturer.name if model_obj.manufacturer else "N/A",
        "model_name": model_obj.model_name,
        "accuracy_class": model_obj.accuracy_class,
        "max_capacity": model_obj.max_capacity,
        "min_capacity": model_obj.min_capacity,
        "e": model_obj.e,
        "d": model_obj.d,
        "n": model_obj.n,
        "temperature_range_min": model_obj.temperature_range_min,
        "temperature_range_max": model_obj.temperature_range_max,
        "tare_range_max": model_obj.tare_range_max,
        "multi_interval": model_obj.multi_interval,
        "tier_details": model_obj.tier_details
    }

# Instruments
@router.get("", response_model=List[InstrumentResponse])
def get_instruments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    instruments = db.query(Instrument).all()
    res = []
    for inst in instruments:
        res.append({
            "id": inst.id,
            "model_id": inst.model_id,
            "model_name": inst.model.model_name if inst.model else "N/A",
            "manufacturer_name": inst.model.manufacturer.name if inst.model and inst.model.manufacturer else "N/A",
            "accuracy_class": inst.model.accuracy_class if inst.model else "III",
            "serial_number": inst.serial_number,
            "year_of_manufacture": inst.year_of_manufacture,
            "is_demo_data": inst.is_demo_data
        })
    return res

@router.post("", response_model=InstrumentResponse)
def register_instrument(inst_in: InstrumentCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["admin", "lab_manager", "inspector"]))):
    # Duplicate instrument check (model_id + serial_number)
    existing = db.query(Instrument).filter(
        Instrument.model_id == inst_in.model_id,
        Instrument.serial_number == inst_in.serial_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"DUPLICATE DETECTED: Instrument serial number '{inst_in.serial_number}' is already registered for model ID {inst_in.model_id}."
        )

    inst = Instrument(**inst_in.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return {
        "id": inst.id,
        "model_id": inst.model_id,
        "model_name": inst.model.model_name if inst.model else "N/A",
        "manufacturer_name": inst.model.manufacturer.name if inst.model and inst.model.manufacturer else "N/A",
        "accuracy_class": inst.model.accuracy_class if inst.model else "III",
        "serial_number": inst.serial_number,
        "year_of_manufacture": inst.year_of_manufacture,
        "is_demo_data": inst.is_demo_data
    }

# Automatic Test Selection endpoint
@router.get("/suggest-tests/{model_id}")
def suggest_applicable_tests(model_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    model_obj = db.query(InstrumentModel).filter(InstrumentModel.id == model_id).first()
    if not model_obj:
        raise HTTPException(status_code=404, detail="Instrument model not found")

    all_procs = db.query(TestProcedure).all()
    applicable = []
    rationale_reasons = []

    for p in all_procs:
        # Match accuracy class
        if model_obj.accuracy_class in (p.applicable_classes or []):
            applicable.append({
                "code": p.code,
                "name": p.name,
                "description": p.description,
                "rationale": f"Prescribed for Accuracy Class {model_obj.accuracy_class} instruments under OIML R-76-1."
            })

    return {
        "model_name": model_obj.model_name,
        "accuracy_class": model_obj.accuracy_class,
        "max_capacity": model_obj.max_capacity,
        "e": model_obj.e,
        "n": model_obj.n,
        "multi_interval": model_obj.multi_interval,
        "suggested_test_count": len(applicable),
        "suggested_tests": applicable
    }
