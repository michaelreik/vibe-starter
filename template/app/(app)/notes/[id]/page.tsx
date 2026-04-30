import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateNote } from "@/lib/actions/notes";
import { NoteForm } from "@/components/notes/note-form";
import { DeleteNoteButton } from "@/components/notes/delete-note-button";

type Params = Promise<{ id: string }>;

export default async function EditNotePage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("id, title, body")
    .eq("id", id)
    .single();

  if (!note) notFound();

  const updateAction = updateNote.bind(null, note.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit note</h1>
      <NoteForm
        action={updateAction}
        defaults={{ title: note.title, body: note.body }}
        submitLabel="Save"
      />
      <DeleteNoteButton id={note.id} />
    </div>
  );
}
