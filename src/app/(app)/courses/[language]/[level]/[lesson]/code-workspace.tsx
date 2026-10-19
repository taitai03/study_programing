"use client";

import Editor, { loader, type Monaco, type OnMount } from "@monaco-editor/react";
import {
  CheckCircle2Icon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  SendIcon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TestCase } from "@/lib/content/schema";
import { type BrowserLanguage, runInBrowser } from "@/lib/runner/client";
import type { RunResult } from "@/lib/runner/harness";
import { prepareRuby } from "@/lib/runner/ruby-client";
import { submitExerciseResult } from "./actions";

// エディタ本体はCDNから読み込む。バージョンは package.json の monaco-editor（型定義用）と揃える
loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs" } });

/** ブラウザで実行する受講者のコードには、DOM ではなく console だけを見せる */
const SANDBOX_LIB = `
declare const console: {
  log(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};
`;

function configureMonaco(monaco: Monaco) {
  const ts = monaco.typescript;
  ts.typescriptDefaults.setCompilerOptions({
    target: ts.ScriptTarget.ES2022,
    lib: ["lib.es2022.d.ts"],
    strict: true,
    noEmit: true,
    // レッスンごとのコードが同じグローバル空間に入って「重複した宣言」にならないよう、各ファイルをモジュールとして扱う
    moduleDetection: 3,
  });
  ts.typescriptDefaults.setExtraLibs([{ content: SANDBOX_LIB, filePath: "sandbox.d.ts" }]);
}

const LANGUAGES = {
  typescript: { label: "TypeScript", monaco: "typescript", extension: "ts" },
  ruby: { label: "Ruby", monaco: "ruby", extension: "rb" },
} satisfies Record<BrowserLanguage, { label: string; monaco: string; extension: string }>;

type TypeError = { line: number; message: string };

type Output =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "run"; result: RunResult }
  | { kind: "judge"; result: RunResult; typeErrors: TypeError[]; passed: boolean };

const draftKey = (lessonId: string) => `draft:${lessonId}`;

function readDraft(lessonId: string) {
  try {
    return localStorage.getItem(draftKey(lessonId));
  } catch {
    return null;
  }
}

function saveDraft(lessonId: string, code: string) {
  try {
    localStorage.setItem(draftKey(lessonId), code);
  } catch {
    // 保存できなくても学習は続けられる
  }
}

