import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, ArrowRight, User } from "lucide-react";
import { useDoctorAuth } from "../../context/DoctorAuthContext";
import { extractErrorMessage } from "../../lib/api";
import { Button, Input, PasswordInput, Alert, Spinner } from "../../components/ui";
import AuthShell from "../../components/AuthShell";
import { usePageTitle } from "../../lib/usePageTitle";

const FROM_LABELS = [
  { match: /^\/doctor\/appointments/, label: "your appointments" },
  { match: /^\/doctor\/applications/, label: "your applications" },
  { match: /^\/doctor\/apply/, label: "your hospital application" },
  { match: /^\/doctor\/profile/, label: "your profile" },
];

export default function DoctorLogin() {
  usePageTitle("Doctor Log In");
  const { login } = useDoctorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ProtectedDoctorRoute forwards the page it bounced us from; honour it so a
  // deep link into the portal resumes after login instead of dumping the doctor
  // on the portal home.
  const from = location.state?.from;
  const fromLabel = from?.pathname
    ? FROM_LABELS.find((f) => f.match.test(from.pathname))?.label ?? null
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      const target = from ? `${from.pathname}${from.search || ""}` : "/doctor";
      navigate(target, { state: from?.state });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      variant="doctor"
      title="Doctor login"
      subtitle="Manage your applications, profile, and appointments."
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
          Not registered yet?{" "}
          <Link to="/doctor/signup" className="font-medium text-teal hover:underline">
            Join as a doctor
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
            to="/doctor/forgot-password"
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

      <div className="mt-7 border-t border-slate-light/20 pt-5">
        <Link
          to="/login"
          className="flex items-center gap-2 text-xs font-medium text-slate transition-colors hover:text-teal"
        >
          <User size={14} aria-hidden="true" /> Looking for the patient login?
        </Link>
      </div>
    </AuthShell>
  );
}
