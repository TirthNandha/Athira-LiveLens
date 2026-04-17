from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import get_current_user
from app.database import supabase
from app.models import SessionCreate, SessionUpdate, SessionOut

router = APIRouter(prefix="/sessions", tags=["sessions"])


def _enrich_sessions(rows: list[dict]) -> list[dict]:
    """Attach student_name and tutor_name to each session row."""
    student_ids = list({r["student_id"] for r in rows})
    tutor_ids = list({r["tutor_id"] for r in rows})
    all_ids = list(set(student_ids + tutor_ids))

    if not all_ids:
        return rows

    users_result = (
        supabase.table("users")
        .select("id, full_name")
        .in_("id", all_ids)
        .execute()
    )
    name_map = {u["id"]: u["full_name"] for u in users_result.data}

    for r in rows:
        r["student_name"] = name_map.get(r["student_id"], "Unknown")
        r["tutor_name"] = name_map.get(r["tutor_id"], "Unknown")
    return rows


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(body: SessionCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request sessions",
        )

    row = {
        "student_id": current_user["user_id"],
        "tutor_id": body.tutor_id,
        "subject": body.subject,
        "scheduled_at": body.scheduled_at,
        "duration_minutes": body.duration_minutes,
        "note": body.note,
        "status": "pending",
    }
    result = supabase.table("sessions").insert(row).execute()
    enriched = _enrich_sessions(result.data)
    return SessionOut(**enriched[0])


@router.get("", response_model=list[SessionOut])
def list_sessions(current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    user_id = current_user["user_id"]

    if role == "student":
        result = (
            supabase.table("sessions")
            .select("*")
            .eq("student_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    else:
        result = (
            supabase.table("sessions")
            .select("*")
            .eq("tutor_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

    enriched = _enrich_sessions(result.data)
    return [SessionOut(**s) for s in enriched]


@router.patch("/{session_id}", response_model=SessionOut)
def update_session_status(
    session_id: str,
    body: SessionUpdate,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "tutor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tutors can accept/reject sessions",
        )
    if body.status not in ("accepted", "rejected"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'accepted' or 'rejected'",
        )

    existing = (
        supabase.table("sessions")
        .select("*")
        .eq("id", session_id)
        .eq("tutor_id", current_user["user_id"])
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if existing.data[0]["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update pending sessions",
        )

    result = (
        supabase.table("sessions")
        .update({"status": body.status})
        .eq("id", session_id)
        .execute()
    )
    enriched = _enrich_sessions(result.data)
    return SessionOut(**enriched[0])
