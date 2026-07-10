import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, extractErrorMessage } from "../../lib/api";
import { Spinner } from "../../components/ui";

export default function DoctorVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }
    api
      .get("/doctors/verify-email", { params: { token } })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(extractErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {status === "loading" && <div className="flex justify-center text-teal"><Spinner /></div>}
      {status === "success" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Email verified!</h1>
          <p className="mt-2 text-slate">{message}</p>
          <Link to="/doctor/login" className="mt-6 inline-block font-medium text-teal">Go to login</Link>
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
