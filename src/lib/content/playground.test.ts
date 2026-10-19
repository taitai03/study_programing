import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { getPlaygroundSource, zipPlayground } from "./playground";

describe("Playground の zip", () => {
  it("Xcode で開ける .playground フォルダの形になっている", async () => {
    const source = await getPlaygroundSource("swift/beginner/01-xcode-errors");
    expect(source).not.toBeNull();
    if (!source) return;

    const files = unzipSync(zipPlayground(source));
    const root = "SakuraMart-01-xcode-errors.playground";
    // フォルダのエントリ（/ で終わるもの）を除いたファイルの一覧
    expect(Object.keys(files).filter((f) => !f.endsWith("/")).sort()).toEqual([
      `${root}/Contents.swift`,
      `${root}/Sources/SelfCheck.swift`,
      `${root}/contents.xcplayground`,
    ]);
    expect(strFromU8(files[`${root}/Sources/SelfCheck.swift`])).toContain("public func check");
    expect(strFromU8(files[`${root}/contents.xcplayground`])).toContain("<playground");
  });

  it("Playground のないレッスンでは null を返す", async () => {
    expect(await getPlaygroundSource("typescript/beginner/01-read-errors")).toBeNull();
  });
});
