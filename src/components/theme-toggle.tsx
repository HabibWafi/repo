"use client";

import { useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const META: Record<Theme, { Icon: typeof Sun; label: string }> = {
  system: { Icon: Monitor, label: "Theme: system" },
  light: { Icon: Sun, label: "Theme: light" },
  dark: { Icon: Moon, label: "Theme: dark" },
};

// A tiny external store backed by localStorage + the document element.
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Theme {
  const t = localStorage.getItem("theme");
  return t === "dark" || t === "light" ? t : "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    delete root.dataset.theme;
    localStorage.removeItem("theme");
  } else {
    root.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { Icon, label } = META[theme];

  function cycle() {
    setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
