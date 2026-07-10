import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, extractErrorMessage } from "../../lib/api";
import { Button, Input, Alert } from "../../components/ui";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/patients/reset-password", { token, new_password: newPassword });
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <Alert>Missing reset token. Please use the link from your email.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}

      {done ? (
        <>
          <div className="mt-4"><Alert tone="teal">Password reset successfully.</Alert></div>
          <Link to="/login" className="mt-6 inline-block font-medium text-teal">Go to login</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <p className="text-xs text-slate-light">At least 8 characters, one number, one uppercase letter.</p>
          <Button type="submit" disabled={loading} className="justify-center">
            {loading ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      )}
    </div>
  );
}
