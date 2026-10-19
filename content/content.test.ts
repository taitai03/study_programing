// 教材のチェック。すべてのレッスンについて次を確認する
// - lesson.md / exercise.yaml / quiz.yaml の形式が正しい
// - 模範解答が型エラーなしで、すべてのテストに合格する（TypeScript / Ruby）
// - Playground の模範解答がセルフチェックをすべて通る（Swift。swiftc がある環境のみ）
// - 最初のコード（starter）のままでは合格しない
// - クイズの正解の番号が選択肢の範囲内にある
// - 演習のないレッスンにはクイズがある（クイズだけで完了できる）
// - PRで解く課題（task.yaml）には、テンプレート（templates/<リポジトリ名>/tasks/<スラッグ>/）がある
//   （開始ブランチでテストが失敗し、模範解答で通ることは scripts/templates.ts verify で確かめる）
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  getCourses,
  getLesson,
  lessonDir,
  readIfExists,
  templateRepoName,
} from "@/lib/content/loader";
import { getPlaygroundSource } from "@/lib/content/playground";
import type { Course } from "@/lib/content/schema";
import { buildProgram, runProgram } from "@/lib/runner/harness";
import { runRubyInNode } from "@/lib/runner/ruby-node";
import { transpile } from "@/lib/runner/transpile";

const run = promisify(execFile);

// ブラウザのエディタ（code-workspace.tsx）と同じ設定で型チェックする
const SANDBOX_LIB = `
declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
`;

function typeErrors(code: string): string[] {
  const files: Record<string, string> = { "main.ts": code, "sandbox.d.ts": SANDBOX_LIB };
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts"],
    strict: true,
    noEmit: true,
    moduleDetection: ts.ModuleDetectionKind.Force,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (name, lang, ...rest) =>
    name in files
      ? ts.createSourceFile(name, files[name], lang)
      : getSourceFile.call(host, name, lang, ...rest);
  const program = ts.createProgram(Object.keys(files), options, host);
  return ts
    .getPreEmitDiagnostics(program)
    .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

async function judge(
  language: Course["language"],
  code: string,
  tests: { name: string; code: string }[],
) {
  let result;
  if (language === "ruby") {
    result = await runRubyInNode(code, tests);
  } else {
    const t = transpile(code);
    if ("error" in t) return { passed: false, detail: t.error };
    result = await runProgram(buildProgram(t.js, tests));
  }
  const failed = result.tests.filter((r) => !r.passed);
  return {
    passed: !result.error && failed.length === 0,
    detail: result.error ?? failed.map((f) => `${f.name}: ${f.message}`).join("\n"),
  };
}

/** Playground のコードを、セルフチェック用の関数と一緒にコンパイルして実行する */
async function runSwift(selfCheck: string, code: string) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "playground-"));
  try {
    await fs.writeFile(path.join(dir, "SelfCheck.swift"), selfCheck);
    await fs.writeFile(path.join(dir, "main.swift"), code);
    const bin = path.join(dir, "main");
    try {
      await run("swiftc", ["-swift-version", "5", "-o", bin, "SelfCheck.swift", "main.swift"], {
        cwd: dir,
      });
    } catch (e) {
      return { passed: false, output: `コンパイルエラー\n${(e as { stderr?: string }).stderr}` };
    }
    const { stdout } = await run(bin);
    return { passed: stdout.includes("✅") && !stdout.includes("❌"), output: stdout };
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

const hasSwift = await run("swiftc", ["--version"]).then(
  () => true,
  () => false,
);

const courses = await getCourses();
const lessons = courses.flatMap((c) => c.lessons.map((l) => [l.id, c.language] as const));

describe.each(lessons)("%s", (lessonId, language) => {
  it("形式が正しく、模範解答が合格し、最初のコードでは合格しない", async () => {
    const lesson = await getLesson(lessonId);
    expect(lesson).not.toBeNull();
    const exercise = lesson?.exercise;
    if (exercise) {
      const typecheck = language === "typescript" && exercise.typecheck;
      if (typecheck) expect(typeErrors(exercise.solution)).toEqual([]);
      const solution = await judge(language, exercise.solution, exercise.tests);
      expect(solution.detail).toBe("");
      expect(solution.passed).toBe(true);

      const starter = await judge(language, exercise.starter, exercise.tests);
      const starterHasTypeErrors = typecheck && typeErrors(exercise.starter).length > 0;
      expect(starter.passed && !starterHasTypeErrors).toBe(false);
    } else if (lesson?.task) {
      // PRで解く課題は、コースのテンプレートに課題の準備（開始ブランチの差分と模範解答）がある
      const course = courses.find((c) => c.id === lesson.courseId);
      const repo = course && templateRepoName(course);
      expect(repo, "courses.yaml に templateRepo がありません").toBeTruthy();
      const taskDir = path.join(process.cwd(), "templates", repo ?? "", "tasks", lesson.slug);
      await expect(fs.stat(path.join(taskDir, "start"))).resolves.toBeTruthy();
      await expect(fs.stat(path.join(taskDir, "solution"))).resolves.toBeTruthy();
      expect(lesson.task.ticket).toContain("## 受け入れ条件");
      expect(lesson.quiz).not.toBeNull();
    } else {
      // 演習がないレッスンは、クイズに合格すれば完了になる
      expect(lesson?.quiz).not.toBeNull();
    }
    for (const q of lesson?.quiz?.questions ?? []) {
      expect(q.answer).toBeLessThan(q.choices.length);
    }
  });

  it.runIf(hasSwift && language === "swift")(
    "Playground の模範解答がセルフチェックをすべて通り、最初のコードでは通らない",
    async () => {
      const source = await getPlaygroundSource(lessonId);
      expect(source).not.toBeNull();
      if (!source) return;
      const solution = await readIfExists(path.join(lessonDir(lessonId), "solution.swift"));
      expect(solution).not.toBeNull();

      const solved = await runSwift(source.selfCheck, solution ?? "");
      expect(solved.output).not.toContain("❌");
      expect(solved.passed).toBe(true);

      const starter = await runSwift(source.selfCheck, source.contents);
      expect(starter.passed).toBe(false);
    },
    120_000,
  );
});

describe("templates/", () => {
  it("テンプレートの課題には、対応するレッスンの task.yaml がある", async () => {
    for (const course of courses.filter((c) => c.templateRepo)) {
      const tasksDir = path.join(process.cwd(), "templates", templateRepoName(course) ?? "", "tasks");
      const slugs = await fs.readdir(tasksDir).catch(() => []);
      for (const slug of slugs) {
        const lesson = await getLesson(`${course.id}/${slug}`);
        expect(lesson?.task, `${course.id}/${slug} に task.yaml がありません`).toBeTruthy();
      }
    }
  });
});
