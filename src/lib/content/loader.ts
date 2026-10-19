import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";
import { parse as parseYaml } from "yaml";
import {
  type Course,
  courseSchema,
  type Exercise,
  exerciseSchema,
  lessonFrontmatterSchema,
  type Quiz,
  quizSchema,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type LessonMeta = {
  /** 例: typescript/beginner/01-read-errors */
  id: string;
  courseId: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  minutes: number;
};

export type Lesson = LessonMeta & {
  body: string;
  exercise: Exercise | null;
  quiz: Quiz | null;
};

export type CourseWithLessons = Course & {
  /** コースの入口に表示する説明と前提チェックリスト（README.md） */
  intro: string;
  lessons: LessonMeta[];
};

async function readIfExists(file: string) {
  try {
    return await fs.readFile(file, "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** すべてのコース。教材がまだないコースも「準備中」として含める */
export const getCourses = cache(async (): Promise<CourseWithLessons[]> => {
  const raw = await fs.readFile(path.join(CONTENT_DIR, "courses.yaml"), "utf8");
  const courses = courseSchema.array().parse(parseYaml(raw));
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      intro: (await readIfExists(path.join(CONTENT_DIR, course.id, "README.md"))) ?? "",
      lessons: await getLessonMetas(course.id),
    })),
  );
});

export async function getCourse(courseId: string) {
  return (await getCourses()).find((c) => c.id === courseId) ?? null;
}

async function getLessonMetas(courseId: string): Promise<LessonMeta[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(path.join(CONTENT_DIR, courseId));
  } catch {
    return [];
  }
  const slugs = entries.filter((e) => /^\d{2}-/.test(e)).sort();
  return Promise.all(
    slugs.map(async (slug) => {
      const file = path.join(CONTENT_DIR, courseId, slug, "lesson.md");
      const { data } = matter(await fs.readFile(file, "utf8"));
      const fm = lessonFrontmatterSchema.parse(data);
      return {
        id: `${courseId}/${slug}`,
        courseId,
        slug,
        order: Number(slug.slice(0, 2)),
        ...fm,
      };
    }),
  );
}

export const getLesson = cache(async (lessonId: string): Promise<Lesson | null> => {
  const courseId = lessonId.split("/").slice(0, 2).join("/");
  const course = await getCourse(courseId);
  const meta = course?.lessons.find((l) => l.id === lessonId);
  if (!meta) return null;

  const dir = path.join(CONTENT_DIR, lessonId);
  const { content } = matter(await fs.readFile(path.join(dir, "lesson.md"), "utf8"));
  const exerciseRaw = await readIfExists(path.join(dir, "exercise.yaml"));
  const quizRaw = await readIfExists(path.join(dir, "quiz.yaml"));

  return {
    ...meta,
    body: content,
    exercise: exerciseRaw ? exerciseSchema.parse(parseYaml(exerciseRaw)) : null,
    quiz: quizRaw ? quizSchema.parse(parseYaml(quizRaw)) : null,
  };
});
