import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/components/github/submission-status";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCourses } from "@/lib/content/loader";
import { summarizeCourse } from "@/lib/course-progress";
import { getLearners } from "@/lib/mentor";
import { requireMentor } from "@/lib/session";

export const metadata: Metadata = { title: "受講者一覧" };

const ROLE_LABELS = { learner: "受講者", mentor: "メンター", admin: "管理者" } as const;

export default async function MentorPage() {
  await requireMentor();
  const [courses, learners] = await Promise.all([getCourses(), getLearners()]);
  const available = courses.filter((c) => c.lessons.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">受講者一覧</h1>
        <p className="text-sm text-muted-foreground">
          受講者ごとの、コース別の進み具合と最終活動日です。名前を選ぶと、レッスンごとの状態と提出の履歴を見られます。
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>受講者</TableHead>
              <TableHead>進めているコース</TableHead>
              <TableHead className="w-44">最終活動</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {learners.map((l) => {
              const started = available
                .map((c) => ({ course: c, s: summarizeCourse(c, l.progressMap) }))
                .filter(({ course, s }) =>
                  course.lessons.some((lesson) => l.progressMap.has(lesson.id)) || s.completed > 0,
                );
              return (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link
                      href={`/mentor/users/${l.githubLogin}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="size-8">
                        {l.image && <AvatarImage src={l.image} alt="" />}
                        <AvatarFallback>{l.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {l.githubLogin}・{ROLE_LABELS[l.role]}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {started.length === 0 ? (
                      <span className="text-sm text-muted-foreground">まだ始めていません</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {started.map(({ course, s }) => (
                          <Badge key={course.id} variant={s.percent === 100 ? "default" : "outline"}>
                            {course.title} {s.completed}/{s.total}（{s.percent}%）
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.lastActivity ? formatDateTime(l.lastActivity) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
