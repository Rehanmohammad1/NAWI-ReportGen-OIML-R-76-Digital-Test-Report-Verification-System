from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user, RoleChecker
from app.models.models import User, Laboratory, AuditLog
from app.schemas.schemas import (
    UserCreate, UserUpdate, UserResponse, PasswordResetRequest, 
    UserStatusToggleRequest, UserApproveRequest, UserRejectRequest
)
from app.core.security import hash_password

router = APIRouter(prefix="/users", tags=["User Management"])

VALID_ROLES = {"admin", "lab_manager", "inspector", "reviewer"}
LAB_BOUND_ROLES = {"lab_manager", "inspector", "reviewer"}

def format_user_response(user: User) -> Dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "lab_id": user.lab_id,
        "lab_name": user.laboratory.name if user.laboratory else ("All Laboratories (Admin)" if user.role == "admin" else "Unassigned"),
        "status": getattr(user, 'status', 'active' if user.active else 'inactive'),
        "active": user.active,
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }

# 1. GET /users — List all users across laboratories (Admin only)
@router.get("", response_model=List[UserResponse])
def list_users(
    role_filter: Optional[str] = None,
    lab_filter: Optional[int] = None,
    status_filter: Optional[str] = None,
    search_query: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    query = db.query(User)

    if role_filter:
        query = query.filter(User.role == role_filter)
    if lab_filter:
        query = query.filter(User.lab_id == lab_filter)
    if status_filter:
        query = query.filter(User.status == status_filter)
    if search_query:
        sq = f"%{search_query.strip().lower()}%"
        query = query.filter((User.name.ilike(sq)) | (User.email.ilike(sq)))

    users = query.order_by(User.created_at.desc()).all()
    return [format_user_response(u) for u in users]

# 2. GET /users/summary — User status & role counts summary (Admin only)
@router.get("/summary")
def get_users_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    all_users = db.query(User).all()
    total_users = len(all_users)
    pending_users = sum(1 for u in all_users if getattr(u, 'status', 'active') == 'pending')
    active_users = sum(1 for u in all_users if u.active and getattr(u, 'status', 'active') == 'active')
    inactive_users = total_users - active_users - pending_users

    by_role = {
        "admin": sum(1 for u in all_users if u.role == "admin"),
        "lab_manager": sum(1 for u in all_users if u.role == "lab_manager"),
        "inspector": sum(1 for u in all_users if u.role == "inspector"),
        "reviewer": sum(1 for u in all_users if u.role == "reviewer"),
    }

    return {
        "total_users": total_users,
        "active_users": active_users,
        "pending_users": pending_users,
        "inactive_users": inactive_users,
        "users_by_role": by_role
    }

@router.get("/laboratories")
def get_laboratories(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    labs = db.query(Laboratory).all()
    return [{"id": l.id, "name": l.name, "code": l.code} for l in labs]

# 3. GET /users/pending — List all pending registrations (Admin only)
@router.get("/pending", response_model=List[UserResponse])
def list_pending_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    pending_users = db.query(User).filter(User.status == "pending").order_by(User.created_at.desc()).all()
    return [format_user_response(u) for u in pending_users]

# 4. GET /users/{id} — Get single user detail (Admin only)
@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return format_user_response(u)

# 4. POST /users — Create new user (Admin only)
@router.post("", response_model=UserResponse)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    # Validation checks
    if not user_in.name or not user_in.name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")

    clean_email = user_in.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"DUPLICATE EMAIL: Email address '{clean_email}' is already registered to another user."
        )

    if len(user_in.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    if user_in.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}")

    if user_in.role in LAB_BOUND_ROLES:
        if not user_in.lab_id:
            raise HTTPException(status_code=400, detail=f"LABORATORY REQUIRED: A valid laboratory must be assigned for role '{user_in.role}'.")
        lab = db.query(Laboratory).filter(Laboratory.id == user_in.lab_id).first()
        if not lab:
            raise HTTPException(status_code=400, detail="Selected laboratory does not exist.")
    else:
        # Admin does not require lab_id
        pass

    new_user = User(
        name=user_in.name.strip(),
        email=clean_email,
        password_hash=hash_password(user_in.password),
        role=user_in.role,
        lab_id=user_in.lab_id if user_in.role in LAB_BOUND_ROLES else None,
        active=user_in.active
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="USER_CREATED",
        entity_type="User",
        entity_id=new_user.id,
        after_state={"name": new_user.name, "email": new_user.email, "role": new_user.role, "lab_id": new_user.lab_id}
    ))
    db.commit()

    return format_user_response(new_user)

