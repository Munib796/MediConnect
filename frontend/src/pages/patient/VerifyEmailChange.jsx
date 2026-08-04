import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, extractErrorMessage } from "../../lib/api";
import { Spinner } from "../../components/ui";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { usePageTitle } from "../../lib/usePageTitle";

export default function VerifyEmailChange() {
  usePageTitle("Verify Email Change");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const { logout } = usePatientAuth();

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    api
      .get("/patients/verify-email-change", { params: { token } })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
        logout();
      })
      .catch((err) => {
        setStatus("error");
        setMessage(extractErrorMessage(err));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {status === "loading" && <div className="flex justify-center text-teal"><Spinner /></div>}
      {status === "success" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Email updated!</h1>
          <p className="mt-2 text-slate">{message}</p>
          <Link to="/login" className="mt-6 inline-block font-medium text-teal">Go to login</Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Verification failed</h1>
          <p className="mt-2 text-slate">{message}</p>
        </>
      )}
    </div>
  );
}