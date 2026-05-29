import { ArrowLeft, Bot, CheckCircle2, Compass, IndianRupee, MapPin, Send, Sparkles, Utensils, Volume2, VolumeX, Waves, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { askChatbot } from "../lib/api";

const starter = {
  role: "bot",
  text: "Hi, I am here to help you choose the right Dandeli stay. Pick a topic below, or type your question."
};

const topics = [
  {
    id: "prices",
    label: "Prices",
    prompt: "Choose a price category.",
    icon: IndianRupee,
    options: [
      { label: "All prices", question: "Show all resort prices by budget, comfort, and premium categories." },
      { label: "Budget", question: "Show budget resort prices." },
      { label: "Comfort", question: "Show comfort resort prices." },
      { label: "Premium", question: "Show premium resort prices." }
    ]
  },
  {
    id: "distance",
    label: "Distance",
    prompt: "Which distance detail should I check?",
    icon: MapPin,
    options: [
      { label: "All distances", question: "Show all resort distances from Dandeli bus stand." },
      { label: "Nearest resorts", question: "Which resorts are nearest to Dandeli bus stand?" },
      { label: "Pickup help", question: "Can Pinoxx help with pickup or route guidance from Dandeli bus stand?" }
    ]
  },
  {
    id: "facilities",
    label: "Facilities",
    prompt: "Which facility do you want details about?",
    icon: Utensils,
    options: [
      { label: "Meals", question: "What meals are included: breakfast, lunch, and dinner?" },
      { label: "Pool & music", question: "Are swimming pool, campfire with music, and rain dance included?" },
      { label: "Indoor games", question: "Are carrom, chess, badminton, and archery included?" },
      { label: "All inclusions", question: "Show all food, facility, and activity inclusions." }
    ]
  },
  {
    id: "rafting",
    label: "Rafting",
    prompt: "Choose a rafting type.",
    icon: Waves,
    options: [
      { label: "All rafting", question: "Show all Dandeli rafting options." },
      { label: "Short", question: "Tell me about short rafting." },
      { label: "Mid 6 km", question: "Tell me about mid rafting 6 km." },
      { label: "Long 12 km", question: "Tell me about long rafting 12 km." }
    ]
  },
  {
    id: "extras",
    label: "Extra activities",
    prompt: "Choose an extra activity.",
    icon: Compass,
    options: [
      { label: "All extras", question: "Show all extra activities in Dandeli." },
      { label: "Sightseeing", question: "What sightseeing places are included in Dandeli?" },
      { label: "Jungle safari", question: "Tell me about jungle safari in Dandeli." },
      { label: "Mid rafting", question: "Tell me about mid rafting as an extra activity." },
      { label: "Long rafting", question: "Tell me about long rafting as an extra activity." }
    ]
  },
  {
    id: "booking",
    label: "Booking help",
    prompt: "What should Pinoxx help you with?",
    icon: Sparkles,
    options: [
      { label: "Choose resort", question: "I want help choosing and booking a resort." },
      { label: "Couple trip", question: "Suggest a Dandeli resort for a couple trip." },
      { label: "Family/group", question: "Suggest a Dandeli resort for a family or group trip." }
    ]
  }
];

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [messages, setMessages] = useState([starter]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const audioRef = useRef(null);

  const activeTopic = topics.find((topic) => topic.id === activeTopicId);

  useEffect(() => {
    if (!localStorage.getItem("pinoxx_chat_seen")) {
      const timer = setTimeout(() => {
        setOpen(true);
        setShowNudge(false);
        localStorage.setItem("pinoxx_chat_seen", "1");
      }, 1200);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setShowNudge(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function getAudioContext() {
    if (!soundOn || typeof window === "undefined") return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioRef.current) audioRef.current = new AudioContext();
    if (audioRef.current.state === "suspended") audioRef.current.resume();
    return audioRef.current;
  }

  function playTone(frequency, startAt, duration, gainValue = 0.035) {
    const context = getAudioContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, context.currentTime + startAt);
    gain.gain.setValueAtTime(0.0001, context.currentTime + startAt);
    gain.gain.exponentialRampToValueAtTime(gainValue, context.currentTime + startAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + startAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + startAt);
    oscillator.stop(context.currentTime + startAt + duration + 0.02);
  }

  function playSound(type) {
    if (!soundOn) return;
    if (type === "open") {
      playTone(660, 0, 0.08);
      playTone(880, 0.08, 0.12);
      return;
    }
    if (type === "reply") {
      playTone(740, 0, 0.07);
      playTone(980, 0.075, 0.1);
      return;
    }
    if (type === "success") {
      playTone(587, 0, 0.08);
      playTone(784, 0.08, 0.1);
      playTone(1046, 0.17, 0.12);
      return;
    }
    playTone(520, 0, 0.05, 0.025);
  }

  async function sendMessage(event, quickText) {
    event?.preventDefault();
    const outgoingText = String(quickText || text).trim();
    if (!outgoingText || loading) return;

    const userMessage = { role: "user", text: outgoingText };
    setMessages((items) => [...items, userMessage]);
    setText("");
    setActiveTopicId(null);
    setShowNudge(false);
    playSound("tap");
    setLoading(true);
    const answer = await askChatbot(userMessage.text);
    setMessages((items) => [...items, { role: "bot", text: answer }]);
    playSound("reply");
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function chooseTopic(topic) {
    if (loading) return;
    setShowNudge(false);
    playSound("tap");
    setActiveTopicId(topic.id);
    setMessages((items) => [
      ...items,
      { role: "user", text: topic.label },
      { role: "bot", text: topic.prompt }
    ]);
  }

  function resetTopics() {
    playSound("tap");
    setActiveTopicId(null);
    setMessages((items) => [...items, { role: "bot", text: "Choose another topic, or type your own question below." }]);
  }

  function openChat() {
    setOpen(true);
    setShowNudge(false);
    playSound("open");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function closeChat() {
    playSound("tap");
    setOpen(false);
    setTimeout(() => setShowNudge(true), 900);
  }

  function handleFeedback(type) {
    if (type === "helpful") {
      playSound("success");
      setMessages((items) => [
        ...items,
        { role: "user", text: "Helpful" },
        { role: "bot", text: "Great. If you share your date, guest count, and budget, Pinoxx can help shortlist the best resort for you." }
      ]);
      return;
    }

    playSound("tap");
    setActiveTopicId("booking");
    setMessages((items) => [
      ...items,
      { role: "user", text: "Need more help" },
      { role: "bot", text: "No problem. Choose a booking help option below, or type your exact question." }
    ]);
  }

  const shouldAskFeedback = !loading && !activeTopic && messages.length > 1 && messages[messages.length - 1]?.role === "bot";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open && showNudge && (
        <div className="relative mb-3 w-[min(86vw,300px)] rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <button className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={() => setShowNudge(false)} aria-label="Hide chatbot prompt">
            <X size={15} />
          </button>
          <div className="pr-5">
            <p className="text-sm font-black text-slate-950">Need help choosing a resort?</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Ask about price, distance, rafting, extra activities, facilities, or booking.</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-jungle-900" onClick={openChat}>
              Ask Pinoxx <Sparkles size={14} />
            </button>
          </div>
        </div>
      )}
      {open && (
        <div className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-jungle-500 text-slate-950">
                <Bot size={19} />
              </span>
              <div>
                <p className="text-sm font-black leading-tight">Pinoxx Assistant</p>
                <p className="text-xs font-semibold text-slate-300">Guided options + custom questions</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={() => setSoundOn((value) => !value)}
                type="button"
                aria-label={soundOn ? "Turn chatbot sound off" : "Turn chatbot sound on"}
              >
                {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" onClick={closeChat} aria-label="Close chatbot">
                <X size={19} />
              </button>
            </div>
          </div>
          <div ref={messagesRef} className="max-h-72 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${message.role === "user" ? "ml-8 bg-jungle-700 text-white" : "mr-8 bg-white text-slate-800"}`}
              >
                {message.text}
              </div>
            ))}
            {loading && <div className="mr-8 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm">Checking...</div>}
          </div>
          <div className="border-t border-slate-200 bg-white px-3 py-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">{activeTopic ? activeTopic.prompt : "Choose a topic"}</p>
              {activeTopic && (
                <button
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-100"
                  type="button"
                  onClick={resetTopics}
                  disabled={loading}
                >
                  <ArrowLeft size={13} />
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(activeTopic ? activeTopic.options : topics).map((option) => (
                <button
                  key={option.label}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-jungle-500 hover:bg-jungle-50 hover:text-jungle-800"
                  type="button"
                  onClick={(event) => (activeTopic ? sendMessage(event, option.question) : chooseTopic(option))}
                  disabled={loading}
                >
                  {option.icon && <option.icon size={14} />}
                  {option.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {activeTopic ? "Select one option above, or type your own answer/question below." : "Pick one topic to see related questions."}
            </p>
            {shouldAskFeedback && (
              <div className="mt-3 rounded-lg border border-jungle-100 bg-jungle-50 p-3">
                <p className="text-xs font-black text-jungle-900">Was this helpful?</p>
                <div className="mt-2 flex gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-black text-jungle-800 shadow-sm hover:bg-jungle-100"
                    type="button"
                    onClick={() => handleFeedback("helpful")}
                  >
                    <CheckCircle2 size={14} />
                    Helpful
                  </button>
                  <button
                    className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-100"
                    type="button"
                    onClick={() => handleFeedback("more")}
                  >
                    Need more help
                  </button>
                </div>
              </div>
            )}
          </div>
          <form className="flex gap-2 border-t border-slate-200 p-3" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-jungle-700"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask about price, distance..."
            />
            <button className="rounded-lg bg-jungle-700 p-2 text-white" aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => (open ? closeChat() : openChat())}
        className="grid h-14 w-14 place-items-center rounded-full bg-jungle-700 text-white shadow-soft hover:bg-jungle-900"
        aria-label="Open chatbot"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}
