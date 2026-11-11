"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function resolveInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  try {
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch {
    // ignore
  }
  return "light";
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = resolveInitialTheme();
    applyTheme(initial);
    // Sync client-only theme state after mount to avoid hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect -- intentional one-time sync on mount */
    setTheme(initial);
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
  };

  if (!mounted) {
    return (
      <Button aria-label="Toggle theme" size="icon-sm" variant="outline" type="button" disabled>
        <SunIcon className="size-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";
  return (
    <Button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggle}
      size="icon-sm"
      variant="outline"
      type="button"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </Button>
  );
}
