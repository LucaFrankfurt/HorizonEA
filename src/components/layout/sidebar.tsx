"use client";

import {
  AppWindow,
  ArrowDownUp,
  Cpu,
  LayoutDashboard,
  Menu,
  Network,
  Route,
  Server,
  Telescope,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme";
import { ViewModeSwitcher } from "./view-mode";

export const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: AppWindow },
  { href: "/technologies", label: "Technologies & EOL", icon: Cpu },
  { href: "/assets", label: "IT Assets", icon: Server },
  { href: "/landscape", label: "Landscape Map", icon: Network },
  { href: "/transformations", label: "Transformations", icon: Route },
  { href: "/import-export", label: "Import / Export", icon: ArrowDownUp },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-4", active && "text-primary")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-4">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Telescope className="size-4.5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">HorizonEA</span>
        <span className="text-[11px] text-muted-foreground">Architecture & Lifecycle</span>
      </span>
    </Link>
  );
}

export function AppShell({ children, databaseLabel }: { children: React.ReactNode; databaseLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
        <Brand />
        <NavLinks />
        <div className="mt-auto border-t px-5 py-3 text-[11px] text-muted-foreground">Database: {databaseLabel}</div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r bg-sidebar shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close menu">
                <X className="size-4" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
        <button
          onClick={() => setOpen(true)}
          className="-ml-1 rounded-md p-1.5 hover:bg-muted lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
        <span className="hidden text-sm font-semibold min-[420px]:inline lg:hidden">HorizonEA</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground md:inline">Architecture state</span>
          <ViewModeSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
