"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation"; // 1. Import useRouter for client-side redirection
import PdfUploader from "@/components/PdfUploader";

type NoteSummary = {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
  source: string;
};

export default function HomePage() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      
      if (!res.ok) {
        console.warn("Could not retrieve notes, status:", res.status);
        setNotes([]);
        setLoading(false);
        
        // 2. FORCE LAZY GATEKEEPING: If backend says 401/Unauthorized, kick them straight to login
        router.push("/login");
        return;
      }

      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("Failed parsing notes json:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleLogOut = async () => {
    // 3. Clear session and completely flush client router cache
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });
    setTitle("");
    setContent("");
    setTags("");
    setSaving(false);
    loadNotes();
  }

  // Prevent showing empty dashboard layout momentarily while loading unauthenticated states
  if (loading && notes.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black font-mono text-xs uppercase tracking-[0.2em] text-platinum-dim">
        authenticating archive session...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14 space-y-8">
      <section className="platinum-card-strong relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.09),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(214,210,202,0.08),transparent_36%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              
              <Link
                href="/chat"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.05] px-6 py-3 font-mono-label text-[11px] uppercase tracking-[0.24em] text-paper transition hover:border-white/20 hover:bg-white/10"
              >
                ask
              </Link>
              <button
                onClick={handleLogOut}
                className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/[0.04] px-6 py-3 font-mono-label text-[11px] uppercase tracking-[0.24em] text-red-400/90 transition hover:border-red-500/40 hover:bg-red-500/10 cursor-pointer"
              >
                log out
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 lg:justify-self-end">
            <div className="platinum-card rounded-2xl p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.22em] text-platinum-dim">ingest</div>
              <div className="mt-2 text-lg font-display font-medium text-paper">PDFs</div>
            </div>
            <div className="platinum-card rounded-2xl p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.22em] text-platinum-dim">capture</div>
              <div className="mt-2 text-lg font-display font-medium text-paper">notes</div>
            </div>
            <div className="platinum-card rounded-2xl p-4">
              <div className="font-mono-label text-[10px] uppercase tracking-[0.22em] text-platinum-dim">search</div>
              <div className="mt-2 text-lg font-display font-medium text-paper">vectors</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <p className="font-mono-label text-xs uppercase tracking-[0.24em] text-platinum-dim">upload</p>
          <p className="max-w-md text-sm leading-7 text-paper-dim">
            Drop a PDF into the archive. The cards, borders, and spacing are tuned to keep the interface calm and high-contrast.
          </p>
          <PdfUploader onUploadSuccess={loadNotes} />
        </div>

        <div className="space-y-4 rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <p className="font-mono-label text-xs uppercase tracking-[0.24em] text-platinum-dim">capture</p>
          <p className="max-w-md text-sm leading-7 text-paper-dim">
            Save text notes with the same minimal contrast language so the page feels cohesive.
          </p>
          <form onSubmit={handleCapture} className="space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full border-b border-white/12 bg-transparent pb-3 font-display text-2xl font-semibold text-paper placeholder:text-paper-dim/60 focus:border-[var(--platinum)] focus:outline-none"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write, paste an article, drop in a transcript..."
              rows={7}
              className="w-full resize-y rounded-[1.35rem] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 text-sm leading-relaxed text-paper placeholder:text-paper-dim/60 focus:border-[var(--platinum)] focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags, comma, separated"
                className="min-w-0 flex-1 border-b border-white/10 bg-transparent py-2 font-mono-label text-[11px] uppercase tracking-[0.2em] text-paper-dim placeholder:text-paper-dim/50 focus:border-[var(--platinum)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 font-mono-label text-[11px] uppercase tracking-[0.2em] text-paper transition hover:border-white/20 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "embedding…" : "save note"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.025] p-6 sm:p-7">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono-label text-xs uppercase tracking-[0.24em] text-platinum-dim">notes</p>
            <p className="mt-2 text-sm text-paper-dim">
              {loading ? "loading…" : `${notes.length} saved notes`}
            </p>
          </div>
        </div>
        <ul className="grid gap-3">
          {notes.map((n) => (
            <li key={n.id}>
              <Link href={`/notes/${n.id}`} className="group block rounded-[1.35rem] border border-white/8 bg-white/[0.02] p-4 transition duration-300 hover:border-white/16 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_rgba(0,0,0,0.24)]">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-display text-lg font-medium text-paper transition-colors group-hover:text-[var(--platinum)]">
                    {n.title}
                  </span>
                  <span className="font-mono-label text-[10px] uppercase tracking-[0.18em] text-paper-dim">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {n.tags && n.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {n.tags.map((t) => (
                      <span key={t} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 font-mono-label text-[10px] uppercase tracking-[0.16em] text-paper-dim">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}