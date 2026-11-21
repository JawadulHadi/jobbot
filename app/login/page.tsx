"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("from");
    if (candidate && candidate.startsWith("/")) setFrom(candidate);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: username,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid credentials.");
        return;
      }
      router.push(from || "/");
      router.refresh();
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-transparent px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-2xl glass-strong p-6 md:p-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access Jobbot.
          </p>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="username">
              Username
            </label>
            <Input
              autoComplete="username"
              id="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
              Password
            </label>
            <Input
              autoComplete="current-password"
              id="password"
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          No account?{" "}
          <a className="text-[var(--brand)] hover:underline" href="/signup">
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}