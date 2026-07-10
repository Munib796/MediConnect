import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Card } from "./ui";

export default function HospitalCard({ hospital }) {
  return (
    <Link to={`/hospitals/${hospital.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="h-40 w-full overflow-hidden bg-teal-light">
          {hospital.image_url ? (
            <img
              src={hospital.image_url}
              alt={hospital.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-teal/40">
              {hospital.name?.[0]}
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg font-semibold text-ink">{hospital.name}</h3>
          {hospital.address && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-slate">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {hospital.address}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
