"use client";

import { buildProgram, type RunResult, runProgram } from "./harness";
import { runRubyInBrowser } from "./ruby-client";
import { transpile } from "./transpile";

/** ブラウザ内で実行できる言語 */
export type BrowserLanguage = "typescript" | "ruby";

const TIMEOUT_MS = 3000;

let workerUrl: string | null = null;

function getWorkerUrl() {
  if (!workerUrl) {
    const source = `
      const runProgram = ${runProgram.toString()};
      self.onmessage = async (e) => { self.postMessage(await runProgram(e.data)); };
    `;
    workerUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  }
  return workerUrl;
}

/**
 * 受講者のコードを Web Worker の中で実行する。
 * 画面を固めないためと、無限ループのときに Worker ごと止められるようにするため
 */
export async function runInBrowser(
  language: BrowserLanguage,
  code: string,
  tests: { name: string; code: string }[] = [],
): Promise<RunResult> {
  return language === "ruby" ? runRubyInBrowser(code, tests) : runTypeScriptInBrowser(code, tests);
}

async function runTypeScriptInBrowser(
  code: string,
  tests: { name: string; code: string }[],
): Promise<RunResult> {
  const transpiled = transpile(code);
  if ("error" in transpiled) return { logs: [], error: transpiled.error, tests: [] };

  const program = buildProgram(transpiled.js, tests);
  const worker = new Worker(getWorkerUrl());

  return new Promise<RunResult>((resolve) => {
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        logs: [],
        error: `${TIMEOUT_MS / 1000}秒以内に終わりませんでした。無限ループになっていないか確認してください。`,
        tests: [],
      });
    }, TIMEOUT_MS);

    worker.onmessage = (e: MessageEvent<RunResult>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(e.data);
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ logs: [], error: e.message, tests: [] });
    };
    worker.postMessage(program);
  });
}
