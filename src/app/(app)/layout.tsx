import { BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <BookOpenIcon className="size-5" />
            Study Programming
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">
              コース一覧
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </>
  );
}
