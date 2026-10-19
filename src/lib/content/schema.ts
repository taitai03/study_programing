import { z } from "zod";

export const LEVELS = ["beginner", "prep", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const courseSchema = z.object({
  /** content/ からのパス。例: typescript/beginner */
  id: z.string(),
  language: z.enum(["typescript", "ruby", "swift", "common"]),
  languageLabel: z.string(),
  level: z.enum(LEVELS),
  levelLabel: z.string(),
  title: z.string(),
  description: z.string(),
  /** 学び方。browser: ブラウザ内で実行、playground: Xcode Playground、pull_request: ローカルで解いてPR */
  mode: z.enum(["browser", "playground", "pull_request"]),
  /** ダッシュボードに表示する学び方。省略すると mode から決める */
  modeLabel: z.string().optional(),
  /**
   * PRで解く課題のテンプレートリポジトリ（例: taitai03/practice-ts-intermediate）。
   * 受講者はここから同じ名前のリポジトリを自分のアカウントに作る
   */
  templateRepo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional(),
  /** コースのすべてのPR課題で、受講者が変更してはいけないファイル（テストの設定など）。glob で書く */
  protectedPaths: z.array(z.string()).default([]),
});
export type Course = z.infer<typeof courseSchema>;

export const lessonFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  minutes: z.number().int().positive(),
});

export const testCaseSchema = z.object({
  name: z.string(),
  code: z.string(),
});
export type TestCase = z.infer<typeof testCaseSchema>;

export const exerciseSchema = z.object({
  /** 業務チケット形式の課題文（Markdown） */
  ticket: z.string(),
  /** エディタに最初に表示するコード */
  starter: z.string(),
  /** 模範解答。受講者には送らない。教材のテストで、テストが通ることを確認するために使う */
  solution: z.string(),
  tests: z.array(testCaseSchema).min(1),
  hints: z.array(z.string()).default([]),
  /** true なら、型エラーが残っている間は合格にしない */
  typecheck: z.boolean().default(true),
});
export type Exercise = z.infer<typeof exerciseSchema>;

/**
 * ローカルで解いてPRを出す課題（task.yaml）。
 * 開始ブランチは start/<レッスンのスラッグ>（例: start/07-order-filter）。
 * テンプレートリポジトリ側の準備（コード、テスト）は templates/<リポジトリ名>/tasks/<スラッグ>/ に置く
 */
export const taskSchema = z.object({
  /** 業務チケット形式の課題文（Markdown）。開始ブランチの TASK.md にも同じ内容を入れる */
  ticket: z.string(),
  /**
   * 受講者が変更してはいけないファイル（課題で用意したテストなど）。glob で書く。
   * これらと .github/ を変更したPRは判定対象外にする
   */
  protectedPaths: z.array(z.string()).default([]),
  hints: z.array(z.string()).default([]),
});
export type Task = z.infer<typeof taskSchema>;

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string(),
        choices: z.array(z.string()).min(2),
        /** 正解の選択肢の番号（0始まり） */
        answer: z.number().int().nonnegative(),
        explanation: z.string(),
      }),
    )
    .min(1),
});
export type Quiz = z.infer<typeof quizSchema>;

/** 受講者に送るクイズ（正解と解説を含めない） */
export type PublicQuiz = {
  questions: { question: string; choices: string[] }[];
};
