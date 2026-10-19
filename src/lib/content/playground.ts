import fs from "node:fs/promises";
import path from "node:path";
import { strToU8, zipSync } from "fflate";
import { courseDir, lessonDir, readIfExists } from "./loader";

// Swift 初級は Xcode Playground で解く。教材は次のファイルから Playground を組み立てる
// - content/swift/beginner/NN-xxx/playground/Contents.swift … 受講者が書き換えるコード（セルフチェックを含む）
// - content/swift/beginner/SelfCheck.swift … セルフチェック用の関数。Playground の Sources/ に入れる
// - content/swift/beginner/NN-xxx/solution.swift … 模範解答。受講者には配らず、教材のテストで使う

const XCPLAYGROUND = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<playground version='5.0' target-platform='macos' swift-version='5' buildActiveScheme='true'>
    <timeline fileName='timeline.xctimeline'/>
</playground>
`;

export type PlaygroundSource = {
  /** Playground のフォルダ名（.playground を除く） */
  name: string;
  contents: string;
  selfCheck: string;
};

export async function getPlaygroundSource(lessonId: string): Promise<PlaygroundSource | null> {
  const contents = await readIfExists(path.join(lessonDir(lessonId), "playground", "Contents.swift"));
  if (contents === null) return null;
  const courseId = lessonId.split("/").slice(0, 2).join("/");
  const selfCheck = await fs.readFile(path.join(courseDir(courseId), "SelfCheck.swift"), "utf8");
  // 例: swift/beginner/01-xcode-errors → SakuraMart-01-xcode-errors
  return { name: `SakuraMart-${lessonId.split("/")[2]}`, contents, selfCheck };
}

/** Playground を zip にする。展開すると「SakuraMart-NN-xxx.playground」ができ、Xcode で開ける */
export function zipPlayground({ name, contents, selfCheck }: PlaygroundSource) {
  const root = `${name}.playground`;
  return zipSync({
    [root]: {
      "contents.xcplayground": strToU8(XCPLAYGROUND),
      "Contents.swift": strToU8(contents),
      Sources: { "SelfCheck.swift": strToU8(selfCheck) },
    },
  });
}
