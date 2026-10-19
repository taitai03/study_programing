import type { CourseWithLessons } from "./content/loader";
import type { LessonProgress } from "./progress";

export function courseHref(courseId: string) {
  return `/courses/${courseId}`;
}

export function lessonHref(lessonId: string) {
  return `/courses/${lessonId}`;
}

export function summarizeCourse(
  course: CourseWithLessons,
  progressMap: Map<string, LessonProgress>,
) {
  const total = course.lessons.length;
  const completed = course.lessons.filter(
    (l) => progressMap.get(l.id)?.status === "completed",
  ).length;
  const next =
    course.lessons.find((l) => progressMap.get(l.id)?.status !== "completed") ?? null;
  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    available: total > 0,
    next,
  };
}
