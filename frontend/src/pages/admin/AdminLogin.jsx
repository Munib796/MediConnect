import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, PasswordInput, Alert, Spinner } from "../../components/ui";
import AuthShell from "../../components/AuthShell";
import { usePageTitle } from "../../lib/usePageTitle";

export default function AdminLogin() {
  usePageTitle("Admin Log In");
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      const target = from ? `${from.pathname}${from.search || ""}` : "/admin";
      navigate(target, { state: from?.state });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="admin"
      title="Admin login"
      subtitle="Restricted access for MediConnect administrators."
      error={
        error && (
          <Alert role="alert" icon={<AlertCircle size={15} />}>
            {error}
          </Alert>
        )
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={loading}>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          autoFocus
          required
          placeholder="admin@mediconnect.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button type="submit" disabled={loading} className="mt-2 w-full justify-center">
          {loading ? (
            <>
              <Spinner className="h-4 w-4" /> Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      {/* No signup link here by design — admin accounts are provisioned, not
          self-registered. The only other destination is back to the public site. */}
      <div className="mt-7 border-t border-slate-light/20 pt-5">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-medium text-slate transition-colors hover:text-teal"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to MediConnect
        </Link>
      </div>
    </AuthShell>
  );
}
