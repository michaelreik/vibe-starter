import { createNote } from "@/lib/actions/notes";
import { NoteForm } from "@/components/notes/note-form";

export default function NewNotePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New note</h1>
      <NoteForm action={createNote} submitLabel="Create" />
    </div>
  );
}
