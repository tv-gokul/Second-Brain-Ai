"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 1. Imported the router for navigation

type Source = { index: number; title: string; noteId: string };
type Turn = { question: string; answer: string; sources: Source[] };

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [asking, setAsking] = useState(false);
  const router = useRouter(); // 2. Initialized the navigation router

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || asking) return;
    
    const q = question;
    setQuestion("");
    setAsking(true);
    
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      // 3. SECURE GATEKEEPING: Catch the unauthenticated status immediately
      if (res.status === 401) {
        console.warn("Session expired or unauthorized. Redirecting to login...");
        router.push("/login");
        return;
      }

      const data = await res.json();
      
      // Prevent mapping broken fields if an alternative server error payload occurs
      if (res.ok) {
        setTurns((t) => [...t, { question: q, answer: data.answer, sources: data.sources }]);
      } else {
        console.error("API response error:", data.error);
      }
    } catch (err) {
      console.error("Failed to parse chat response:", err);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col px-6 py-10 lg:py-14">
      <section className="platinum-card-strong relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_36%)]" />
        <div className="relative space-y-3">
          <p className="font-mono-label text-xs uppercase tracking-[0.24em] text-platinum-dim">ask your notes</p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-tight text-paper sm:text-5xl">
            Ask the archive. Keep the answer grounded.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-paper-dim sm:text-[15px]">
            The ask button now lives in a stable composer bar at the bottom, so the interaction feels anchored and deliberate.
          </p>
        </div>
      </section>

      <section className="mt-6 flex-1 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
        <div className="space-y-6">
          {turns.length === 0 && (
            <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-sm text-paper-dim">
              Ask anything — answers are grounded only in what you&apos;ve saved.
            </div>
          )}
          {turns.map((t, i) => (
            <article key={i} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <p className="font-display text-xl font-semibold text-paper">{t.question}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-paper-dim">{t.answer}</p>
              {t.sources && t.sources.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.sources.map((s) => (
                    <a
                      key={s.index}
                      href={`/notes/${s.noteId}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono-label text-[10px] uppercase tracking-[0.18em] text-paper-dim transition hover:border-white/20 hover:bg-white/8 hover:text-paper"
                    >
                      [{s.index}] {s.title}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}
          {asking && (
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-paper-dim animate-pulse">
              thinking…
            </div>
          )}
        </div>
      </section>

      <form onSubmit={handleAsk} className="sticky bottom-4 z-20 mt-6 rounded-[1.6rem] border border-white/10 bg-black/75 p-3 backdrop-blur-xl">
        <div className="flex items-end gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What did I write about..."
            rows={2}
            className="min-h-[56px] flex-1 resize-none rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-paper placeholder:text-paper-dim/60 focus:border-[var(--platinum)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="flex h-[56px] items-center rounded-full border border-white/12 bg-white/[0.05] px-5 font-mono-label text-[11px] uppercase tracking-[0.22em] text-paper transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {asking ? "asking…" : "ask"}
          </button>
        </div>
      </form>
    </div>
  );
}