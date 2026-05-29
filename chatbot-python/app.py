from fastapi import FastAPI
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str


app = FastAPI(title="Pinoxx Chatbot", version="1.0.0")


@app.get("/health")
def health():
    return {"ok": True, "service": "pinoxx-python-chatbot"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    text = payload.message.lower()

    if "distance" in text or "bus" in text:
        return ChatResponse(
            answer="Most Pinoxx-listed resorts are about 3-9 km from Dandeli bus stand. Open a resort page for exact distance."
        )

    if "price" in text or "cost" in text or "package" in text:
        return ChatResponse(
            answer="Dandeli resort packages usually depend on date, room type, meals, and adventure inclusions. Current listed stays start around Rs 1,299."
        )

    if "facility" in text or "amenity" in text or "food" in text:
        return ChatResponse(
            answer="Common facilities include meals, parking, pool access, bonfire, indoor games, power backup, and guided activity support."
        )

    if "rafting" in text or "activity" in text or "adventure" in text:
        return ChatResponse(
            answer="Pinoxx can coordinate rafting, kayaking, zipline, boating, jungle safari, and campfire plans based on season and availability."
        )

    return ChatResponse(
        answer="Tell me your travel dates, member count, budget, and preferred stay style. Pinoxx can help shortlist Dandeli resorts and booking options."
    )

