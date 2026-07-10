import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, Alert } from "../../components/ui";

export default function Login() {
  const { login } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      const from = location.state?.from;
      navigate(from?.pathname || "/", { state: from?.state });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-slate">Log in to book and manage your appointments.</p>

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
          <Link to="/forgot-password" className="text-xs font-medium text-teal">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={loading} className="justify-center">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate">
        New here? <Link to="/signup" className="font-medium text-teal">Create an account</Link>
      </p>
    </div>
  );
}
