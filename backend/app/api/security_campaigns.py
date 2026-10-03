from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.security_campaign import (
    CampaignCreate,
    CampaignEventRequest,
    CampaignEventResponse,
    CampaignListResponse,
    CampaignMetrics,
    CampaignResponse,
    CampaignRecipientResponse,
)
from app.services.security_campaign_service import (
    campaign_metrics,
    create_campaign,
    delete_user_campaign,
    get_user_campaign,
    list_user_campaigns,
    record_campaign_event,
    start_campaign,
)

router = APIRouter(prefix="/api/v1/security-campaigns", tags=["Security Awareness"])


def _response(db, campaign) -> CampaignResponse:
    return CampaignResponse(
        campaign_id=campaign.id,
        name=campaign.name,
        description=campaign.description,
        template_name=campaign.template_name,
        training_topic=campaign.training_topic,
        status=campaign.status,
        created_at=campaign.created_at,
        started_at=campaign.started_at,
        completed_at=campaign.completed_at,
        metrics=CampaignMetrics(**campaign_metrics(db, campaign)),
    )


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_security_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = create_campaign(
        db,
        current_user,
        data.name,
        data.description,
        data.template_name,
        data.training_topic,
        data.recipients,
    )
    return _response(db, campaign)


@router.get("", response_model=CampaignListResponse)
def list_security_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaigns = list_user_campaigns(db, current_user)
    return CampaignListResponse(
        total=len(campaigns),
        campaigns=[_response(db, campaign) for campaign in campaigns],
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_security_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = get_user_campaign(db, current_user, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Security campaign not found.")
    return _response(db, campaign)


@router.post("/{campaign_id}/start", response_model=CampaignResponse)
def activate_security_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        campaign = start_campaign(db, current_user, campaign_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if campaign is None:
        raise HTTPException(status_code=404, detail="Security campaign not found.")
    return _response(db, campaign)


@router.get("/{campaign_id}/recipients", response_model=list[CampaignRecipientResponse])
def list_recipients(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = get_user_campaign(db, current_user, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Security campaign not found.")
    return [
        CampaignRecipientResponse(
            recipient_id=r.id,
            email=r.email,
            display_name=r.display_name,
            status=r.status,
            event_count=r.event_count,
            training_completed=r.training_completed,
            created_at=r.created_at,
        )
        for r in campaign.recipients
    ]


@router.post("/{campaign_id}/recipients/{recipient_id}/events", response_model=CampaignEventResponse)
def record_authorized_event(
    campaign_id: int,
    recipient_id: int,
    data: CampaignEventRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = get_user_campaign(db, current_user, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Security campaign not found.")

    recipient = next((r for r in campaign.recipients if r.id == recipient_id), None)
    if recipient is None:
        raise HTTPException(status_code=404, detail="Campaign recipient not found.")

    event = record_campaign_event(
        db,
        recipient.tracking_token,
        data.event_type,
        data.metadata,
    )
    if event is None:
        raise HTTPException(status_code=409, detail="Campaign is not active.")
    return CampaignEventResponse(
        event_id=event.id, event_type=event.event_type, occurred_at=event.occurred_at
    )


@router.post("/{campaign_id}/complete", response_model=CampaignResponse)
def complete_security_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    campaign = get_user_campaign(db, current_user, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Security campaign not found.")
    if campaign.status != "ACTIVE":
        raise HTTPException(status_code=409, detail="Only active campaigns can be completed.")
    campaign.status = "COMPLETED"
    campaign.completed_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)
    db.commit()
    db.refresh(campaign)
    return _response(db, campaign)


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_security_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not delete_user_campaign(db, current_user, campaign_id):
        raise HTTPException(status_code=404, detail="Security campaign not found.")
