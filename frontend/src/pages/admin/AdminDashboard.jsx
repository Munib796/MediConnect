import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, withAuth } from "../../lib/api";
import { Card, Spinner } from "../../components/ui";

export default function AdminDashboard() {
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

  const cards = [
    { label: "Pending approvals", value: stats.pending, to: "/admin/approvals" },
    { label: "Hospitals", value: stats.hospitals, to: "/admin/hospitals" },
    { label: "Cities", value: stats.cities, to: "/admin/cities" },
    { label: "Specializations", value: stats.specializations, to: "/admin/specializations" },
    { label: "Total appointments", value: stats.appointments, to: "/admin/appointments" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Admin dashboard</h1>
      <p className="mt-1 text-sm text-slate">A quick overview of what needs your attention.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="p-6 transition-shadow hover:shadow-md">
              <p className="text-sm text-slate">{c.label}</p>
              <p className="token-number mt-2 text-3xl font-bold text-ink">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
