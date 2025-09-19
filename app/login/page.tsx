"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = supabaseBrowser();

  const callbackUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "/auth/callback";

  function rememberRedirect() {
    // optional: remember where to go after auth (home for MVP)
    document.cookie = `sb-redirect-to=/; path=/; max-age=300`;
  }

  const signInWithGoogle = async () => {
    rememberRedirect();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  };

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    rememberRedirect();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    if (!error) setSent(true);
  };

  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <img src="/logo.png" alt="logo" className="h-6" />
        <span className="text-lg font-semibold">free speech.Live</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Your Voice is Live</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Join thousands of activists making real change happen
      </p>

      <div className="rounded-xl border p-4 shadow-sm">
        <h2 className="text-center font-medium mb-3">Get Started</h2>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-lg border px-4 py-3 text-left mb-3 hover:bg-muted"
        >
          <span className="inline-flex items-center gap-3">
            <span className="h-5 w-5 rounded-full bg-red-500 inline-block" />
            Continue with Google
          </span>
        </button>

        {/* Email OTP */}
        <form onSubmit={signInWithEmail} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border px-4 py-3"
          />
          <button
            type="submit"
            className="w-full rounded-lg border px-4 py-3 hover:bg-muted"
          >
            {sent ? "Magic link sent ✓" : "Continue with Email"}
          </button>
        </form>

        <div className="mt-6 border-t pt-3 text-center text-xs text-muted-foreground">
          OPTIONAL
          <div className="mt-1 underline">Connect Wallet Later</div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        We respect your privacy. No spam, ever.
      </p>
    </div>
  );
}
