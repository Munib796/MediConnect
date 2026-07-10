import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, Alert } from "../../components/ui";

export default function Signup() {
  const { signup } = usePatientAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", name: "", phone_number: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink">Check your inbox</h1>
        <p className="mt-3 text-slate">
          We've sent a verification link to <strong>{form.email}</strong>. Click it, then come back to log in.
        </p>
        <Link to="/login" className="mt-6 inline-block font-medium text-teal">Go to login</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-slate">Book appointments in minutes, no more asking around.</p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone number (optional)" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="text-xs text-slate-light">At least 8 characters, one number, one uppercase letter.</p>
        <Button type="submit" disabled={loading} className="mt-2 justify-center">
          {loading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        Already have an account? <Link to="/login" className="font-medium text-teal">Log in</Link>
      </p>
    </div>
  );
}
