import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight, Stethoscope } from "lucide-react";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, PasswordInput, Alert, Spinner } from "../../components/ui";
import AuthShell from "../../components/AuthShell";
import { usePageTitle } from "../../lib/usePageTitle";

// Friendly names for the members-only pages that can bounce someone to login,
// so the notice reads "log in to continue to your appointments" instead of
// echoing a raw URL back at the patient.
const FROM_LABELS = [
  { match: /^\/my-appointments/, label: "your appointments" },
  { match: /^\/book\//, label: "your booking" },
  { match: /^\/profile/, label: "your profile" },
];

function describeFrom(pathname) {
  if (!pathname) return null;
  return FROM_LABELS.find((f) => f.match.test(pathname))?.label ?? null;
}

export default function Login() {
  usePageTitle("Log In");
  const { login } = usePatientAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from;
  const fromLabel = describeFrom(from?.pathname);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Trim the email: a trailing space picked up from autofill or a mobile
      // keyboard is otherwise an unexplainable "invalid credentials".
      await login(form.email.trim(), form.password);
      // Preserve the query string too, so a deep link like
      // /book/123?date=... survives the login detour intact.
      const target = from ? `${from.pathname}${from.search || ""}` : "/";
      navigate(target, { state: from?.state });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="patient"
      title="Welcome back"
      subtitle="Log in to book and manage your appointments."
      notice={
        fromLabel && (
          <Alert tone="marigold" icon={<ArrowRight size={15} />}>
            Log in to continue to {fromLabel}.
          </Alert>
        )
      }
      error={
        error && (
          <Alert role="alert" icon={<AlertCircle size={15} />}>
            {error}
          </Alert>
        )
      }
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-teal hover:underline">
            Create an account
          </Link>
        </>
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
          placeholder="you@example.com"
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

        <div className="-mt-1 text-right">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-teal hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="mt-1 w-full justify-center">
          {loading ? (
            <>
              <Spinner className="h-4 w-4" /> Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      {/* Cross-portal escape hatch: doctors and admins land on /login often
          enough that leaving them without a route is its own dead end. */}
      <div className="mt-7 border-t border-slate-light/20 pt-5">
        <Link
          to="/doctor/login"
          className="flex items-center gap-2 text-xs font-medium text-slate transition-colors hover:text-teal"
        >
          <Stethoscope size={14} aria-hidden="true" /> Are you a doctor? Use the doctor portal
        </Link>
      </div>
    </AuthShell>
  );
}
