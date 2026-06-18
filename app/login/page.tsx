"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signUp() {
    setMessage("Creating account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function logIn() {
    setMessage("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Log in</h1>

      <input
        type="email"
        placeholder="Email"
        className="w-full max-w-sm rounded-lg border p-3"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full max-w-sm rounded-lg border p-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        onClick={logIn}
        className="w-full max-w-sm rounded-lg bg-black p-3 text-white"
      >
        Log in
      </button>

      <button
        onClick={signUp}
        className="w-full max-w-sm rounded-lg border p-3"
      >
        Create account
      </button>

      {message && <p className="max-w-sm text-center text-sm">{message}</p>}
    </main>
  );
}