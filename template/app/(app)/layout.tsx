import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between p-4">
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="font-semibold">
              vibe-starter
            </Link>
            <Link
              href="/notes"
              className="text-muted-foreground hover:text-foreground"
            >
              Notes
            </Link>
            <Link
              href="/account"
              className="text-muted-foreground hover:text-foreground"
            >
              Account
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4">{children}</main>
    </div>
  );
}
