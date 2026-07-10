import { useEffect, useRef, useState } from "react";
import { api, withAuth, extractErrorMessage } from "../../lib/api";
import { Button, Input, Select, TextArea, Alert, Spinner, Badge } from "../../components/ui";

export default function DoctorProfile() {
  const [profile, setProfile] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    load();
    api.get("/specializations").then((res) => setSpecializations(res.data)).catch(() => {});
  }, []);

  function load() {
    setLoading(true);
    // There's no GET /doctors/me on the backend, so we reuse a PATCH with an
    // empty body to fetch the current state back — the endpoint always
    // returns the full profile regardless of what was updated.
    api
      .patch("/doctors/me", {}, withAuth("doctor"))
      .then((res) => {
        setProfile(res.data);
        setForm({
          name: res.data.name,
          specialization_id: res.data.specialization_id,
          qualifications: res.data.qualifications || "",
          experience_years: res.data.experience_years || "",
          bio: res.data.bio || "",
        });
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await api.patch(
        "/doctors/me",
        {
          ...form,
          specialization_id: parseInt(form.specialization_id, 10),
          experience_years: form.experience_years ? parseInt(form.experience_years, 10) : null,
        },
        withAuth("doctor")
      );
      setProfile(res.data);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/doctors/upload-profile-photo", formData, {
        ...withAuth("doctor"),
        headers: { ...withAuth("doctor").headers, "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  if (loading || !form) {
    return <div className="flex justify-center py-24 text-teal"><Spinner /></div>;
  }

  const profileComplete = profile.qualifications && profile.experience_years && profile.bio;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Your profile</h1>

      {!profileComplete && (
        <div className="mt-4">
          <Alert tone="marigold">
            Complete your qualifications, experience, and bio below before applying to a hospital.
          </Alert>
        </div>
      )}
      {!profile.is_verified && (
        <div className="mt-4">
          <Alert>Your email isn't verified yet — you won't be able to log in again until you verify it.</Alert>
        </div>
      )}

      <div className="mt-6 flex items-center gap-5">
        <div className="h-24 w-24 overflow-hidden rounded-2xl bg-teal-light">
          {profile.profile_image_url ? (
            <img src={profile.profile_image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-teal/40">
              {profile.name?.[0]}
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <Button variant="outline" type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Uploading..." : "Change photo"}
          </Button>
        </div>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {success && <div className="mt-4"><Alert tone="teal">{success}</Alert></div>}

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
        <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Select
          label="Specialization"
          required
          value={form.specialization_id}
          onChange={(e) => setForm({ ...form, specialization_id: e.target.value })}
        >
          {specializations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </Select>
        <Input
          label="Qualifications"
          value={form.qualifications}
          onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
          placeholder="e.g. MBBS, FCPS"
        />
        <Input
          label="Years of experience"
          type="number"
          min="0"
          value={form.experience_years}
          onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
        />
        <TextArea label="Bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        <Button type="submit" disabled={saving} className="justify-center">
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
