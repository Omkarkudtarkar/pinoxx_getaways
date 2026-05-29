import express from "express";
import { answerLocally } from "../utils/chatbot.js";

export const chatbotRouter = express.Router();

function shouldUseLocalResortData(message) {
  const query = String(message || "").toLowerCase();
  return (
    query.includes("price") ||
    query.includes("cost") ||
    query.includes("package") ||
    query.includes("budget") ||
    query.includes("comfort") ||
    query.includes("comport") ||
    query.includes("premium") ||
    query.includes("distance") ||
    query.includes("bus") ||
    query.includes("pickup") ||
    query.includes("route") ||
    query.includes("rafting") ||
    query.includes("facility") ||
    query.includes("amenity") ||
    query.includes("food") ||
    query.includes("meal") ||
    query.includes("breakfast") ||
    query.includes("lunch") ||
    query.includes("dinner") ||
    query.includes("pool") ||
    query.includes("swimming") ||
    query.includes("campfire") ||
    query.includes("music") ||
    query.includes("rain dance") ||
    query.includes("indoor") ||
    query.includes("carrom") ||
    query.includes("chess") ||
    query.includes("badminton") ||
    query.includes("archery") ||
    query.includes("extra") ||
    query.includes("sightseeing") ||
    query.includes("sight seeing") ||
    query.includes("jungle safari") ||
    query.includes("safari") ||
    query.includes("crocodile") ||
    query.includes("moulangi") ||
    query.includes("maulangi") ||
    query.includes("honey") ||
    query.includes("butterfly") ||
    query.includes("syntheri") ||
    query.includes("sethori") ||
    query.includes("rocks")
  );
}

chatbotRouter.post("/", async (req, res, next) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (process.env.PYTHON_CHATBOT_URL && !shouldUseLocalResortData(message)) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1500);

      try {
        const response = await fetch(process.env.PYTHON_CHATBOT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: controller.signal
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({ answer: data.answer, source: "python" });
        }
      } catch {
        // Fall back to the local deterministic assistant.
      } finally {
        clearTimeout(timeout);
      }
    }

    const answer = await answerLocally(message);
    res.json({ answer, source: "local" });
  } catch (error) {
    next(error);
  }
});
