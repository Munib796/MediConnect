import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Star,
  Ticket,
  Stethoscope,
  MapPin,
  HeartPulse,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { usePageTitle } from "../../lib/usePageTitle";
import { Button } from "../../components/ui";

// The four claims below are the real, load-bearing promises of the platform —
// each maps to a mechanism that actually exists in the product (verification
// on doctor onboarding, reviews gated to completed appointments, the token
// booking system, and the city/specialization directory).
const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Every doctor is verified",
    body: "No profile goes live until our team has checked their credentials and hospital affiliation. You only ever see practitioners who cleared review.",
  },
  {
    icon: Star,
    title: "Reviews you can trust",
    body: "Ratings come only from patients who actually completed a visit — never anonymous drive-by opinions. Real experiences, from real appointments.",
  },
  {
    icon: Ticket,
    title: "Booking by token",
    body: "The parchi system you already know, made digital. Reserve your token, see your place in line, and skip the guessing games at the counter.",
  },
  {
    icon: MapPin,
    title: "Built for Pakistan",
    body: "Search by city and specialization across hospitals nationwide — from Karachi to Lahore to Islamabad — in a platform designed around how care actually works here.",
  },
];

const STEPS = [
  {
    label: "Search",
    title: "Find the right specialist",
    body: "Filter by city and specialization, or describe your symptoms and let our assistant point you to the right kind of doctor.",
  },
  {
    label: "Choose",
    title: "Compare on what matters",
    body: "See verified credentials, real patient reviews, fees, and available days before you commit to anyone.",
  },
  {
    label: "Book",
    title: "Reserve your token",
    body: "Pick a date, confirm your details, and pay by cash or card. Your token and time window are locked in instantly.",
  },
];

export default function About() {
  usePageTitle("About Us");

  return (
    <div>
      {/* ---- Hero: leads with the token/parchi signature ---- */}
      <section className="relative overflow-hidden chit-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-16 pb-20 sm:pt-24 md:grid-cols-2">
          <div className="animate-fade-up">
            <span className="token-number inline-flex items-center gap-1.5 rounded-full bg-marigold-light px-3 py-1 text-xs font-semibold text-marigold-dark">
              <HeartPulse size={13} /> Our story
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Healthcare in Pakistan, without the asking around.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-slate">
              Finding a doctor you can trust shouldn't depend on who you happen
              to know. MediConnect brings verified doctors, honest reviews, and
              a familiar token system together in one place — so every patient
              books with confidence, not word of mouth.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/hospitals">
                <Button>
                  Find a doctor <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/doctor">
                <Button variant="outline">
                  <Stethoscope size={16} /> For doctors
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature: a live token/parchi card, echoing the home hero */}
          <div className="animate-scale-in md:justify-self-end">
            <div className="ticket-stub w-full max-w-sm p-8">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-slate">Your Token</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-light px-2.5 py-1 text-[11px] font-semibold text-teal-dark">
                  <span className="live-dot text-teal"><span /></span>
                  Now serving 05
                </span>
              </div>
              <p className="token-number mt-3 text-7xl font-bold text-teal">07</p>
              <div className="ticket-divider my-5" />
              <p className="font-display text-lg font-semibold text-ink">Dr. Aftab Hussain</p>
              <p className="text-sm text-slate">Cardiologist · Aga Khan Hospital</p>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={16} fill="#E8A233" stroke="none" />
                ))}
                <span className="ml-1 text-xs text-slate">4.8 (112 reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Pillars: the real promises ---- */}
      <section className="border-t border-slate-light/20 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-ink">What we stand for</h2>
            <p className="mt-3 text-slate">
              Four commitments shape everything on the platform. They are the
              reason a patient can book here and simply trust what they see.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-slate-light/30 bg-paper p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-light text-teal transition-transform duration-200 group-hover:scale-105">
                  <p.icon size={22} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Mission band ---- */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="token-number inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-marigold">
            Our mission
          </span>
          <p className="mt-6 font-display text-2xl font-medium leading-snug text-white sm:text-3xl">
            To make quality healthcare in Pakistan easy to find and easy to
            trust — so choosing a doctor is a decision made on evidence, not on
            who you happened to ask.
          </p>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-ink">How it works</h2>
            <p className="mt-3 text-slate">
              From symptom to confirmed token in three steps.
            </p>
          </div>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.label} className="relative">
                <span className="token-number text-sm font-semibold text-marigold-dark">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-teal">
                    {s.label}
                  </span>
                  <span className="h-px flex-1 bg-slate-light/30" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- Three portals: reflects the role-separated architecture ---- */}
      <section className="border-t border-slate-light/20 bg-paper py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-ink">One platform, three doors</h2>
            <p className="mt-3 text-slate">
              Patients, doctors, and administrators each get a dedicated,
              secure space — kept strictly separate, so everyone sees only what
              they should.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <PortalCard
              icon={<HeartPulse size={20} />}
              name="For Patients"
              body="Search, compare, and book by token. Track your appointments and leave reviews after your visit."
              to="/signup"
              cta="Create an account"
            />
            <PortalCard
              icon={<Stethoscope size={20} />}
              name="For Doctors"
              body="Apply to hospitals, set your own fees and hours, and manage your appointments in one place."
              to="/doctor"
              cta="Join as a doctor"
            />
            <PortalCard
              icon={<ShieldCheck size={20} />}
              name="For Administrators"
              body="Verify practitioners, curate hospitals and specializations, and keep the platform trustworthy."
              muted
            />
          </div>
        </div>
      </section>

      {/* ---- Closing CTA ---- */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="ticket-stub flex flex-col items-center gap-5 p-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marigold-light text-marigold-dark">
              <Sparkles size={22} />
            </span>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Ready to find your doctor?
            </h2>
            <p className="max-w-md text-slate">
              Book your first appointment in minutes. No asking around, no
              guessing your place in line.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/hospitals">
                <Button>
                  Browse hospitals <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline">Create an account</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PortalCard({ icon, name, body, to, cta, muted = false }) {
  const inner = (
    <div
      className={`flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 ${
        muted
          ? "border-slate-light/30 bg-white"
          : "border-slate-light/30 bg-white hover:-translate-y-0.5 hover:border-teal/30 hover:shadow-md"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light text-teal">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{name}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate">{body}</p>
      {to ? (
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
          {cta} <ArrowRight size={15} />
        </span>
      ) : (
        <span className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-light">
          Access by invitation
        </span>
      )}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full rounded-2xl">
      {inner}
    </Link>
  ) : (
    inner
  );
}
