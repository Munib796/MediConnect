import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDoctorAuth } from "../../context/DoctorAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, Alert } from "../../components/ui";

export default function DoctorLogin() {
  const { login } = useDoctorAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/doctor");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-2xl font-semibold text-ink">Doctor login</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="text-right">
          <Link to="/doctor/forgot-password" className="text-xs font-medium text-teal">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={loading} className="justify-center">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        New here? <Link to="/doctor/signup" className="font-medium text-teal">Join as a doctor</Link>
      </p>
    </div>
  );
}
