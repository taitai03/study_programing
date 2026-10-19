import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type CourseWithLessons, getCourses } from "@/lib/content/loader";
import { courseHref, summarizeCourse } from "@/lib/course-progress";
import { getProgressMap, type LessonProgress } from "@/lib/progress";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "コース一覧" };

const MODE_LABELS = {
  browser: "ブラウザで学ぶ",
  playground: "Xcodeで学ぶ",
  pull_request: "ローカルで解いてPR",
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const [courses, progressMap] = await Promise.all([getCourses(), getProgressMap(user.id)]);

  const languages = [
    { key: "typescript", label: "JavaScript / TypeScript" },
    { key: "ruby", label: "Ruby / Rails" },
    { key: "swift", label: "Swift" },
  ] as const;
  const prep = courses.find((c) => c.language === "common");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">コース一覧</h1>
        <p className="text-sm text-muted-foreground">
          自分のレベルに合うコースから始めてください。各コースの最初に、前提となる知識のチェックリストがあります。
        </p>
      </div>

      {languages.map((lang) => (
        <section key={lang.key} className="space-y-3">
          <h2 className="text-lg font-semibold">{lang.label}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {courses
              .filter((c) => c.language === lang.key)
              .map((course) => (
                <CourseCard key={course.id} course={course} progressMap={progressMap} />
              ))}
          </div>
        </section>
      ))}

      {prep && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">共通</h2>
          <p className="text-sm text-muted-foreground">
            初級を終えたら、中級に進む前に受けてください。
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <CourseCard course={prep} progressMap={progressMap} />
          </div>
        </section>
      )}
    </div>
  );
}

function CourseCard({
  course,
  progressMap,
}: {
  course: CourseWithLessons;
  progressMap: Map<string, LessonProgress>;
}) {
  const s = summarizeCourse(course, progressMap);
  const content = (
    <Card
      className={
        s.available ? "h-full transition-colors hover:border-foreground/30" : "h-full opacity-60"
      }
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{course.levelLabel}</Badge>
          <span className="text-xs text-muted-foreground">{MODE_LABELS[course.mode]}</span>
        </div>
        <CardTitle className="text-base">{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-2">
        {s.available ? (
          <>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {s.completed} / {s.total} レッスン完了
              </span>
              <span>{s.percent}%</span>
            </div>
            <Progress value={s.percent} aria-label={`${course.title}の達成率`} />
            <div className="flex items-center gap-1 pt-1 text-sm font-medium">
              {s.completed === 0 ? "始める" : s.next ? "続きから" : "復習する"}
              <ArrowRightIcon className="size-4" />
            </div>
          </>
        ) : (
          <Badge variant="outline">準備中</Badge>
        )}
      </CardContent>
    </Card>
  );

  return s.available ? <Link href={courseHref(course.id)}>{content}</Link> : content;
}
