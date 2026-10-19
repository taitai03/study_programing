/**
 * PRの判定（GitHub API を呼ばない部分）。
 * - 課題で用意したテストや .github/ を変更したPRは判定対象外（invalid）
 * - テスト（チェック）が終わるまでは pending、すべて成功なら passed、1つでも失敗なら failed
 */

/** どの課題でも変更してはいけないパス */
export const ALWAYS_PROTECTED = [".github/**"];

/**
 * glob をパスの正規表現にする。使えるのは `**`（ディレクトリをまたぐ）、`*`、`?`。
 * 末尾が `/` なら、そのディレクトリの中のすべて
 */
export function globToRegExp(glob: string) {
  const pattern = glob.endsWith("/") ? `${glob}**` : glob;
  let re = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      // "**/" は0個以上のディレクトリ、末尾の "**" はその下のすべて
      if (pattern[i + 2] === "/") {
        re += "(?:.*/)?";
        i += 2;
      } else {
        re += ".*";
        i += 1;
      }
    } else if (c === "*") {
      re += "[^/]*";
    } else if (c === "?") {
      re += "[^/]";
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${re}$`);
}

export function matchesAny(file: string, globs: string[]) {
  return globs.some((g) => globToRegExp(g).test(file));
}

/** 変更してはいけないファイルのうち、PRで変更（追加・削除・名前の変更を含む）されたもの */
export function findTamperedFiles(
  files: { filename: string; previous_filename?: string }[],
  protectedPaths: string[],
) {
  const globs = [...ALWAYS_PROTECTED, ...protectedPaths];
  return files
    .flatMap((f) => [f.filename, f.previous_filename].filter((n): n is string => Boolean(n)))
    .filter((name, i, all) => all.indexOf(name) === i && matchesAny(name, globs));
}

export type CheckSummary = { name: string; conclusion: string | null; url?: string };

export type PullRequestJudgement = {
  status: "pending" | "passed" | "failed" | "invalid";
  tamperedFiles: string[];
  checks: CheckSummary[];
};

const OK_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

export function judgePullRequest(input: {
  files: { filename: string; previous_filename?: string }[];
  checkRuns: { name: string; status: string; conclusion: string | null; html_url?: string }[];
  protectedPaths: string[];
}): PullRequestJudgement {
  const tamperedFiles = findTamperedFiles(input.files, input.protectedPaths);
  const checks = input.checkRuns.map((c) => ({
    name: c.name,
    conclusion: c.status === "completed" ? c.conclusion : null,
    url: c.html_url,
  }));

  let status: PullRequestJudgement["status"];
  if (tamperedFiles.length > 0) status = "invalid";
  // テストのワークフローがまだ始まっていない、または実行中
  else if (checks.length === 0 || checks.some((c) => c.conclusion === null)) status = "pending";
  else if (checks.every((c) => OK_CONCLUSIONS.has(c.conclusion ?? ""))) status = "passed";
  else status = "failed";

  return { status, tamperedFiles, checks };
}

/** PRの向き先のブランチ名から、課題（レッスンのスラッグ）を取り出す。例: start/07-order-filter → 07-order-filter */
export function lessonSlugFromBaseRef(baseRef: string) {
  const m = /^start\/(\d{2}-[\w-]+)$/.exec(baseRef);
  return m ? m[1] : null;
}
