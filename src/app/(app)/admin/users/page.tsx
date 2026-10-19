import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { allowedUsers, user } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { AddUserForm, UserRowActions } from "./user-forms";

export const metadata: Metadata = { title: "ユーザー管理" };

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const rows = await db
    .select({
      githubLogin: allowedUsers.githubLogin,
      role: allowedUsers.role,
      invitedBy: allowedUsers.invitedBy,
      createdAt: allowedUsers.createdAt,
      name: user.name,
    })
    .from(allowedUsers)
    .leftJoin(user, eq(user.githubLogin, allowedUsers.githubLogin))
    .orderBy(asc(allowedUsers.createdAt));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="text-sm text-muted-foreground">
          ここに登録したGitHubユーザーだけがログインできます。削除すると、ログイン中の人もすぐに使えなくなります（学習の記録は残ります）。
        </p>
      </div>

      <AddUserForm />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GitHubユーザー名</TableHead>
              <TableHead>名前</TableHead>
              <TableHead>権限</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.githubLogin}>
                <TableCell className="font-mono">{r.githubLogin}</TableCell>
                <TableCell>
                  {r.name ?? <span className="text-muted-foreground">未ログイン</span>}
                </TableCell>
                <TableCell>
                  <UserRowActions
                    githubLogin={r.githubLogin}
                    role={r.role}
                    isSelf={r.githubLogin === me.githubLogin}
                    part="role"
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.createdAt.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </TableCell>
                <TableCell>
                  <UserRowActions
                    githubLogin={r.githubLogin}
                    role={r.role}
                    isSelf={r.githubLogin === me.githubLogin}
                    part="remove"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
