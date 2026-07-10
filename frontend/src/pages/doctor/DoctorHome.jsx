import { Link } from "react-router-dom";
import { ShieldCheck, Users, Wallet } from "lucide-react";
import { useDoctorAuth } from "../../context/DoctorAuthContext";
import { Button } from "../../components/ui";

export default function DoctorHome() {
  const { doctor } = useDoctorAuth();

  return (
    <div className="mx-auto max-w-4xl px-6 py-20 text-center">
      <span className="token-number inline-block rounded-full bg-marigold-light px-3 py-1 text-xs font-semibold text-marigold-dark">
        For Doctors
      </span>
      <h1 className="mt-5 font-display text-4xl font-semibold text-ink">Grow your practice on MediConnect</h1>
      <p className="mx-auto mt-4 max-w-lg text-slate">
        Reach patients actively searching for your specialization. Set your own fee, hours, and
        capacity at each hospital you work at.
      </p>

      <div className="mt-8 flex justify-center gap-3">
        {doctor ? (
          <Link to="/doctor/applications"><Button>Go to my applications</Button></Link>
        ) : (
          <>
            <Link to="/doctor/signup"><Button variant="accent">Join as a doctor</Button></Link>
            <Link to="/doctor/login"><Button variant="outline">Log in</Button></Link>
          </>
        )}
      </div>

      <div className="mt-16 grid gap-8 text-left sm:grid-cols-3">
        <Feature icon={<Users size={22} />} title="Real patient reach" text="Patients find you by city and specialization, backed by real reviews." />
        <Feature icon={<ShieldCheck size={22} />} title="Verified profile" text="Your profile is reviewed before it ever appears in search." />
        <Feature icon={<Wallet size={22} />} title="You set the terms" text="Your own fee, working days, hours, and daily patient capacity per hospital." />
      </div>
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
