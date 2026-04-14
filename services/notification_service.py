"""
services/notification_service.py
Helper to create notifications for key events.
"""
from database.db import db
from database.models import Notification


def create_notification(user_id: int, title: str, message: str,
                        notif_type: str = "info", link: str = None) -> Notification:
    """Create and persist a notification for a user."""
    n = Notification(
        user_id    = user_id,
        title      = title,
        message    = message,
        notif_type = notif_type,
        link       = link,
    )
    db.session.add(n)
    db.session.commit()
    return n
