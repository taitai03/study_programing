"use client";

import type { RunResult } from "./harness";
import { buildRubyProgram, parseRubyResult, RUBY_WASI_SCRIPT_URL, RUBY_WASM_URL } from "./ruby";

/** Ruby の VM を起動するまでの制限時間（初回は ruby.wasm のダウンロードを含まない） */
const STARTUP_TIMEOUT_MS = 20000;
/** 受講者のコードを実行する制限時間 */
const RUN_TIMEOUT_MS = 5000;

let modulePromise: Promise<WebAssembly.Module> | null = null;

/**
 * ruby.wasm（約8MB）をダウンロードしてコンパイルする。一度だけ行い、実行ごとの Worker に渡す。
 * レッスンを開いた時点で呼んでおくと、最初の実行を待たずに済む
 */
export function prepareRuby() {
  if (!modulePromise) {
    modulePromise = WebAssembly.compileStreaming(fetch(RUBY_WASM_URL)).catch((e) => {
      modulePromise = null;
      throw e;
    });
  }
  return modulePromise;
}

let workerUrl: string | null = null;

function getWorkerUrl() {
  if (!workerUrl) {
    const source = `
      importScripts(${JSON.stringify(RUBY_WASI_SCRIPT_URL)});
      self.onmessage = async (e) => {
        try {
          const { vm } = await self["ruby-wasm-wasi"].DefaultRubyVM(e.data.module, { consolePrint: false });
          self.postMessage({ type: "started" });
          self.postMessage({ type: "result", json: vm.eval(e.data.program).toString() });
        } catch (err) {
          self.postMessage({ type: "failed", message: String(err && err.message ? err.message : err) });
        }
      };
    `;
    workerUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  }
  return workerUrl;
}

type WorkerMessage =
  | { type: "started" }
  | { type: "result"; json: string }
  | { type: "failed"; message: string };

/** Ruby のコードを Web Worker の中で実行する。無限ループのときは Worker ごと止める */
export async function runRubyInBrowser(
  code: string,
  tests: { name: string; code: string }[] = [],
): Promise<RunResult> {
  let rubyModule: WebAssembly.Module;
  try {
    rubyModule = await prepareRuby();
  } catch {
    return {
      logs: [],
      error: "Ruby を読み込めませんでした。ネットワークにつながっているか確認して、もう一度実行してください。",
      tests: [],
    };
  }

  const worker = new Worker(getWorkerUrl());
  return new Promise<RunResult>((resolve) => {
    let timer: ReturnType<typeof setTimeout>;
    const finish = (result: RunResult) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };
    const fail = (error: string) => finish({ logs: [], error, tests: [] });
    timer = setTimeout(() => fail("Ruby を起動できませんでした。ページを再読み込みしてください。"), STARTUP_TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const data = e.data;
      if (data.type === "started") {
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            fail(
              `${RUN_TIMEOUT_MS / 1000}秒以内に終わりませんでした。無限ループになっていないか確認してください。`,
            ),
          RUN_TIMEOUT_MS,
        );
      } else if (data.type === "result") {
        finish(parseRubyResult(data.json));
      } else {
        fail(data.message);
      }
    };
    worker.onerror = (e) => fail(e.message);
    worker.postMessage({ module: rubyModule, program: buildRubyProgram(code, tests) });
  });
}
