import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Toaster } from "@/components/layout/toaster";
import { AppShell } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/layout/theme";
import { ViewModeProvider } from "@/components/layout/view-mode";
import { isViewMode, VIEW_MODE_COOKIE } from "@/lib/delta";
import { databaseKind } from "@/lib/db/client";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "HorizonEA", template: "%s · HorizonEA" },
  description: "Enterprise architecture, lifecycle & transformation management",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1012" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const stored = (await cookies()).get(VIEW_MODE_COOKIE)?.value;
  const initialMode = isViewMode(stored) ? stored : "as-is";
  const dbLabel = databaseKind() === "postgres" ? "PostgreSQL" : "Embedded (PGlite)";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ViewModeProvider initial={initialMode}>
            <AppShell databaseLabel={dbLabel}>{children}</AppShell>
            <Toaster />
          </ViewModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
