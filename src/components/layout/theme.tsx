"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemes>
  );
}

const subscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const order = ["light", "dark", "system"] as const;
  const current = mounted ? ((theme as (typeof order)[number]) ?? "system") : "system";
  const next = order[(order.indexOf(current) + 1) % order.length];
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(next)}
      title={`Theme: ${current} (switch to ${next})`}
      aria-label={`Theme: ${current}. Switch to ${next}`}
    >
      <Icon />
    </Button>
  );
}
