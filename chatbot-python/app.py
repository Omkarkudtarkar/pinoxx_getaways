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

    if (
        "best price" in text
        or "cheap" in text
        or "deal" in text
        or "discount" in text
        or "only booking" in text
        or "not only booking" in text
        or "support only" in text
        or "what support" in text
        or "check-in" in text
        or "check in" in text
        or "check-out" in text
        or "check out" in text
        or "guidance" in text
        or "guide" in text
    ):
        return ChatResponse(
            answer=(
                "Pinoxx support is not limited to booking. We help compare stays for the best possible cheap price, "
                "plan Dandeli sightseeing, explain package inclusions, and guide guests from resort check-in to check-out."
            )
        )

    if (
        "contact" in text
        or "call" in text
        or "phone" in text
        or "whatsapp" in text
        or "sms" in text
        or "text" in text
        or "email" in text
        or "callback" in text
        or "call back" in text
        or "support" in text
    ):
        return ChatResponse(
            answer=(
                "You can contact Pinoxx by WhatsApp, phone call, or SMS at +91 9353431179. "
                "You can also email admin@pinoxx.in or open the Contact page to choose Call now, Call later, or Message. "
                "Share your dates, budget, member count, and sightseeing needs for faster help."
            )
        )

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
        answer="Tell me your travel dates, member count, budget, and preferred stay style. Pinoxx can help with best-price resort options, sightseeing, and check-in to check-out guidance."
    )
