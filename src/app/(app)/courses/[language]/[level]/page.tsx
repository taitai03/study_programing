import { CheckCircle2Icon, CircleDashedIcon, CircleIcon, ClockIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCourse } from "@/lib/content/loader";
import { renderMarkdown } from "@/lib/content/markdown";
import { lessonHref, summarizeCourse } from "@/lib/course-progress";
import { getProgressMap } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export async function generateMetadata({
  params,
}: PageProps<"/courses/[language]/[level]">): Promise<Metadata> {
  const { language, level } = await params;
  const course = await getCourse(`${language}/${level}`);
  return { title: course?.title };
}

export default async function CoursePage({ params }: PageProps<"/courses/[language]/[level]">) {
  const user = await requireUser();
  const { language, level } = await params;
  const course = await getCourse(`${language}/${level}`);
  if (!course || course.lessons.length === 0) notFound();

  const progressMap = await getProgressMap(user.id);
  const summary = summarizeCourse(course, progressMap);
  const introHtml = await renderMarkdown(course.intro);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-10">
      <div className="space-y-3">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← コース一覧
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{course.levelLabel}</Badge>
          <span className="text-sm text-muted-foreground">{course.languageLabel}</span>
        </div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <div className="flex max-w-sm items-center gap-3">
          <Progress value={summary.percent} aria-label="達成率" />
          <span className="shrink-0 text-sm text-muted-foreground">
            {summary.completed} / {summary.total}
          </span>
        </div>
      </div>

      {course.intro && (
        <div
          className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-5 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: introHtml }}
        />
      )}

      <ol className="divide-y rounded-lg border">
        {course.lessons.map((lesson) => {
          const status = progressMap.get(lesson.id)?.status ?? "not_started";
          return (
            <li key={lesson.id}>
              <Link
                href={lessonHref(lesson.id)}
                className="flex items-start gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <StatusIcon status={status} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="font-medium">
                    {lesson.order}. {lesson.title}
                  </div>
                  <p className="text-sm text-muted-foreground">{lesson.summary}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  {lesson.minutes}分
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StatusIcon({ status }: { status: "not_started" | "in_progress" | "completed" }) {
  if (status === "completed") {
    return <CheckCircle2Icon className="mt-0.5 size-5 text-green-600" aria-label="完了" />;
  }
  if (status === "in_progress") {
    return <CircleDashedIcon className="mt-0.5 size-5 text-amber-500" aria-label="学習中" />;
  }
  return <CircleIcon className="mt-0.5 size-5 text-muted-foreground" aria-label="未着手" />;
}
