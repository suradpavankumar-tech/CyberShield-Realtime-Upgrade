import secrets
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.security_campaign import CampaignEvent, CampaignRecipient, SecurityCampaign
from app.models.user import User
from app.schemas.security_campaign import CampaignEventType, CampaignRecipientCreate


def create_campaign(
    db: Session,
    user: User,
    name: str,
    description: str | None,
    template_name: str,
    training_topic: str,
    recipients: list[CampaignRecipientCreate],
) -> SecurityCampaign:
    campaign = SecurityCampaign(
        user_id=user.id,
        name=name,
        description=description,
        template_name=template_name,
        training_topic=training_topic,
        status="DRAFT",
    )
    db.add(campaign)
    db.flush()

    for recipient in recipients:
        db.add(
            CampaignRecipient(
                campaign_id=campaign.id,
                email=str(recipient.email).lower(),
                display_name=recipient.display_name,
                tracking_token=secrets.token_urlsafe(32),
            )
        )

    db.commit()
    db.refresh(campaign)
    return campaign


def get_user_campaign(db: Session, user: User, campaign_id: int):
    return db.scalar(
        select(SecurityCampaign).where(
            SecurityCampaign.id == campaign_id,
            SecurityCampaign.user_id == user.id,
        )
    )


def list_user_campaigns(db: Session, user: User):
    return list(
        db.scalars(
            select(SecurityCampaign)
            .where(SecurityCampaign.user_id == user.id)
            .order_by(SecurityCampaign.created_at.desc())
        ).all()
    )


def start_campaign(db: Session, user: User, campaign_id: int) -> SecurityCampaign | None:
    campaign = get_user_campaign(db, user, campaign_id)
    if campaign is None:
        return None
    if campaign.status not in {"DRAFT", "COMPLETED"}:
        raise ValueError("Campaign can only be started from DRAFT or COMPLETED state.")
    campaign.status = "ACTIVE"
    campaign.started_at = datetime.now(timezone.utc)
    campaign.completed_at = None
    db.commit()
    db.refresh(campaign)
    return campaign


def record_campaign_event(
    db: Session,
    tracking_token: str,
    event_type: CampaignEventType,
    metadata: dict | None = None,
) -> CampaignEvent | None:
    recipient = db.scalar(
        select(CampaignRecipient).where(CampaignRecipient.tracking_token == tracking_token)
    )
    if recipient is None:
        return None

    campaign = recipient.campaign
    if campaign.status != "ACTIVE":
        return None

    event = CampaignEvent(
        recipient_id=recipient.id,
        event_type=event_type.value,
        event_metadata=metadata or {},
    )
    recipient.event_count += 1

    transitions = {
        "DELIVERED": "DELIVERED",
        "OPENED": "OPENED",
        "CLICKED": "CLICKED",
        "REPORTED": "REPORTED",
        "TRAINING_STARTED": "TRAINING",
        "TRAINING_COMPLETED": "TRAINED",
    }
    recipient.status = transitions.get(event_type.value, recipient.status)
    if event_type == CampaignEventType.TRAINING_COMPLETED:
        recipient.training_completed = True

    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def campaign_metrics(db: Session, campaign: SecurityCampaign) -> dict:
    recipient_ids = select(CampaignRecipient.id).where(
        CampaignRecipient.campaign_id == campaign.id
    )
    total = db.scalar(
        select(func.count(CampaignRecipient.id)).where(
            CampaignRecipient.campaign_id == campaign.id
        )
    ) or 0

    def count_event(event_type: str) -> int:
        return db.scalar(
            select(func.count(CampaignEvent.id)).where(
                CampaignEvent.recipient_id.in_(recipient_ids),
                CampaignEvent.event_type == event_type,
            )
        ) or 0

    delivered = count_event("DELIVERED")
    opened = count_event("OPENED")
    clicked = count_event("CLICKED")
    reported = count_event("REPORTED")
    training_started = count_event("TRAINING_STARTED")
    training_completed = count_event("TRAINING_COMPLETED")

    return {
        "recipients": total,
        "delivered": delivered,
        "opened": opened,
        "clicked": clicked,
        "reported": reported,
        "training_started": training_started,
        "training_completed": training_completed,
        "click_rate": round((clicked / total) * 100, 2) if total else 0.0,
        "report_rate": round((reported / total) * 100, 2) if total else 0.0,
        "training_completion_rate": round((training_completed / total) * 100, 2) if total else 0.0,
    }


def delete_user_campaign(db: Session, user: User, campaign_id: int) -> bool:
    campaign = get_user_campaign(db, user, campaign_id)
    if campaign is None:
        return False
    db.delete(campaign)
    db.commit()
    return True
