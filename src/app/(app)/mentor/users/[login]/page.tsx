import { CheckCircle2Icon, CircleDashedIcon, CircleIcon, ExternalLinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmissionStatusBadge, formatDateTime } from "@/components/github/submission-status";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCourses } from "@/lib/content/loader";
import { lessonHref, summarizeCourse } from "@/lib/course-progress";
import { getLearner, getUserRepos, getUserSubmissions } from "@/lib/mentor";
import { getProgressMap } from "@/lib/progress";
import type { PullRequestSummary } from "@/lib/pull-requests";
import { requireMentor } from "@/lib/session";

type Props = PageProps<"/mentor/users/[login]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { login } = await params;
  return { title: `${login} の学習状況` };
}

const KIND_LABELS = { browser: "ブラウザの演習", quiz: "クイズ", pull_request: "PR" } as const;

export default async function LearnerPage({ params }: Props) {
  await requireMentor();
  const { login } = await params;
  const learner = await getLearner(login);
  if (!learner) notFound();

  const [courses, progressMap, repos, subs] = await Promise.all([
    getCourses(),
    getProgressMap(learner.id),
    getUserRepos(learner.id),
    getUserSubmissions(learner.id),
  ]);
  const lessonTitles = new Map(
    courses.flatMap((c) => c.lessons.map((l) => [l.id, `${c.title} ${l.order}. ${l.title}`])),
  );
  const started = courses.filter(
    (c) =>
      c.lessons.some((l) => progressMap.has(l.id)) || repos.some((r) => r.courseId === c.id),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <div className="space-y-3">
        <Link href="/mentor" className="text-sm text-muted-foreground hover:text-foreground">
          ← 受講者一覧
        </Link>
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            {learner.image && <AvatarImage src={learner.image} alt="" />}
            <AvatarFallback>{learner.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{learner.name}</h1>
            <p className="text-sm text-muted-foreground">{learner.githubLogin}</p>
          </div>
        </div>
      </div>

      {started.length === 0 && (
        <p className="text-sm text-muted-foreground">まだどのコースも始めていません。</p>
      )}

      {started.map((course) => {
        const s = summarizeCourse(course, progressMap);
        const repo = repos.find((r) => r.courseId === course.id);
        return (
          <section key={course.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold">{course.title}</h2>
              <div className="flex w-48 items-center gap-2">
                <Progress value={s.percent} aria-label={`${course.title}の達成率`} />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {s.completed}/{s.total}
                </span>
              </div>
              {repo && (
                <a
                  href={`https://github.com/${repo.repoFullName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:underline"
                >
                  {repo.repoFullName}
                  <ExternalLinkIcon className="size-3" />
                </a>
              )}
            </div>
            <ol className="divide-y rounded-lg border text-sm">
              {course.lessons.map((lesson) => {
                const p = progressMap.get(lesson.id);
                return (
                  <li key={lesson.id} className="flex items-center gap-3 px-4 py-2">
                    {p?.status === "completed" ? (
                      <CheckCircle2Icon className="size-4 text-green-600" aria-label="完了" />
                    ) : p ? (
                      <CircleDashedIcon className="size-4 text-amber-500" aria-label="学習中" />
                    ) : (
                      <CircleIcon className="size-4 text-muted-foreground" aria-label="未着手" />
                    )}
                    <Link href={lessonHref(lesson.id)} className="flex-1 hover:underline">
                      {lesson.order}. {lesson.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {p?.exercisePassed && "演習 合格"}
                      {p?.exercisePassed && p?.quizPassed && "・"}
                      {p?.quizPassed && "クイズ 合格"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">提出の履歴</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ提出はありません。</p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">日時</TableHead>
                  <TableHead>レッスン</TableHead>
                  <TableHead>種類</TableHead>
                  <TableHead>判定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(sub.updatedAt)}
                    </TableCell>
                    <TableCell className="max-w-80 truncate text-sm">
                      {lessonTitles.get(sub.lessonId) ?? sub.lessonId}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.kind === "pull_request" ? (
                        <Link href={`/mentor/submissions/${sub.id}`} className="underline underline-offset-4">
                          PR #{sub.prNumber}
                          {(sub.summary as PullRequestSummary | null)?.merged && "（マージ済み）"}
                        </Link>
                      ) : (
                        KIND_LABELS[sub.kind]
                      )}
                    </TableCell>
                    <TableCell>
                      <SubmissionStatusBadge status={sub.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
