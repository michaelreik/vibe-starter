"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";

export function DeleteNoteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      const result = await deleteNote(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onClick}
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
