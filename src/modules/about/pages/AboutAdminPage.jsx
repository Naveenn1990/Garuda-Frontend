// Admin CMS for the storefront About Us page. Edit the About Us and Our Story
// sections (text + images) plus Vision & Mission. Images upload to /uploads.
import { useState, useEffect, useRef } from "react";
import { FiUpload, FiImage } from "react-icons/fi";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { imageUrl } from "../../storefront/utils";
import { useAboutContent, useUpdateAbout, useUploadAboutImage } from "../hooks/useAbout";

export function AboutAdminPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("about.edit");
  const { data: content, isLoading } = useAboutContent();
  const updateAbout = useUpdateAbout();
  const uploadImage = useUploadAboutImage();

  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const aboutFileRef = useRef(null);
  const storyFileRef = useRef(null);

  useEffect(() => {
    if (!content) return;
    setForm({
      aboutTitle:   content.aboutTitle   || "",
      aboutBody:    content.aboutBody    || "",
      aboutImage:   content.aboutImage   || "",
      storyHeading: content.storyHeading || "",
      storyBadge:   content.storyBadge   || "",
      storyBody:    content.storyBody    || "",
      storyImage:   content.storyImage   || "",
      vision:       content.vision       || "",
      mission:      content.mission      || "",
    });
  }, [content]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleUpload(field, file) {
    if (!file) return;
    setError("");
    try {
      const url = await uploadImage.mutateAsync(file);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateAbout.mutateAsync(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save.");
    }
  }

  if (isLoading || !form) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="About Page"
        subtitle="Edit the content shown on the public About Us page"
      />

      <form onSubmit={handleSave}>
        {/* About Us section */}
        <Card style={{ marginBottom: 16 }}>
          <div className="form-section__title">About Us Section</div>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
            {/* Image */}
            <div>
              <div style={imgBox}>
                {form.aboutImage ? (
                  <img src={imageUrl(form.aboutImage)} alt="About" style={imgStyle} />
                ) : (
                  <div style={imgPlaceholder}><FiImage size={28} /></div>
                )}
              </div>
              {canEdit && (
                <>
                  <input
                    ref={aboutFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload("aboutImage", e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={() => aboutFileRef.current?.click()}
                    disabled={uploadImage.isPending}>
                    <FiUpload /> {uploadImage.isPending ? "Uploading…" : "Upload Image"}
                  </Button>
                </>
              )}
            </div>
            {/* Text */}
            <div>
              <FormField label="Title" htmlFor="a-title">
                <input id="a-title" value={form.aboutTitle} onChange={set("aboutTitle")} disabled={!canEdit} />
              </FormField>
              <FormField label="Body (leave a blank line between paragraphs)" htmlFor="a-body">
                <textarea id="a-body" rows={5} value={form.aboutBody} onChange={set("aboutBody")} disabled={!canEdit} />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Our Story section */}
        <Card style={{ marginBottom: 16 }}>
          <div className="form-section__title">Our Story Section</div>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>
            <div>
              <div style={imgBox}>
                {form.storyImage ? (
                  <img src={imageUrl(form.storyImage)} alt="Story" style={imgStyle} />
                ) : (
                  <div style={imgPlaceholder}><FiImage size={28} /></div>
                )}
              </div>
              {canEdit && (
                <>
                  <input
                    ref={storyFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload("storyImage", e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={() => storyFileRef.current?.click()}
                    disabled={uploadImage.isPending}>
                    <FiUpload /> {uploadImage.isPending ? "Uploading…" : "Upload Image"}
                  </Button>
                </>
              )}
            </div>
            <div>
              <div className="form-grid">
                <FormField label="Heading" htmlFor="s-head">
                  <input id="s-head" value={form.storyHeading} onChange={set("storyHeading")} placeholder="15+ Years of Trust" disabled={!canEdit} />
                </FormField>
                <FormField label="Badge" htmlFor="s-badge">
                  <input id="s-badge" value={form.storyBadge} onChange={set("storyBadge")} placeholder="Established 2000" disabled={!canEdit} />
                </FormField>
              </div>
              <FormField label="Body (leave a blank line between paragraphs)" htmlFor="s-body">
                <textarea id="s-body" rows={5} value={form.storyBody} onChange={set("storyBody")} disabled={!canEdit} />
              </FormField>
            </div>
          </div>
        </Card>

        {/* Vision & Mission */}
        <Card style={{ marginBottom: 16 }}>
          <div className="form-section__title">Vision &amp; Mission</div>
          <div className="form-grid">
            <FormField label="Our Vision" htmlFor="vision">
              <textarea id="vision" rows={4} value={form.vision} onChange={set("vision")} disabled={!canEdit} />
            </FormField>
            <FormField label="Our Mission" htmlFor="mission">
              <textarea id="mission" rows={4} value={form.mission} onChange={set("mission")} disabled={!canEdit} />
            </FormField>
          </div>
        </Card>

        {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        {saved && <p style={{ color: "var(--color-success, #2e7d32)" }}>Changes saved. The public About page is updated.</p>}

        {canEdit && (
          <div className="form-actions">
            <Button type="submit" disabled={updateAbout.isPending}>
              {updateAbout.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

const imgBox = {
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid var(--color-line, #eee)",
  background: "#faf8f2",
};
const imgStyle = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
const imgPlaceholder = {
  width: "100%", height: "100%",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "var(--color-text-muted)",
};

export default AboutAdminPage;
