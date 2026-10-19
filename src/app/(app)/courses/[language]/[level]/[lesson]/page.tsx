import { CheckCircle2Icon, ClockIcon, LightbulbIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCourse, getLesson } from "@/lib/content/loader";
import { renderMarkdown } from "@/lib/content/markdown";
import type { PublicQuiz } from "@/lib/content/schema";
import { courseHref, lessonHref } from "@/lib/course-progress";
import { getLessonProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";
import { CodeWorkspace } from "./code-workspace";
import { QuizForm } from "./quiz-form";

type Props = PageProps<"/courses/[language]/[level]/[lesson]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { language, level, lesson } = await params;
  const data = await getLesson(`${language}/${level}/${lesson}`);
  return { title: data?.title };
}

function Markdown({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div
      className={`prose prose-sm max-w-none dark:prose-invert prose-pre:text-[13px] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default async function LessonPage({ params }: Props) {
  const user = await requireUser();
  const { language, level, lesson: slug } = await params;
  const courseId = `${language}/${level}`;
  const [course, lesson] = await Promise.all([
    getCourse(courseId),
    getLesson(`${courseId}/${slug}`),
  ]);
  if (!course || !lesson) notFound();

  const progress = await getLessonProgress(user.id, lesson.id);
  const index = course.lessons.findIndex((l) => l.id === lesson.id);
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];

  const [bodyHtml, ticketHtml, hintHtmls] = await Promise.all([
    renderMarkdown(lesson.body),
    lesson.exercise ? renderMarkdown(lesson.exercise.ticket) : "",
    Promise.all((lesson.exercise?.hints ?? []).map(renderMarkdown)),
  ]);

  const publicQuiz: PublicQuiz | null = lesson.quiz && {
    questions: lesson.quiz.questions.map(({ question, choices }) => ({ question, choices })),
  };

  return (
    <div className="grid lg:grid-cols-2">
      <article className="space-y-10 px-6 py-8 lg:px-10">
        <header className="space-y-3">
          <Link
            href={courseHref(course.id)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {course.title}
          </Link>
          <h1 className="text-2xl font-bold">
            {lesson.order}. {lesson.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ClockIcon className="size-4" />
              {lesson.minutes}分
            </span>
            {progress.status === "completed" && (
              <Badge className="gap-1 bg-green-600 text-white">
                <CheckCircle2Icon className="size-3.5" />
                完了
              </Badge>
            )}
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="border-b pb-2 text-lg font-semibold">解説</h2>
          <Markdown html={bodyHtml} />
        </section>

        {lesson.exercise && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 border-b pb-2 text-lg font-semibold">
              演習（チケット）
              {progress.exercisePassed && <Badge variant="secondary">合格済み</Badge>}
            </h2>
            <p className="text-sm text-muted-foreground">
              右のエディタでコードを書き、「提出して判定」を押してください。受け入れ条件はすべて自動テストで確認します。
            </p>
            <Markdown html={ticketHtml} className="rounded-lg border p-5" />
            {hintHtmls.length > 0 && (
              <div className="space-y-2">
                {hintHtmls.map((html, i) => (
                  <details key={html} className="rounded-md border px-4 py-2 text-sm">
                    <summary className="flex cursor-pointer items-center gap-2 font-medium">
                      <LightbulbIcon className="size-4 text-amber-500" />
                      ヒント {i + 1}
                    </summary>
                    <Markdown html={html} className="pt-2" />
                  </details>
                ))}
              </div>
            )}
          </section>
        )}

        {publicQuiz && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 border-b pb-2 text-lg font-semibold">
              確認クイズ
              {progress.quizPassed && <Badge variant="secondary">合格済み</Badge>}
            </h2>
            <QuizForm lessonId={lesson.id} quiz={publicQuiz} />
          </section>
        )}

        <nav className="flex justify-between gap-4 border-t pt-6">
          {prev ? (
            <Button variant="outline" asChild>
              <Link href={lessonHref(prev.id)}>← {prev.title}</Link>
            </Button>
          ) : (
            <span />
          )}
          {next ? (
            <Button asChild>
              <Link href={lessonHref(next.id)}>{next.title} →</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <Link href={courseHref(course.id)}>コースのトップへ</Link>
            </Button>
          )}
        </nav>
      </article>

      {lesson.exercise && (
        <aside className="border-l bg-muted/20 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
          <CodeWorkspace
            key={lesson.id}
            lessonId={lesson.id}
            starter={lesson.exercise.starter}
            tests={lesson.exercise.tests}
            typecheck={lesson.exercise.typecheck}
          />
        </aside>
      )}
    </div>
  );
}
