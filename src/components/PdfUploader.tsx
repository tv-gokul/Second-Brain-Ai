"use client";

import { useState, type ChangeEvent } from "react";

export default function PdfUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Document ingested successfully!");
        if (onUploadSuccess) onUploadSuccess();
      } else {
        alert(`Upload error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send document to server.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="platinum-card-strong relative w-full overflow-hidden rounded-[1.75rem] p-8 md:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_36%)]" />
      <div className="absolute inset-x-8 top-0 h-px platinum-hairline" />
      <label className="relative block cursor-pointer text-center">
        <span className="mb-1 block text-sm font-medium text-paper">
          {uploading ? "Analyzing Document..." : "Add document to Second Brain"}
        </span>
        <span className="mb-6 block text-xs text-paper-dim">PDF files up to 10MB</span>
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <div className="inline-flex min-w-52 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-paper transition duration-300 hover:border-white/20 hover:bg-white/8 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          {uploading ? "Processing Chunks..." : "Select PDF File"}
        </div>
      </label>
    </div>
  );
}