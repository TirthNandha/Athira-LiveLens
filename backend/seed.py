"""
Seed script: inserts demo student & tutor accounts into Supabase.
Run once after applying migration.sql:
    cd backend && source venv/bin/activate && python seed.py
"""

import os
import bcrypt
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

USERS = [
    {
        "email": "alice@student.athira.io",
        "password": "student123",
        "full_name": "Alice Johnson",
        "role": "student",
        "subject": None,
    },
    {
        "email": "bob@student.athira.io",
        "password": "student123",
        "full_name": "Bob Williams",
        "role": "student",
        "subject": None,
    },
    {
        "email": "dr.smith@tutor.athira.io",
        "password": "tutor123",
        "full_name": "Dr. Emily Smith",
        "role": "tutor",
        "subject": "Mathematics",
    },
    {
        "email": "prof.jones@tutor.athira.io",
        "password": "tutor123",
        "full_name": "Prof. David Jones",
        "role": "tutor",
        "subject": "Computer Science",
    },
]


def seed():
    for user in USERS:
        row = {
            "email": user["email"],
            "password_hash": hash_password(user["password"]),
            "full_name": user["full_name"],
            "role": user["role"],
            "subject": user["subject"],
        }
        result = supabase.table("users").upsert(row, on_conflict="email").execute()
        print(f"Seeded: {user['full_name']} ({user['role']}) — {user['email']}")

    print("\n--- Demo Credentials ---")
    print("Students:  alice@student.athira.io / student123")
    print("           bob@student.athira.io   / student123")
    print("Tutors:    dr.smith@tutor.athira.io  / tutor123")
    print("           prof.jones@tutor.athira.io / tutor123")


if __name__ == "__main__":
    seed()
