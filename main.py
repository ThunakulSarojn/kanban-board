import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SECRET_KEY"],
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://kanban-board-nine-snowy.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CardCreate(BaseModel):
    title: str
    status: str = "todo"

class CardUpdate(BaseModel):
    title: str | None = None
    status: str | None = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/cards")
def list_cards():
    return supabase.table("cards").select("*").order("id").execute().data

@app.post("/cards")
def create_card(card: CardCreate):
    if card.status not in ["todo", "doing", "done"]:
        raise HTTPException(400, "Invalid status")
    return supabase.table("cards").insert(card.model_dump()).execute().data

@app.patch("/cards/{card_id}")
def update_card(card_id: int, card: CardUpdate):
    data = card.model_dump(exclude_unset=True)
    if "status" in data and data["status"] not in ["todo", "doing", "done"]:
        raise HTTPException(400, "Invalid status")
    result = supabase.table("cards").update(data).eq("id", card_id).execute()
    return result.data

@app.delete("/cards/{card_id}")
def delete_card(card_id: int):
    result = supabase.table("cards").delete().eq("id", card_id).execute()
    return {"deleted": len(result.data) > 0}