import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/ai", tags=["ai"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-4-maverick:free"


async def _chat(messages: list[dict], max_tokens: int = 1024) -> str:
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenRouter API key not configured",
        )
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://athira-livelens.dev",
        "X-Title": "Athira LiveLens",
    }
    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.text}")
    data = resp.json()
    return data["choices"][0]["message"]["content"]


# --- Concept Cards ---

class ConceptRequest(BaseModel):
    transcript_chunk: str
    subject: str = ""


class ConceptResponse(BaseModel):
    concepts: list[dict]


@router.post("/concepts", response_model=ConceptResponse)
async def extract_concepts(
    body: ConceptRequest,
    current_user: dict = Depends(get_current_user),
):
    prompt = (
        "You are an AI teaching assistant for a live tutoring session.\n"
        f"Subject: {body.subject or 'General'}\n\n"
        "Analyze this transcript chunk and extract the key concepts being discussed. "
        "Return a JSON array of objects with keys: "
        '"concept" (short title, max 6 words), '
        '"explanation" (1-2 sentence plain-English summary), '
        '"importance" ("high", "medium", or "low").\n\n'
        "Return ONLY the JSON array, no markdown fences or extra text.\n\n"
        f"Transcript:\n{body.transcript_chunk}"
    )
    raw = await _chat([{"role": "user", "content": prompt}], max_tokens=512)
    import json
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        concepts = json.loads(cleaned)
        if not isinstance(concepts, list):
            concepts = [concepts]
    except (json.JSONDecodeError, IndexError):
        concepts = [{"concept": "Parse error", "explanation": raw[:200], "importance": "low"}]
    return ConceptResponse(concepts=concepts)


# --- "Wait, What?" re-explanation ---

class WaitWhatRequest(BaseModel):
    transcript_chunk: str
    subject: str = ""
    student_question: str = ""


class WaitWhatResponse(BaseModel):
    explanation: str
    analogy: str
    follow_up: str


@router.post("/wait-what", response_model=WaitWhatResponse)
async def wait_what(
    body: WaitWhatRequest,
    current_user: dict = Depends(get_current_user),
):
    prompt = (
        "You are a friendly AI tutor helping a confused student.\n"
        f"Subject: {body.subject or 'General'}\n\n"
        "The student pressed a 'Wait, What?' button during a live session. "
        "Here is the last ~60 seconds of what was being discussed:\n\n"
        f"Transcript:\n{body.transcript_chunk}\n\n"
    )
    if body.student_question:
        prompt += f"Student's specific question: {body.student_question}\n\n"
    prompt += (
        "Provide:\n"
        '1. "explanation": A simplified re-explanation of what was just discussed (2-4 sentences, simple language)\n'
        '2. "analogy": A real-world analogy to make it click (1-2 sentences)\n'
        '3. "follow_up": A follow-up question the student could ask the tutor to deepen understanding\n\n'
        "Return ONLY a JSON object with those 3 keys, no markdown fences."
    )
    raw = await _chat([{"role": "user", "content": prompt}], max_tokens=512)
    import json
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        parsed = {
            "explanation": raw[:300],
            "analogy": "Could not generate analogy.",
            "follow_up": "Could you explain that again?"
        }
    return WaitWhatResponse(**parsed)


# --- Post-Session Recap ---

class RecapRequest(BaseModel):
    full_transcript: str
    subject: str = ""
    duration_minutes: int = 60


class RecapResponse(BaseModel):
    summary: str
    key_concepts: list[dict]
    areas_of_difficulty: list[str]
    practice_questions: list[str]


@router.post("/recap", response_model=RecapResponse)
async def session_recap(
    body: RecapRequest,
    current_user: dict = Depends(get_current_user),
):
    prompt = (
        "You are an AI teaching assistant generating a post-session recap.\n"
        f"Subject: {body.subject or 'General'}\n"
        f"Session duration: {body.duration_minutes} minutes\n\n"
        "Here is the full session transcript:\n\n"
        f"{body.full_transcript[:8000]}\n\n"
        "Generate a comprehensive recap with:\n"
        '1. "summary": 3-5 sentence overview of what was covered\n'
        '2. "key_concepts": Array of objects with "concept" and "explanation" keys\n'
        '3. "areas_of_difficulty": Array of topics where the student seemed confused or asked for clarification\n'
        '4. "practice_questions": Array of 3-5 practice questions for the student to test understanding\n\n'
        "Return ONLY a JSON object with those 4 keys, no markdown fences."
    )
    raw = await _chat([{"role": "user", "content": prompt}], max_tokens=1024)
    import json
    try:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(cleaned)
    except (json.JSONDecodeError, IndexError):
        parsed = {
            "summary": raw[:500],
            "key_concepts": [],
            "areas_of_difficulty": [],
            "practice_questions": [],
        }
    return RecapResponse(**parsed)
