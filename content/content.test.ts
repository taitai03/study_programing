// 教材のチェック。すべてのレッスンについて次を確認する
// - lesson.md / exercise.yaml / quiz.yaml の形式が正しい
// - 模範解答が型エラーなしで、すべてのテストに合格する
// - 最初のコード（starter）のままでは合格しない
// - クイズの正解の番号が選択肢の範囲内にある
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { getCourses, getLesson } from "@/lib/content/loader";
import { buildProgram, runProgram } from "@/lib/runner/harness";
import { transpile } from "@/lib/runner/transpile";

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

async function judge(code: string, tests: { name: string; code: string }[]) {
  const t = transpile(code);
  if ("error" in t) return { passed: false, detail: t.error };
  const result = await runProgram(buildProgram(t.js, tests));
  const failed = result.tests.filter((r) => !r.passed);
  return {
    passed: !result.error && failed.length === 0,
    detail: result.error ?? failed.map((f) => `${f.name}: ${f.message}`).join("\n"),
  };
}

const courses = await getCourses();
const lessonIds = courses.flatMap((c) => c.lessons.map((l) => l.id));

describe.each(lessonIds)("%s", (lessonId) => {
  it("形式が正しく、模範解答が合格し、最初のコードでは合格しない", async () => {
    const lesson = await getLesson(lessonId);
    expect(lesson).not.toBeNull();
    const exercise = lesson?.exercise;
    if (exercise) {
      if (exercise.typecheck) expect(typeErrors(exercise.solution)).toEqual([]);
      const solution = await judge(exercise.solution, exercise.tests);
      expect(solution.detail).toBe("");
      expect(solution.passed).toBe(true);

      const starter = await judge(exercise.starter, exercise.tests);
      const starterHasTypeErrors = exercise.typecheck && typeErrors(exercise.starter).length > 0;
      expect(starter.passed && !starterHasTypeErrors).toBe(false);
    }
    for (const q of lesson?.quiz?.questions ?? []) {
      expect(q.answer).toBeLessThan(q.choices.length);
    }
  });
});
