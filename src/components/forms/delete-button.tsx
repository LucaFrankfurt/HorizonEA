"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/client-api";

/** Confirmed DELETE against `url`; redirects to `redirectTo` or refreshes the current page. */
export function DeleteButton({
  url,
  name,
  redirectTo,
  consequence,
  compact,
}: {
  url: string;
  name: string;
  redirectTo?: string;
  consequence?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await api("DELETE", url);
      toast.success(`Deleted ${name}`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon-sm" title={`Remove ${name}`} aria-label={`Remove ${name}`}>
            <Trash2 className="text-muted-foreground" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Trash2 /> Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        {consequence && (
          <DialogBody>
            <p className="text-sm text-muted-foreground">{consequence}</p>
          </DialogBody>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
