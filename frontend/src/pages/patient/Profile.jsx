import { useState } from "react";
import { usePatientAuth } from "../../context/PatientAuthContext";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Card, Button, Input, Alert, Spinner } from "../../components/ui";

function SectionCard({ title, children }) {
  return (
    <Card className="p-6">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

export default function Profile() {
  usePageTitle("My Profile");
  const { patient, loading, refreshProfile } = usePatientAuth();

  const [name, setName] = useState(patient?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(patient?.phone_number || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  if (loading || !patient) {
    return (
      <div className="flex justify-center py-24 text-teal">
        <Spinner />
      </div>
    );
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await api.patch("/patients/me", { name, phone_number: phoneNumber }, withAuth("patient"));
      await refreshProfile();
      setProfileMessage({ tone: "teal", text: "Profile updated." });
    } catch (err) {
      setProfileMessage({ tone: "coral", text: extractErrorMessage(err) });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleEmailChange(e) {
    e.preventDefault();
    setEmailSaving(true);
    setEmailMessage(null);
    try {
      const res = await api.post("/patients/me/change-email", { new_email: newEmail }, withAuth("patient"));
      setEmailMessage({ tone: "teal", text: res.data.message });
      setNewEmail("");
    } catch (err) {
      setEmailMessage({ tone: "coral", text: extractErrorMessage(err) });
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const res = await api.post(
        "/patients/me/change-password",
        { current_password: currentPassword, new_password: newPassword },
        withAuth("patient")
      );
      setPasswordMessage({ tone: "teal", text: res.data.message });
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordMessage({ tone: "coral", text: extractErrorMessage(err) });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">My Profile</h1>
      <p className="mt-1 text-slate">Manage your account details.</p>

      <div className="mt-8 flex flex-col gap-6">
        <SectionCard title="Personal details">
          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input
              label="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="03XXXXXXXXX"
            />
            {profileMessage && <Alert tone={profileMessage.tone}>{profileMessage.text}</Alert>}
            <Button type="submit" disabled={profileSaving} className="self-start">
              {profileSaving ? <Spinner /> : "Save changes"}
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Email address">
          <p className="mb-4 text-sm text-slate">
            Current email: <span className="font-medium text-ink">{patient.email}</span>
          </p>
          <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
            <Input
              label="New email address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            {emailMessage && <Alert tone={emailMessage.tone}>{emailMessage.text}</Alert>}
            <Button type="submit" disabled={emailSaving} className="self-start">
              {emailSaving ? <Spinner /> : "Send verification link"}
            </Button>
            <p className="text-xs text-slate-light">
              We'll email a confirmation link to the new address. Your email only changes once you click it.
            </p>
          </form>
        </SectionCard>

        <SectionCard title="Password">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters, 1 number, 1 uppercase letter"
              required
            />
            {passwordMessage && <Alert tone={passwordMessage.tone}>{passwordMessage.text}</Alert>}
            <Button type="submit" disabled={passwordSaving} className="self-start">
              {passwordSaving ? <Spinner /> : "Change password"}
            </Button>
          </form>
        </SectionCard>
      </div>
    </div>
  );
}