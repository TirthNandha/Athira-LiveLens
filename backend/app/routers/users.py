from fastapi import APIRouter, Depends, HTTPException, status
from app.auth import authenticate_user, create_access_token, get_current_user
from app.database import supabase
from app.models import LoginRequest, TokenResponse, UserOut

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest):
    user = authenticate_user(body.email, body.password)
    token = create_access_token(
        {"user_id": user["id"], "email": user["email"], "role": user["role"]}
    )
    return TokenResponse(
        access_token=token,
        user={
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "subject": user.get("subject"),
        },
    )


@router.get("/users/me", response_model=UserOut)
def get_me(current_user: dict = Depends(get_current_user)):
    result = (
        supabase.table("users")
        .select("*")
        .eq("id", current_user["user_id"])
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    user = result.data[0]
    return UserOut(**user)


@router.get("/users/tutors", response_model=list[UserOut])
def list_tutors(current_user: dict = Depends(get_current_user)):
    result = (
        supabase.table("users")
        .select("id, email, full_name, role, subject, created_at")
        .eq("role", "tutor")
        .execute()
    )
    return [UserOut(**t) for t in result.data]
