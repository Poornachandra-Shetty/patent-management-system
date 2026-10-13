"""
Notification Services
=====================
Service functions for creating notifications.
"""

from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction

from apps.patents.models import PatentApplication, PatentApplicationStatus
from apps.notifications.models import Notification, NotificationEventType
from apps.reviews.models import Remark

User = get_user_model()


@transaction.atomic
def create_status_change_notification(
    *,
    patent: PatentApplication,
    from_status: str,
    to_status: str,
    performed_by: User,
    note: str = '',
) -> list[Notification]:
    """
    Create notifications for a patent status change.

    Notifies:
    - The patent applicant (always, unless they disabled status_change_in_app)
    - The assigned consultant (if one exists and transition is relevant,
      unless they disabled status_change_in_app)
    - Admins (via their inbox preference, optional)

    Args:
        patent: PatentApplication that changed status
        from_status: Previous status
        to_status: New status
        performed_by: User who performed the transition
        note: Optional note explaining the transition

    Returns:
        List of created Notification objects
    """
    from apps.notifications.models import NotificationPreference

    notifications: list[Notification] = []

    # Build notification title and message
    status_display = dict(PatentApplicationStatus.choices).get(to_status, to_status)
    title = f"Patent {patent.patent_id} - Status Changed to {status_display}"
    message = f"Your patent '{patent.title}' status has changed from {from_status} to {to_status}."
    if note:
        message += f"\n\nNote: {note}"

    # Notify the applicant (unless they opted out)
    if patent.applicant.is_active:
        pref = NotificationPreference.for_user(patent.applicant)
        if pref.status_change_in_app:
            notification = Notification.objects.create(
                recipient=patent.applicant,
                title=title,
                message=message,
                event_type=NotificationEventType.STATUS_CHANGE,
                related_application=patent,
            )
            notifications.append(notification)

    # Notify the assigned consultant if status is UNDER_SCRUTINY or FORWARDED_TO_CONSULTANT
    if (patent.assigned_to and
        patent.assigned_to.is_active and
        patent.assigned_to != patent.applicant and
        to_status in [PatentApplicationStatus.FORWARDED_TO_CONSULTANT, PatentApplicationStatus.UNDER_SCRUTINY]):
        pref = NotificationPreference.for_user(patent.assigned_to)
        if pref.status_change_in_app:
            notification = Notification.objects.create(
                recipient=patent.assigned_to,
                title=title,
                message=f"Patent '{patent.title}' ({patent.patent_id}) requires your attention. Status: {to_status}",
                event_type=NotificationEventType.STATUS_CHANGE,
                related_application=patent,
            )
            notifications.append(notification)

    return notifications


@transaction.atomic
def create_remark_notification(
    *,
    remark: Remark,
) -> Optional[Notification]:
    """
    Create a notification for a new remark.

    Notifies:
    - The patent applicant (if remark is visible_to_applicant and they have
      remark_added_in_app enabled)
    - The assigned consultant/scrutinizer (if appropriate and preference enabled)

    Args:
        remark: Remark object that was created

    Returns:
        Created Notification object, or None if no notification was created
    """
    from apps.notifications.models import NotificationPreference

    patent = remark.application

    # Determine recipient based on visibility and role
    recipient: Optional[User] = None

    if remark.visible_to_applicant and patent.applicant.is_active and patent.applicant != remark.user:
        recipient = patent.applicant
    elif not remark.visible_to_applicant and patent.assigned_to and patent.assigned_to.is_active:
        recipient = patent.assigned_to

    if not recipient:
        return None

    # Respect recipient's preference
    pref = NotificationPreference.for_user(recipient)
    if not pref.remark_added_in_app:
        return None

    # Build notification title and message
    remark_action = remark.get_action_display() if remark.action else 'Comment'
    title = f"New Remark: {remark_action} on Patent {patent.patent_id}"
    message = f"A new remark has been added to patent '{patent.title}':\n\n{remark.text}"

    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        event_type=NotificationEventType.REMARK_ADDED,
        related_application=patent,
    )

    return notification
