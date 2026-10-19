import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  findTamperedFiles,
  globToRegExp,
  judgePullRequest,
  lessonSlugFromBaseRef,
} from "./judge";
import { verifyWebhookSignature } from "./webhook-signature";

describe("globToRegExp", () => {
  it.each([
    ["src/**/*.task.test.ts", "src/lib/order.task.test.ts", true],
    ["src/**/*.task.test.ts", "src/order.task.test.ts", true],
    ["src/**/*.task.test.ts", "src/lib/order.test.ts", false],
    ["spec/tasks/", "spec/tasks/a/b_spec.rb", true],
    ["spec/tasks/", "spec/other_spec.rb", false],
    [".github/**", ".github/workflows/test.yml", true],
    ["*.md", "TASK.md", true],
    ["*.md", "docs/TASK.md", false],
    ["Tests/Task?/x.swift", "Tests/Task1/x.swift", true],
    ["a.b", "axb", false],
  ])("%s と %s → %s", (glob, file, expected) => {
    expect(globToRegExp(glob).test(file)).toBe(expected);
  });
});

describe("findTamperedFiles", () => {
  it(".github/ は常に対象。名前を変えた場合は元の名前も見る", () => {
    expect(
      findTamperedFiles(
        [
          { filename: "src/order.ts" },
          { filename: ".github/workflows/test.yml" },
          { filename: "src/moved.ts", previous_filename: "tests/task/order.test.ts" },
        ],
        ["tests/task/**"],
      ),
    ).toEqual([".github/workflows/test.yml", "tests/task/order.test.ts"]);
  });
});

describe("judgePullRequest", () => {
  const files = [{ filename: "src/order.ts" }];
  const done = (conclusion: string) => ({ name: "test", status: "completed", conclusion });

  it("テストが変更されていたら、チェックの結果にかかわらず判定対象外", () => {
    const r = judgePullRequest({
      files: [{ filename: "tests/task/a.test.ts" }],
      checkRuns: [done("success")],
      protectedPaths: ["tests/task/**"],
    });
    expect(r.status).toBe("invalid");
    expect(r.tamperedFiles).toEqual(["tests/task/a.test.ts"]);
  });

  it("チェックがまだない、または実行中なら判定待ち", () => {
    expect(judgePullRequest({ files, checkRuns: [], protectedPaths: [] }).status).toBe("pending");
    expect(
      judgePullRequest({
        files,
        checkRuns: [done("success"), { name: "lint", status: "in_progress", conclusion: null }],
        protectedPaths: [],
      }).status,
    ).toBe("pending");
  });

  it("すべて成功（スキップを含む）なら合格、1つでも失敗なら不合格", () => {
    expect(
      judgePullRequest({ files, checkRuns: [done("success"), done("skipped")], protectedPaths: [] })
        .status,
    ).toBe("passed");
    expect(
      judgePullRequest({ files, checkRuns: [done("success"), done("failure")], protectedPaths: [] })
        .status,
    ).toBe("failed");
  });
});

describe("lessonSlugFromBaseRef", () => {
  it("start/ で始まるブランチだけ課題とみなす", () => {
    expect(lessonSlugFromBaseRef("start/07-order-filter")).toBe("07-order-filter");
    expect(lessonSlugFromBaseRef("main")).toBeNull();
    expect(lessonSlugFromBaseRef("start/../main")).toBeNull();
  });
});

describe("verifyWebhookSignature", () => {
  const body = '{"action":"opened"}';
  const sign = (secret: string) =>
    `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  it("同じシークレットで署名したものだけ通す", () => {
    expect(verifyWebhookSignature(body, sign("s3cret"), "s3cret")).toBe(true);
    expect(verifyWebhookSignature(body, sign("other"), "s3cret")).toBe(false);
    expect(verifyWebhookSignature(body, null, "s3cret")).toBe(false);
    expect(verifyWebhookSignature(body, "sha256=abc", "s3cret")).toBe(false);
  });
});
