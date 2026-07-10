import { Link } from "react-router-dom";
import { Award, Clock } from "lucide-react";
import { Card, StarRating, Badge } from "./ui";

export default function DoctorCard({ doctor, hospitalId }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-teal-light">
        {doctor.profile_image_url ? (
          <img src={doctor.profile_image_url} alt={doctor.doctor_name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-2xl text-teal/40">
            {doctor.doctor_name?.[0]}
          </div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-ink">Dr. {doctor.doctor_name}</h3>
          <Badge tone="teal">{doctor.specialization_name}</Badge>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
          <Award size={14} /> {doctor.qualifications} · {doctor.experience_years} yrs experience
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
          <Clock size={14} /> {doctor.days?.join(", ")} · {doctor.start_time?.slice(0, 5)}–{doctor.end_time?.slice(0, 5)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {doctor.review_count > 0 ? (
            <>
              <StarRating rating={doctor.avg_rating} size={14} />
              <span className="text-xs text-slate">
                {doctor.avg_rating} ({doctor.review_count} review{doctor.review_count !== 1 ? "s" : ""})
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-light">No reviews yet</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <span className="token-number text-lg font-semibold text-teal-dark">Rs {doctor.fee}</span>
        <Link
          to={`/book/${doctor.doctor_hospital_id}`}
          state={{ doctor, hospitalId }}
          className="rounded-full bg-marigold px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-marigold-dark"
        >
          Book appointment
        </Link>
      </div>
    </Card>
  );
}
