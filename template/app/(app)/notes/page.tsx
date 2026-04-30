import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, body, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Link href="/notes/new" className={buttonVariants()}>
          New note
        </Link>
      </div>
      {!notes || notes.length === 0 ? (
        <p className="text-muted-foreground">
          No notes yet. Create your first one.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/notes/${n.id}`} className="hover:underline">
                      {n.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {n.body}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
