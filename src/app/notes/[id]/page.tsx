"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((r) => r.json())
      .then((note) => {
        setTitle(note.title);
        setContent(note.content);
        setLoading(false);
      });
  }, [id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this note permanently?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/");
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto px-6 py-12 text-paper-dim">loading…</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-transparent border-b border-ink-line pb-2 font-display text-2xl font-semibold focus:outline-none focus:border-moss"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={16}
        className="w-full bg-ink-panel border border-ink-line rounded-md p-4 text-sm leading-relaxed focus:outline-none focus:border-moss resize-y"
      />
      <div className="flex justify-between">
        <button
          onClick={handleDelete}
          className="font-mono-label text-xs uppercase text-rust hover:opacity-80"
        >
          delete
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-moss-dim hover:bg-moss text-ink-bg font-mono-label text-xs uppercase px-4 py-2 rounded-md transition-colors disabled:opacity-50"
        >
          {saving ? "re-embedding…" : "save changes"}
        </button>
      </div>
    </div>
  );
}
