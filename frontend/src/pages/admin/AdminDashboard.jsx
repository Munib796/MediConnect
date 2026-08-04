import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  MapPin,
  Stethoscope,
  CalendarDays,
  AlertTriangle,
  ClipboardCheck,
  Plus,
  ArrowRight,
} from "lucide-react";
import { api, withAuth } from "../../lib/api";
import { Card, Spinner, Button } from "../../components/ui";
import { usePageTitle } from "../../lib/usePageTitle";

export default function AdminDashboard() {
  usePageTitle("Dashboard");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/doctor-hospitals/pending", { params: { limit: 1 }, ...withAuth("admin") }),
      api.get("/admin/hospitals", withAuth("admin")),
      api.get("/admin/cities", withAuth("admin")),
      api.get("/admin/specializations", withAuth("admin")),
      api.get("/appointments/admin/all", { params: { limit: 1 }, ...withAuth("admin") }),
    ]).then(([pending, hospitals, cities, specializations, appointments]) => {
      setStats({
        pending: pending.data.total,
        hospitals: hospitals.data.length,
        cities: cities.data.length,
        specializations: specializations.data.length,
        appointments: appointments.data.total,
      });
    });
  }, []);

  if (!stats) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  const hasPending = stats.pending > 0;

  const cards = [
    { label: "Hospitals", value: stats.hospitals, to: "/admin/hospitals", icon: Building2 },
    { label: "Cities", value: stats.cities, to: "/admin/cities", icon: MapPin },
    { label: "Specializations", value: stats.specializations, to: "/admin/specializations", icon: Stethoscope },
    { label: "Total appointments", value: stats.appointments, to: "/admin/appointments", icon: CalendarDays },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate">A quick overview of what needs your attention.</p>

      {/* Pending approvals — the one metric that implies action. Gets an accent
          treatment when there's a backlog, and a calm neutral state at zero. */}
      <Link to="/admin/approvals" className="mt-8 block">
        <Card
          hoverable
          className={`flex items-center gap-5 p-6 ${
            hasPending ? "border-marigold/40 bg-marigold-light/40" : ""
          }`}
        >
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              hasPending ? "bg-marigold text-ink" : "bg-teal-light text-teal-dark"
            }`}
          >
            {hasPending ? <AlertTriangle size={26} /> : <ClipboardCheck size={26} />}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate">Pending approvals</p>
            <p className="token-number text-3xl font-bold text-ink">{stats.pending}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-semibold text-teal-dark">
            {hasPending ? "Review now" : "All clear"}
            <ArrowRight size={16} />
          </span>
        </Card>
      </Link>

      {/* Passive counts. */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card hoverable className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light text-teal-dark">
                <c.icon size={20} />
              </span>
              <p className="mt-4 text-sm text-slate">{c.label}</p>
              <p className="token-number mt-1 text-3xl font-bold text-ink">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link to="/admin/hospitals">
            <Button variant="outline">
              <Plus size={16} /> Add hospital
            </Button>
          </Link>
          <Link to="/admin/approvals">
            <Button variant={hasPending ? "primary" : "outline"}>
              <ClipboardCheck size={16} /> Review approvals
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
