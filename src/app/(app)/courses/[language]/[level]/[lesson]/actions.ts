"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLesson } from "@/lib/content/loader";
import { recordPass, recordSubmission } from "@/lib/progress";
import { requireUser } from "@/lib/session";

const exerciseResultSchema = z.object({
  lessonId: z.string(),
  passedCount: z.number().int().nonnegative(),
  totalCount: z.number().int().positive(),
  typeErrors: z.number().int().nonnegative(),
});

/**
 * ブラウザ内で判定した演習の結果を記録する。
 * 判定はブラウザで行うので改ざんできるが、初級は自己学習が目的なので許容している（architecture.md 4.1）
 */
export async function submitExerciseResult(input: z.infer<typeof exerciseResultSchema>) {
  const user = await requireUser();
  const data = exerciseResultSchema.parse(input);
  const lesson = await getLesson(data.lessonId);
  if (!lesson?.exercise) throw new Error("演習が見つかりません");

  const passed =
    data.passedCount === data.totalCount &&
    data.totalCount === lesson.exercise.tests.length &&
    (!lesson.exercise.typecheck || data.typeErrors === 0);

  await recordSubmission({
    userId: user.id,
    lessonId: lesson.id,
    kind: "browser",
    status: passed ? "passed" : "failed",
    summary: data,
  });
  const completed = passed ? await recordPass(user.id, lesson, "exercise") : false;
  revalidatePath("/", "layout");
  return { passed, completed };
}

const quizAnswerSchema = z.object({
  lessonId: z.string(),
  answers: z.array(z.number().int().nonnegative()),
});

/** クイズはサーバーで採点する（正解は受講者に送らない） */
export async function submitQuiz(input: z.infer<typeof quizAnswerSchema>) {
  const user = await requireUser();
  const data = quizAnswerSchema.parse(input);
  const lesson = await getLesson(data.lessonId);
  if (!lesson?.quiz) throw new Error("クイズが見つかりません");

  // 解説は正解したときだけ返す（不正解のときに答えが分かってしまわないように）
  const results = lesson.quiz.questions.map((q, i) => {
    const correct = data.answers[i] === q.answer;
    return { correct, explanation: correct ? q.explanation : null };
  });
  const passed = results.every((r) => r.correct);

  await recordSubmission({
    userId: user.id,
    lessonId: lesson.id,
    kind: "quiz",
    status: passed ? "passed" : "failed",
    summary: { answers: data.answers },
  });
  const completed = passed ? await recordPass(user.id, lesson, "quiz") : false;
  revalidatePath("/", "layout");
  return { passed, completed, results };
}
