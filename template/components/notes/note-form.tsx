"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NoteAction = (formData: FormData) => Promise<{ error?: string } | void>;

type NoteFormProps = {
  action: NoteAction;
  defaults?: { title?: string; body?: string };
  submitLabel?: string;
};

export function NoteForm({ action, defaults, submitLabel = "Save" }: NoteFormProps) {
  const [pending, startTransition] = useTransition();

  function onAction(formData: FormData) {
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={onAction} className="space-y-4 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <textarea
          id="body"
          name="body"
          rows={10}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          defaultValue={defaults?.body ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
