import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Select, Alert, Spinner } from "../../components/ui";

const DAY_GROUPS = ["Mon-Wed", "Thu-Sat", "Mon-Sat"];

export default function DoctorApply() {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [form, setForm] = useState({
    hospital_id: "",
    fee: "",
    days_group: "Mon-Wed",
    start_time: "09:00",
    end_time: "17:00",
    patients_per_day: "",
  });
  const [document1, setDocument1] = useState(null);
  const [document2, setDocument2] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/hospitals", { params: { limit: 100 } })
      .then((res) => setHospitals(res.data.items))
      .finally(() => setLoadingHospitals(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!document1 || !document2) {
      setError("Both supporting documents are required.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("hospital_id", form.hospital_id);
      formData.append("fee", form.fee);
      formData.append("days_group", form.days_group);
      formData.append("start_time", form.start_time);
      formData.append("end_time", form.end_time);
      formData.append("patients_per_day", form.patients_per_day);
      formData.append("document_1", document1);
      formData.append("document_2", document2);

      await api.post("/doctor-hospitals/apply", formData, {
        ...withAuth("doctor"),
        headers: { ...withAuth("doctor").headers, "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Application submitted</h1>
        <p className="mt-3 text-slate">
          Your request is now pending admin review. You'll be notified by email once it's approved or rejected.
        </p>
        <Button className="mt-6" onClick={() => navigate("/doctor/applications")}>View my applications</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Apply to a hospital</h1>
      <p className="mt-1 text-sm text-slate">
        Set your fee, working days, hours, and daily patient capacity for this hospital. Requires admin approval.
      </p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {loadingHospitals ? (
        <div className="flex justify-center py-16 text-teal"><Spinner /></div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Select
            label="Hospital"
            required
            value={form.hospital_id}
            onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}
          >
            <option value="">Select a hospital</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}{h.address ? ` — ${h.address}` : ""}</option>
            ))}
          </Select>

          <Input
            label="Consultation fee (PKR)"
            type="number"
            min="0"
            required
            value={form.fee}
            onChange={(e) => setForm({ ...form, fee: e.target.value })}
          />

          <Select
            label="Working days"
            value={form.days_group}
            onChange={(e) => setForm({ ...form, days_group: e.target.value })}
          >
            {DAY_GROUPS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start time"
              type="time"
              required
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <Input
              label="End time"
              type="time"
              required
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>

          <Input
            label="Patients per day"
            type="number"
            min="1"
            required
            value={form.patients_per_day}
            onChange={(e) => setForm({ ...form, patients_per_day: e.target.value })}
          />

          <FileField label="Document 1 (e.g. CNIC / license)" onChange={setDocument1} file={document1} />
          <FileField label="Document 2 (e.g. degree / certificate)" onChange={setDocument2} file={document2} />

          <Button type="submit" disabled={submitting} className="mt-2 justify-center">
            {submitting ? "Submitting..." : "Submit application"}
          </Button>
        </form>
      )}
    </div>
  );
}

function FileField({ label, onChange, file }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <div className="rounded-xl border border-dashed border-slate-light/60 bg-white px-4 py-3 text-sm">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="w-full text-sm"
        />
        {file && <p className="mt-1 text-xs text-teal">{file.name}</p>}
      </div>
    </label>
  );
}
