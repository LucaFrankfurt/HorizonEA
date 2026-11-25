import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-4xl font-semibold tracking-tight">404</p>
      <p className="text-sm text-muted-foreground">This record or page does not exist (anymore).</p>
      <Button asChild variant="outline">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