# 5. PUT /users/{id} — Update user details (Admin only)
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    before_snapshot = {"name": u.name, "email": u.email, "role": u.role, "lab_id": u.lab_id, "active": u.active}

    # Name update
    if user_in.name is not None:
        if not user_in.name.strip():
            raise HTTPException(status_code=400, detail="Full name cannot be empty.")
        u.name = user_in.name.strip()

    # Email update
    if user_in.email is not None:
        clean_email = user_in.email.strip().lower()
        if clean_email != u.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"DUPLICATE EMAIL: Email '{clean_email}' is already in use.")
            u.email = clean_email

    # Role update
    target_role = user_in.role if user_in.role is not None else u.role
    if target_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role '{target_role}'.")

    # Prevent Admin self-demotion if only one admin left
    if u.id == current_user.id and target_role != "admin":
        admin_count = db.query(User).filter(User.role == "admin", User.active == True).count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="CANNOT DEMOTE: You are the sole active Administrator account.")
    u.role = target_role

    # Lab assignment
    if target_role in LAB_BOUND_ROLES:
        target_lab_id = user_in.lab_id if user_in.lab_id is not None else u.lab_id
        if not target_lab_id:
            raise HTTPException(status_code=400, detail=f"LABORATORY REQUIRED: Role '{target_role}' requires a laboratory assignment.")
        lab = db.query(Laboratory).filter(Laboratory.id == target_lab_id).first()
        if not lab:
            raise HTTPException(status_code=400, detail="Selected laboratory does not exist.")
        u.lab_id = target_lab_id
    else:
        u.lab_id = None

    # Status update
    if user_in.active is not None:
        if u.id == current_user.id and not user_in.active:
            raise HTTPException(status_code=400, detail="CANNOT DEACTIVATE: You cannot deactivate your own active account while logged in.")
        u.active = user_in.active

    u.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(u)

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="USER_UPDATED",
        entity_type="User",
        entity_id=u.id,
        before_state=before_snapshot,
        after_state={"name": u.name, "email": u.email, "role": u.role, "lab_id": u.lab_id, "active": u.active}
    ))
    db.commit()

    return format_user_response(u)

# 6. PATCH /users/{id}/status — Toggle Active/Inactive status (Admin only)
@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    status_in: UserStatusToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if u.id == current_user.id and not status_in.active:
        raise HTTPException(status_code=400, detail="CANNOT DEACTIVATE: You cannot deactivate your own logged-in account.")

    was_active = u.active
    u.active = status_in.active
    u.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(u)

    action_label = "USER_REACTIVATED" if status_in.active else "USER_DEACTIVATED"
    db.add(AuditLog(
        actor_id=current_user.id,
        action=action_label,
        entity_type="User",
        entity_id=u.id,
        before_state={"active": was_active},
        after_state={"active": u.active}
    ))
    db.commit()

    return format_user_response(u)

# 7. POST /users/{id}/reset-password — Reset User Password (Admin only)
@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    pass_in: PasswordResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if len(pass_in.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    u.password_hash = hash_password(pass_in.new_password)
    u.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="USER_PASSWORD_RESET",
        entity_type="User",
        entity_id=u.id,
        after_state={"email": u.email, "reset_at": datetime.now(timezone.utc).isoformat()}
    ))
    db.commit()

    return {"message": f"Password for user {u.email} has been reset successfully."}

# 9. POST /users/{user_id}/approve — Approve Pending User Registration (Admin only)
@router.post("/{user_id}/approve", response_model=UserResponse)
def approve_user_registration(
    user_id: int,
    approve_in: Optional[UserApproveRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if u.status != "pending" and u.active:
        raise HTTPException(status_code=400, detail="User is already active.")

    assigned_role = approve_in.role if (approve_in and approve_in.role) else u.role
    if assigned_role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid assigned role '{assigned_role}'.")

    assigned_lab_id = approve_in.lab_id if (approve_in and approve_in.lab_id is not None) else u.lab_id
    if assigned_role in LAB_BOUND_ROLES:
        if not assigned_lab_id:
            raise HTTPException(status_code=400, detail=f"LABORATORY REQUIRED: A valid laboratory must be assigned for role '{assigned_role}'.")
        lab = db.query(Laboratory).filter(Laboratory.id == assigned_lab_id).first()
        if not lab:
            raise HTTPException(status_code=400, detail="Assigned laboratory does not exist.")
    else:
        assigned_lab_id = None

    before_role = u.role
    before_lab = u.lab_id

    u.role = assigned_role
    u.lab_id = assigned_lab_id
    u.status = "active"
    u.active = True
    u.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(u)

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="USER_APPROVED",
        entity_type="User",
        entity_id=u.id,
        before_state={"role": before_role, "lab_id": before_lab, "status": "pending"},
        after_state={"role": u.role, "lab_id": u.lab_id, "status": "active", "active": True}
    ))
    db.commit()

    return format_user_response(u)

# 10. POST /users/{user_id}/reject — Reject Pending User Registration (Admin only)
@router.post("/{user_id}/reject", response_model=UserResponse)
def reject_user_registration(
    user_id: int,
    reject_in: Optional[UserRejectRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin"]))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    u.status = "rejected"
    u.active = False
    u.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(u)

    # Audit Log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="USER_REJECTED",
        entity_type="User",
        entity_id=u.id,
        after_state={"status": "rejected", "reason": reject_in.reason if reject_in else None}
    ))
    db.commit()

    return format_user_response(u)

