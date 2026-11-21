"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Signup failed.");
        return;
      }
      router.push("/login?from=/");
    } catch {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl glass-strong p-6 md:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground">Sign up to access Jobbot.</p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="name">Name</label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="email">Email</label>
            <Input autoComplete="email" id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="password">Password</label>
            <Input autoComplete="new-password" id="password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link className="text-[var(--brand)] hover:underline" href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}