// 受講者のコードとテストを実行する。
// runProgram は Web Worker の中に文字列として埋め込んで実行するため、
// 外部の変数や import を一切参照しない自己完結した関数にしておくこと。

export type TestResult = { name: string; passed: boolean; message?: string };

export type RunResult = {
  /** console.log などの出力 */
  logs: string[];
  /** コードの実行そのものが失敗したときのエラー（行番号付き） */
  error?: string;
  /** テストを実行した場合の結果。実行のみの場合は空 */
  tests: TestResult[];
};

/** テストのコードの中で使える関数（expect, logs）を受け取る関数の本体を組み立てる */
export function buildProgram(js: string, tests: { name: string; code: string }[]) {
  const testFns = tests
    .map(
      (t) =>
        `{ name: ${JSON.stringify(t.name)}, fn: async (expect, logs) => {\n${t.code}\n} }`,
    )
    .join(",\n");
  return `${js}\n;return [\n${testFns}\n];`;
}

/** buildProgram で作ったコードを実行する。Worker からも Node.js（教材のテスト）からも使う */
export async function runProgram(program: string): Promise<RunResult> {
  const logs: string[] = [];

  const format = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value === undefined) return "undefined";
    if (typeof value === "function") return `[Function ${value.name || "(anonymous)"}]`;
    try {
      return JSON.stringify(value, null, 2) ?? String(value);
    } catch {
      return String(value);
    }
  };
  const write =
    (prefix: string) =>
    (...args: unknown[]) =>
      logs.push(prefix + args.map(format).join(" "));
  const sandboxConsole = {
    log: write(""),
    info: write(""),
    warn: write("[警告] "),
    error: write("[エラー] "),
  };

  const isEqual = (a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
      return false;
    }
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      isEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
    );
  };

  const expect = (actual: unknown) => {
    const fail = (expected: string) => {
      throw new Error(`期待した値: ${expected}\n実際の値: ${format(actual)}`);
    };
    return {
      toBe: (expected: unknown) => {
        if (!Object.is(actual, expected)) fail(format(expected));
      },
      toEqual: (expected: unknown) => {
        if (!isEqual(actual, expected)) fail(format(expected));
      },
      toBeTruthy: () => {
        if (!actual) fail("真になる値");
      },
      toContain: (item: unknown) => {
        const ok =
          typeof actual === "string"
            ? actual.includes(String(item))
            : Array.isArray(actual) && actual.some((v) => isEqual(v, item));
        if (!ok) fail(`${format(item)} を含む値`);
      },
      toThrow: () => {
        if (typeof actual !== "function") fail("関数");
        try {
          (actual as () => unknown)();
        } catch {
          return;
        }
        throw new Error("エラーが発生することを期待しましたが、発生しませんでした");
      },
    };
  };

  // new Function で包んだ分だけ行番号がずれるので、受講者のコードの行番号に直す
  const HEADER_LINES = 2;
  const describeError = (e: unknown) => {
    if (!(e instanceof Error)) return String(e);
    const match = /<anonymous>:(\d+):(\d+)/.exec(e.stack ?? "");
    const line = match ? Number(match[1]) - HEADER_LINES : null;
    const where = line && line > 0 ? `（${line}行目）` : "";
    return `${e.name}: ${e.message}${where}`;
  };

  let testFns: { name: string; fn: (expect: unknown, logs: string[]) => Promise<void> }[];
  try {
    const factory = new Function("console", program);
    testFns = factory(sandboxConsole);
  } catch (e) {
    return { logs, error: describeError(e), tests: [] };
  }

  const results: TestResult[] = [];
  for (const t of testFns) {
    try {
      await t.fn(expect, logs);
      results.push({ name: t.name, passed: true });
    } catch (e) {
      results.push({
        name: t.name,
        passed: false,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }
  return { logs, tests: results };
}
