import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X, Send, AlertTriangle, Award, Clock, Sparkles, Search, Stethoscope, CalendarClock } from "lucide-react";
import { api, withAuth, extractErrorMessage } from "../lib/api";
import { Badge, Spinner, StarRating } from "./ui";
import TicketStub from "./TicketStub";

// One-tap conversation starters shown above the composer until the patient
// sends their first message. Each maps to something the assistant can actually
// do (symptom triage, doctor search, booking, viewing existing appointments).
const QUICK_ACTIONS = [
  { icon: Stethoscope, label: "Check my symptoms", prompt: "I'm not feeling well and want to understand which specialist I should see." },
  { icon: Search, label: "Find a doctor", prompt: "Help me find a doctor near me." },
  { icon: CalendarClock, label: "Book an appointment", prompt: "I'd like to book an appointment." },
  { icon: Clock, label: "My appointments", prompt: "Show me my upcoming appointments." },
];

// Turns **bold**, simple "* item" / "- item" lines, and raw URLs into
// light formatting, without pulling in a full markdown library -- the
// assistant's replies (Gemini, and Stripe checkout links) commonly need
// just this much and nothing fancier.
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const BOLD_OR_URL_REGEX = /(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g;

function renderInline(text, keyPrefix) {
  return text.split(BOLD_OR_URL_REGEX).map((part, j) => {
    const key = `${keyPrefix}-${j}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0; // reset since .test() advances a global regex's state
      const isStripe = part.includes("checkout.stripe.com");
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-teal-light px-3 py-1 font-medium text-teal-dark no-underline hover:bg-teal/20"
        >
          {isStripe ? "💳 Pay with Stripe" : "🔗 Open link"}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function formatReply(text) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
    const content = isBullet ? trimmed.slice(2) : line;
    const parts = renderInline(content, i);
    if (isBullet) {
      return (
        <li key={i} className="ml-4 list-disc break-words">
          {parts}
        </li>
      );
    }
    if (trimmed === "") return <br key={i} />;
    return (
      <p key={i} className="break-words">
        {parts}
      </p>
    );
  });
}

// A compact doctor card built specifically for the narrow chat panel.
// DoctorCard (the full-page version) uses sm:flex-row, a VIEWPORT breakpoint
// -- on desktop that always forces a horizontal row layout regardless of how
// narrow the actual panel around it is, which is what caused the overflow.
// This version is always vertically stacked, so it reliably fits regardless
// of screen size.
function ChatDoctorCard({ doctor }) {
  return (
    <div className="w-full min-w-0 rounded-2xl border border-slate-light/30 bg-white p-4 text-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-teal-light">
          {doctor.profile_image_url ? (
            <img src={doctor.profile_image_url} alt={doctor.doctor_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-lg text-teal/40">
              {doctor.doctor_name?.[0]}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-semibold text-ink">Dr. {doctor.doctor_name}</p>
          <Badge tone="teal">{doctor.specialization_name}</Badge>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate">
        {doctor.qualifications && (
          <p className="flex items-center gap-1.5">
            <Award size={13} className="shrink-0" />
            <span className="truncate">{doctor.qualifications} · {doctor.experience_years} yrs experience</span>
          </p>
        )}
        {doctor.days && (
          <p className="flex items-center gap-1.5">
            <Clock size={13} className="shrink-0" />
            <span className="truncate">
              {Array.isArray(doctor.days) ? doctor.days.join(", ") : doctor.days} ·{" "}
              {doctor.start_time?.slice(0, 5)}–{doctor.end_time?.slice(0, 5)}
            </span>
          </p>
        )}
        {doctor.review_count > 0 ? (
          <div className="flex items-center gap-1.5">
            <StarRating rating={doctor.avg_rating} size={13} />
            <span>{doctor.avg_rating} ({doctor.review_count})</span>
          </div>
        ) : (
          <span className="text-slate-light">No reviews yet</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="font-display text-base font-semibold text-teal-dark">Rs {doctor.fee}</span>
        <Link
          to={`/book/${doctor.doctor_hospital_id}`}
          className="shrink-0 rounded-full bg-marigold px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-marigold-dark"
        >
          Book appointment
        </Link>
      </div>
    </div>
  );
}

function AssistantMessage({ message, onQuickSearch }) {
  const {
    reply,
    possible_emergency,
    recommended_specializations = [],
    recommended_doctors = [],
    booked_appointments = [],
  } = message;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-teal-light/60 px-4 py-3 text-sm text-ink">
        {formatReply(reply)}
      </div>

      {possible_emergency && (
        <div className="flex items-start gap-2 rounded-xl border border-coral/30 bg-coral-light px-4 py-3 text-sm text-coral">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <span>This may be a medical emergency. Please contact emergency services or go to the nearest ER.</span>
        </div>
      )}

      {recommended_specializations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recommended_specializations.map((s) => (
            <button
              key={s.id}
              onClick={() => onQuickSearch(`Find ${s.name} doctors near me`)}
              className="cursor-pointer"
            >
              <Badge tone="marigold">{s.name}</Badge>
            </button>
          ))}
        </div>
      )}

      {recommended_doctors.length > 0 && (
        <div className="flex min-w-0 flex-col gap-3">
          {recommended_doctors.map((doc) => (
            <ChatDoctorCard key={doc.doctor_hospital_id} doctor={doc} />
          ))}
        </div>
      )}

      {booked_appointments.length > 0 && (
        <div className="flex flex-col gap-3">
          {booked_appointments.map((appt) => (
            <TicketStub
              key={appt.id}
              appointment={appt}
              doctorName={appt.doctor_name}
              hospitalName={appt.hospital_name}
              hospitalAddress={appt.hospital_address}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      reply:
        "Hi! I'm your MediConnect assistant. I can help you understand symptoms, find doctors and hospitals, and book appointments. What can I help with?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Patient has only seen the canned greeting so far -> still show the quick
  // actions. Once they send anything, the conversation takes over.
  const showQuickActions = messages.length === 1 && !loading;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  // When the panel opens, move focus into the composer for keyboard users.
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Escape closes the panel from anywhere inside it.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await api.post(
        "/assistant/chat",
        { message: trimmed },
        withAuth("patient")
      );
      setMessages((prev) => [...prev, { role: "assistant", ...res.data }]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-dark focus-visible:ring-2 focus-visible:ring-teal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {/* Ambient pulse ring, only while closed and drawing attention */}
        {!open && (
          <span className="pointer-events-none absolute inset-0 rounded-full bg-teal/40 motion-safe:animate-pulse-ring" aria-hidden="true" />
        )}
        <span className="relative">
          {open ? <X size={24} /> : <MessageCircle size={24} />}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="MediConnect assistant"
          className="fixed bottom-24 right-6 z-50 flex h-[70vh] max-h-[640px] w-[90vw] max-w-sm origin-bottom-right animate-scale-in flex-col overflow-hidden rounded-2xl border border-slate-light/30 bg-white shadow-2xl sm:w-96"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-teal px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="font-display text-base font-semibold leading-tight">MediConnect Assistant</p>
                <p className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="live-dot text-marigold"><span /></span>
                  Symptoms · Doctors · Booking
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-full p-1 transition-colors hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-marigold px-4 py-2.5 text-sm text-ink">
                    {m.content}
                  </div>
                </div>
              ) : (
                <AssistantMessage key={i} message={m} onQuickSearch={sendMessage} />
              )
            )}

            {loading && <TypingIndicator />}

            {error && (
              <div className="rounded-xl border border-coral/30 bg-coral-light px-4 py-3 text-sm text-coral">
                {error}
              </div>
            )}
          </div>

          {/* Quick actions — only before the first real exchange */}
          {showQuickActions && (
            <div className="border-t border-slate-light/20 px-3 pt-3">
              <p className="px-1 pb-2 text-xs font-medium text-slate">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.prompt)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-light/50 bg-white px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-teal hover:bg-teal-light hover:text-teal-dark"
                  >
                    <a.icon size={13} /> {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-light/30 px-3 py-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={loading}
              aria-label="Message the assistant"
              className="flex-1 rounded-full border border-slate-light/50 px-4 py-2.5 text-sm outline-none transition-shadow transition-colors placeholder:text-slate-light focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal text-white transition-colors hover:bg-teal-dark disabled:opacity-40"
              aria-label="Send"
            >
              {loading ? <Spinner className="text-white" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2" aria-label="Assistant is typing" role="status">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-teal-light/60 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-teal motion-safe:animate-typing-bounce"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}