import { useState } from "react";
import { api, extractErrorMessage } from "../../lib/api";
import { Button, Input, Alert } from "../../components/ui";

export default function DoctorForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/doctors/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-slate">We'll email you a link to set a new password.</p>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {sent ? (
        <Alert tone="teal">If an account with that email exists, a reset link has been sent.</Alert>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" disabled={loading} className="justify-center">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
    </div>
  );
}
