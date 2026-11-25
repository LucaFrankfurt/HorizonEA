"use client";

import { GitCompareArrows, History, Target } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { VIEW_MODE_COOKIE, VIEW_MODES, type ViewMode } from "@/lib/delta";
import { cn } from "@/lib/utils";

const ViewModeContext = createContext<{ mode: ViewMode; setMode: (mode: ViewMode) => void }>({
  mode: "as-is",
  setMode: () => {},
});

export function ViewModeProvider({ initial, children }: { initial: ViewMode; children: React.ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>(initial);
  const setMode = useCallback((next: ViewMode) => {
    setModeState(next);
    document.cookie = `${VIEW_MODE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  return <ViewModeContext.Provider value={{ mode, setMode }}>{children}</ViewModeContext.Provider>;
}

export const useViewMode = () => useContext(ViewModeContext);

const ICONS = { "as-is": History, "to-be": Target, delta: GitCompareArrows };

/** Global As-Is / To-Be / Delta switcher (persisted in a cookie so the server renders the same state). */
export function ViewModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode } = useViewMode();
  return (
    <div role="radiogroup" aria-label="Architecture state" className={cn("inline-flex rounded-lg border bg-muted p-0.5", className)}>
      {VIEW_MODES.map((m) => {
        const Icon = ICONS[m.value];
        const active = mode === m.value;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            title={m.label}
            onClick={() => setMode(m.value)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-2.5",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="hidden size-3.5 sm:block" />
            {m.short}
          </button>
        );
      })}
    </div>
  );
}
