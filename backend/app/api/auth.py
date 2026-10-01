from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.schemas.schemas import LoginRequest, TokenResponse, UserResponse, UserRegisterRequest
from app.models.models import User, Laboratory, AuditLog

router = APIRouter(prefix="/auth", tags=["Authentication"])

VALID_ROLES = {"admin", "lab_manager", "inspector", "reviewer"}

@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not user.active or getattr(user, 'status', 'active') != 'active':
        st = getattr(user, 'status', 'inactive')
        if st == 'pending':
            detail_msg = "Your account registration is pending administrative approval."
        elif st == 'rejected':
            detail_msg = "Your account registration request was rejected by Administrator."
        else:
            detail_msg = "User account is inactive."
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_msg
        )
    
    access_token = create_access_token(subject=user.id, role=user.role, lab_id=user.lab_id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "lab_id": user.lab_id,
            "lab_name": user.laboratory.name if user.laboratory else "All Laboratories (Admin)"
        }
    }

@router.post("/register")
def register(reg_data: UserRegisterRequest, db: Session = Depends(get_db)):
    if not reg_data.name or not reg_data.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    
    clean_email = reg_data.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"DUPLICATE EMAIL: Email '{clean_email}' is already registered.")

    if len(reg_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    if reg_data.requested_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid requested role. Must be one of: {', '.join(VALID_ROLES)}")

    new_user = User(
        name=reg_data.name.strip(),
        email=clean_email,
        password_hash=hash_password(reg_data.password),
        role=reg_data.requested_role,
        lab_id=reg_data.lab_id if reg_data.requested_role != "admin" else None,
        status="pending",
        active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db.add(AuditLog(
        actor_id=None,
        action="USER_REGISTERED",
        entity_type="User",
        entity_id=new_user.id,
        after_state={
            "name": new_user.name,
            "email": new_user.email,
            "requested_role": new_user.role,
            "lab_id": new_user.lab_id,
            "status": "pending"
        }
    ))
    db.commit()

    return {
        "message": "Registration submitted successfully. Your account is pending administrative approval.",
        "status": "pending",
        "email": new_user.email
    }

@router.get("/laboratories")
def public_laboratories(db: Session = Depends(get_db)):
    labs = db.query(Laboratory).all()
    return [{"id": l.id, "name": l.name, "code": l.code} for l in labs]