export function CodeWorkspace({
  lessonId,
  language,
  starter,
  tests,
  typecheck: typecheckOption,
}: {
  lessonId: string;
  language: BrowserLanguage;
  starter: string;
  tests: TestCase[];
  typecheck: boolean;
}) {
  const lang = LANGUAGES[language];
  // 型チェックができるのは TypeScript だけ
  const typecheck = language === "typescript" && typecheckOption;
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  // 書きかけのコードはブラウザに保存しておき、次に開いたときに復元する
  // （エディタはブラウザでしか描画しないので、サーバーでの描画結果とずれることはない）
  const [code, setCode] = useState(() =>
    typeof window === "undefined" ? starter : (readDraft(lessonId) ?? starter),
  );
  const [output, setOutput] = useState<Output>({ kind: "idle" });
  const [submitting, startSubmit] = useTransition();
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  // Ruby は実行環境（ruby.wasm）のダウンロードが必要なので、開いた時点で準備を始める
  const [runtimeReady, setRuntimeReady] = useState(language !== "ruby");

  useEffect(() => {
    if (language !== "ruby") return;
    let active = true;
    prepareRuby()
      .then(() => active && setRuntimeReady(true))
      .catch(() => {
        // 失敗したときは実行時にもう一度読み込み、エラーを出力に表示する
      });
    return () => {
      active = false;
    };
  }, [language]);

  async function getTypeErrors(): Promise<TypeError[]> {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return [];
    const getWorker = await monaco.typescript.getTypeScriptWorker();
    const worker = await getWorker(model.uri);
    const uri = model.uri.toString();
    const diagnostics = [
      ...(await worker.getSyntacticDiagnostics(uri)),
      ...(await worker.getSemanticDiagnostics(uri)),
    ];
    return diagnostics.map((d) => ({
      line: model.getPositionAt(d.start ?? 0).lineNumber,
      message:
        typeof d.messageText === "string" ? d.messageText : d.messageText.messageText,
    }));
  }

  async function run() {
    setOutput({ kind: "running" });
    setOutput({ kind: "run", result: await runInBrowser(language, code) });
  }

  function judge() {
    startSubmit(async () => {
      setOutput({ kind: "running" });
      const [result, typeErrors] = await Promise.all([
        runInBrowser(language, code, tests),
        typecheck ? getTypeErrors() : Promise.resolve([]),
      ]);
      const passedCount = result.tests.filter((t) => t.passed).length;
      const passed =
        !result.error && passedCount === tests.length && typeErrors.length === 0;
      setOutput({ kind: "judge", result, typeErrors, passed });

      const res = await submitExerciseResult({
        lessonId,
        passedCount,
        totalCount: tests.length,
        typeErrors: typeErrors.length,
      });
      if (res.passed) {
        toast.success(
          res.completed ? "合格しました。レッスン完了です" : "合格しました。確認クイズにも答えましょう",
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-[70vh] flex-col lg:h-full">
      <div className="flex items-center gap-2 border-b bg-background px-3 py-2">
        <span className="text-sm font-medium">エディタ</span>
        <span className="text-xs text-muted-foreground">{lang.label}</span>
        {!runtimeReady && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2Icon className="size-3 animate-spin" />
            {lang.label} を準備中
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCode(starter);
              saveDraft(lessonId, starter);
              setOutput({ kind: "idle" });
            }}
          >
            <RotateCcwIcon />
            最初に戻す
          </Button>
          <Button variant="outline" size="sm" onClick={run} disabled={submitting}>
            <PlayIcon />
            実行
          </Button>
          <Button size="sm" onClick={judge} disabled={submitting}>
            {submitting ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            提出して判定
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-[3]">
        <Editor
          path={`${lessonId}.${lang.extension}`}
          language={lang.monaco}
          value={code}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          beforeMount={configureMonaco}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          onChange={(value) => {
            setCode(value ?? "");
            saveDraft(lessonId, value ?? "");
          }}
          loading={<Loader2Icon className="size-5 animate-spin text-muted-foreground" />}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="min-h-0 flex-[2] overflow-auto border-t bg-background p-4 font-mono text-sm">
        <OutputView output={output} runtimeReady={runtimeReady} label={lang.label} />
      </div>
    </div>
  );
}

function OutputView({
  output,
  runtimeReady,
  label,
}: {
  output: Output;
  runtimeReady: boolean;
  label: string;
}) {
  if (output.kind === "idle") {
    return (
      <p className="font-sans text-muted-foreground">
        「実行」でコードを動かして出力を確認できます。できたら「提出して判定」を押してください。
      </p>
    );
  }
  if (output.kind === "running") {
    return (
      <div className="flex items-center gap-2 font-sans text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        {!runtimeReady && `${label} を準備しています。初回は少し時間がかかります`}
      </div>
    );
  }

  const { result } = output;
  return (
    <div className="space-y-4">
      {output.kind === "judge" && (
        <div
          className={`flex items-center gap-2 font-sans font-semibold ${
            output.passed ? "text-green-600" : "text-destructive"
          }`}
        >
          {output.passed ? <CheckCircle2Icon className="size-5" /> : <XCircleIcon className="size-5" />}
          {output.passed ? "合格です" : "まだ受け入れ条件を満たしていません"}
        </div>
      )}

      {result.error && (
        <div className="whitespace-pre-wrap rounded-md bg-destructive/10 p-3 text-destructive">
          {result.error}
        </div>
      )}

      {output.kind === "judge" && output.typeErrors.length > 0 && (
        <div className="space-y-1">
          <div className="font-sans text-xs font-semibold text-muted-foreground">型エラー</div>
          {output.typeErrors.map((e) => (
            <div key={`${e.line}:${e.message}`} className="text-destructive">
              {e.line}行目: {e.message}
            </div>
          ))}
        </div>
      )}

      {output.kind === "judge" && result.tests.length > 0 && (
        <div className="space-y-1">
          <div className="font-sans text-xs font-semibold text-muted-foreground">受け入れ条件</div>
          <ul className="space-y-1 font-sans">
            {result.tests.map((t) => (
              <li key={t.name}>
                <div className="flex items-start gap-2">
                  {t.passed ? (
                    <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
                  ) : (
                    <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                  )}
                  <span>{t.name}</span>
                </div>
                {t.message && (
                  <pre className="ml-6 mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    {t.message}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1">
        <div className="font-sans text-xs font-semibold text-muted-foreground">出力</div>
        {result.logs.length > 0 ? (
          <pre className="whitespace-pre-wrap">{result.logs.join("\n")}</pre>
        ) : (
          <p className="font-sans text-muted-foreground">（出力はありません）</p>
        )}
      </div>
    </div>
  );
}
