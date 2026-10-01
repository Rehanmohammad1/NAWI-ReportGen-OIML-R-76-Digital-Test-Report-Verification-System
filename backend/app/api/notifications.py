from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Notification

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])

@router.get("")
def get_user_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(20).all()
    res = []
    for n in notes:
        res.append({
            "id": n.id,
            "message": n.message,
            "type": n.type,
            "related_entity_id": n.related_entity_id,
            "read": n.read,
            "created_at": n.created_at
        })
    return res

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if n:
        n.read = True
        db.commit()
    return {"status": "success"}
