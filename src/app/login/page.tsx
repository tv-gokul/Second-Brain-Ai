"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      // Handle User Creation
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to sign up");
        return;
      }
      setIsSignUp(false);
      alert("Account created successfully! Please log in.");
    } else {
      // Handle NextAuth Sign In
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 text-zinc-200">
      <div className="w-full max-w-md space-y-6 border border-zinc-800 bg-zinc-900/50 p-8 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold Tracking-tight text-white">
            {isSignUp ? "Create your Second Brain" : "Welcome Back"}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {isSignUp ? "Set up your private knowledge base" : "Sign in to access your notes"}
          </p>
        </div>

        {error && <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-3 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Name</label>
              <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Email address</label>
            <input type="email" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Password</label>
            <input type="password" required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-zinc-600" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-white hover:bg-zinc-200 text-zinc-950 text-sm font-semibold py-2.5 rounded-lg transition-colors duration-200">
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="text-center pt-2">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs text-zinc-400 hover:text-white transition">
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account yet? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}