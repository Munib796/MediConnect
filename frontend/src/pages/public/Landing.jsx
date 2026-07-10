import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ShieldCheck, Ticket, Star } from "lucide-react";
import { api } from "../../lib/api";
import { Button, Select } from "../../components/ui";

export default function Landing() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [cityId, setCityId] = useState("");
  const [specializationId, setSpecializationId] = useState("");

  useEffect(() => {
    api.get("/cities").then((res) => setCities(res.data)).catch(() => {});
    api.get("/specializations").then((res) => setSpecializations(res.data)).catch(() => {});
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cityId) params.set("city_id", cityId);
    if (specializationId) params.set("specialization_id", specializationId);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 sm:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="token-number inline-block rounded-full bg-marigold-light px-3 py-1 text-xs font-semibold text-marigold-dark">
              No more asking around
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Find a doctor you can actually trust.
            </h1>
            <p className="mt-4 max-w-md text-slate">
              Real ratings, real reviews, from patients who actually completed their appointment.
              Book by token, no guessing games.
            </p>

            <form onSubmit={handleSearch} className="ticket-stub mt-8 flex flex-col gap-3 p-5 sm:flex-row">
              <div className="flex-1">
                <Select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                  <option value="">Any city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex-1">
                <Select value={specializationId} onChange={(e) => setSpecializationId(e.target.value)}>
                  <option value="">Any specialization</option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
              <Button type="submit" className="whitespace-nowrap">
                <Search size={16} /> Search
              </Button>
            </form>
          </div>

          <div className="hidden md:block">
            <div className="ticket-stub p-8">
              <p className="text-xs uppercase tracking-widest text-slate">Your Token</p>
              <p className="token-number mt-2 text-7xl font-bold text-teal">07</p>
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

      <section className="border-t border-slate-light/20 bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
          <Feature
            icon={<Star size={22} />}
            title="Real reviews only"
            text="Explore authentic patient reviews to find the doctor that's right for you."
          />
          <Feature
            icon={<ShieldCheck size={22} />}
            title="Verified healthcare professionals"
            text="Every listed doctor is carefully verified before joining the platform."
          />
          <Feature
            icon={<Ticket size={22} />}
            title="Easy token-based booking"
            text="A familiar token system that makes booking quick and straightforward."
          />
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light text-teal">{icon}</div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-slate">{text}</p>
    </div>
  );
}
