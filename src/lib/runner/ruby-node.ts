// 教材のテスト（Node.js）で Ruby のコードを実行する。ブラウザでは ruby-client.ts を使う
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { DefaultRubyVM } from "@ruby/wasm-wasi/dist/browser";
import type { RunResult } from "./harness";
import { buildRubyProgram, parseRubyResult } from "./ruby";

let modulePromise: Promise<WebAssembly.Module> | null = null;

function loadModule() {
  if (!modulePromise) {
    const require = createRequire(import.meta.url);
    const file = require.resolve("@ruby/3.4-wasm-wasi/dist/ruby+stdlib.wasm");
    modulePromise = fs.readFile(file).then((bytes) => WebAssembly.compile(bytes));
  }
  return modulePromise;
}

/** 実行ごとに新しい Ruby の VM を作る（前の実行で定義したメソッドなどが残らないように） */
export async function runRubyInNode(
  code: string,
  tests: { name: string; code: string }[] = [],
): Promise<RunResult> {
  const { vm } = await DefaultRubyVM(await loadModule(), { consolePrint: false });
  return parseRubyResult(vm.eval(buildRubyProgram(code, tests)).toString());
}
