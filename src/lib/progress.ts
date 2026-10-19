import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { progress, submissions } from "@/db/schema";
import type { Lesson } from "./content/loader";

export type LessonProgress = {
  status: "not_started" | "in_progress" | "completed";
  exercisePassed: boolean;
  quizPassed: boolean;
};

const NOT_STARTED: LessonProgress = {
  status: "not_started",
  exercisePassed: false,
  quizPassed: false,
};

export async function getProgressMap(userId: string) {
  const rows = await db.select().from(progress).where(eq(progress.userId, userId));
  return new Map(
    rows.map((r) => [
      r.lessonId,
      {
        status: r.status,
        exercisePassed: r.exercisePassedAt !== null,
        quizPassed: r.quizPassedAt !== null,
      } satisfies LessonProgress,
    ]),
  );
}

export async function getLessonProgress(userId: string, lessonId: string) {
  return (await getProgressMap(userId)).get(lessonId) ?? NOT_STARTED;
}

/**
 * 演習またはクイズの合格を記録する。
 * レッスンにある演習（ブラウザの演習、またはPRの課題）とクイズの両方に合格したら、レッスンを完了にする
 */
export async function recordPass(
  userId: string,
  lesson: Pick<Lesson, "id" | "exercise" | "task" | "quiz">,
  part: "exercise" | "quiz",
) {
  const now = new Date();
  const column = part === "exercise" ? "exercisePassedAt" : "quizPassedAt";

  await db
    .insert(progress)
    .values({ userId, lessonId: lesson.id, [column]: now })
    .onConflictDoUpdate({
      target: [progress.userId, progress.lessonId],
      // 最初に合格した日時を残す
      set: {
        [column]: sql`coalesce(${progress[column]}, excluded.${sql.identifier(progress[column].name)})`,
        updatedAt: now,
      },
    });

  const [row] = await db
    .select()
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.lessonId, lesson.id)));

  const done =
    (!(lesson.exercise || lesson.task) || row.exercisePassedAt !== null) &&
    (!lesson.quiz || row.quizPassedAt !== null);
  if (done && row.status !== "completed") {
    await db
      .update(progress)
      .set({ status: "completed", completedAt: now, updatedAt: now })
      .where(and(eq(progress.userId, userId), eq(progress.lessonId, lesson.id)));
  }
  return done;
}

export async function recordSubmission(values: typeof submissions.$inferInsert) {
  await db.insert(submissions).values(values);
}
