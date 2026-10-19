// さくらマートのテンプレートリポジトリ（templates/<リポジトリ名>/）を検証・公開する。
//
//   npx tsx scripts/templates.ts verify <リポジトリ名> [課題のスラッグ...]
//     課題ごとに開始ブランチの内容を組み立て、次を確認する
//     - 開始ブランチのままではテストが失敗する
//     - 模範解答（tasks/<スラッグ>/solution/）を当てるとテストが通る
//     - 模範解答が、変更してはいけないファイル（protectedPaths）を変更していない
//     - 課題で追加したテストが protectedPaths に含まれている
//
//   npx tsx scripts/templates.ts checkout <リポジトリ名> <スラッグ> <出力先> [--solution]
//     課題の開始ブランチの内容（--solution なら模範解答を当てたもの）を出力先に作る。教材を作るときの確認用
//
//   npx tsx scripts/templates.ts publish <リポジトリ名> <出力先のディレクトリ>
//     main（base/）と、課題ごとの開始ブランチ（start/<スラッグ>）を持つ Git リポジトリを作る。
//     模範解答は含めない。できたリポジトリを GitHub に push する（手順は templates/README.md）
//
// テンプレートの構成
//   templates/<リポジトリ名>/template.yaml   コースID、テストの準備と実行のコマンド
//   templates/<リポジトリ名>/base/           main ブランチの内容（さくらマートのアプリ）
//   templates/<リポジトリ名>/tasks/<スラッグ>/start/     開始ブランチで追加・上書きするファイル
//   templates/<リポジトリ名>/tasks/<スラッグ>/solution/  模範解答（開始ブランチに上書きする）
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { courseSchema, taskSchema } from "../src/lib/content/schema";
import { findTamperedFiles, matchesAny } from "../src/lib/github/judge";

const ROOT = path.resolve(import.meta.dirname, "..");

const templateSchema = z.object({
  /** content/ のコースID。例: typescript/intermediate */
  course: z.string(),
  /** テストの前に一度だけ実行する（依存のインストールなど） */
  setup: z.string().optional(),
  /** テストを実行するコマンド。失敗したら終了コード0以外を返す */
  test: z.string(),
  /** setup の結果を使い回せるファイル（これらが base と同じなら、setup の代わりにコピーする） */
  reuse: z
    .object({ when: z.array(z.string()), dirs: z.array(z.string()) })
    .optional(),
  /** コピーしないファイル（依存やビルド結果） */
  ignore: z.array(z.string()).default([]),
});

function loadTemplate(name: string) {
  const dir = path.join(ROOT, "templates", name);
  const template = templateSchema.parse(
    parseYaml(fs.readFileSync(path.join(dir, "template.yaml"), "utf8")),
  );
  const courses = courseSchema.array().parse(
    parseYaml(fs.readFileSync(path.join(ROOT, "content", "courses.yaml"), "utf8")),
  );
  const course = courses.find((c) => c.id === template.course);
  if (!course) throw new Error(`コース ${template.course} が courses.yaml にありません`);
  if (course.templateRepo?.split("/")[1] !== name) {
    throw new Error(`courses.yaml の ${course.id} の templateRepo が ${name} になっていません`);
  }
  const tasksDir = path.join(dir, "tasks");
  const slugs = fs.existsSync(tasksDir)
    ? fs.readdirSync(tasksDir).filter((s) => /^\d{2}-/.test(s)).sort()
    : [];
  return { dir, template, course, slugs };
}

function loadTask(courseId: string, slug: string) {
  const lessonDir = path.join(ROOT, "content", courseId, slug);
  const raw = fs.readFileSync(path.join(lessonDir, "task.yaml"), "utf8");
  const lessonMd = fs.readFileSync(path.join(lessonDir, "lesson.md"), "utf8");
  const title = /^title:\s*(.+)$/m.exec(lessonMd)?.[1].trim() ?? slug;
  return { task: taskSchema.parse(parseYaml(raw)), title };
}

/** ディレクトリの中のファイル（相対パス）をすべて返す */
function listFiles(dir: string, ignore: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const p = rel ? `${rel}/${entry.name}` : entry.name;
      if (matchesAny(p, ignore) || matchesAny(`${p}/`, ignore)) continue;
      if (entry.isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk("");
  return out;
}

function copyInto(from: string, to: string, ignore: string[] = []) {
  for (const file of listFiles(from, ignore)) {
    const dest = path.join(to, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(from, file), dest);
    fs.chmodSync(dest, fs.statSync(path.join(from, file)).mode);
  }
}

function taskMarkdown(title: string, ticket: string) {
  return `# ${title}\n\n${ticket.trim()}\n\n---\n\n課題で用意したテストと \`.github/\` は変更しないでください。変更したPRは判定の対象外になります。\n`;
}

/**
 * 差分（start/ や solution/）を当てる。ファイルを上書き・追加し、
 * .delete（1行に1つのパス）に書いたファイルは消す
 */
function applyOverlay(overlay: string, dest: string) {
  copyInto(overlay, dest, [".delete"]);
  const list = path.join(overlay, ".delete");
  if (!fs.existsSync(list)) return;
  for (const file of fs.readFileSync(list, "utf8").split("\n").map((l) => l.trim()).filter(Boolean)) {
    fs.rmSync(path.join(dest, file), { force: true });
  }
}

/** 課題の開始ブランチの内容を dest に作る（solution が true なら模範解答も当てる） */
function buildTaskTree(
  t: ReturnType<typeof loadTemplate>,
  slug: string,
  dest: string,
  withSolution: boolean,
) {
  const { task, title } = loadTask(t.course.id, slug);
  copyInto(path.join(t.dir, "base"), dest, t.template.ignore);
  applyOverlay(path.join(t.dir, "tasks", slug, "start"), dest);
  fs.writeFileSync(path.join(dest, "TASK.md"), taskMarkdown(title, task.ticket));
  if (withSolution) applyOverlay(path.join(t.dir, "tasks", slug, "solution"), dest);
  return task;
}

function run(command: string, cwd: string) {
  const res = spawnSync("bash", ["-c", command], { cwd, encoding: "utf8", env: process.env });
  return { ok: res.status === 0, output: `${res.stdout}\n${res.stderr}` };
}

function sameFiles(a: string, b: string, files: string[]) {
  return files.every((f) => {
    const pa = path.join(a, f);
    const pb = path.join(b, f);
    return (
      fs.existsSync(pa) === fs.existsSync(pb) &&
      (!fs.existsSync(pa) || fs.readFileSync(pa).equals(fs.readFileSync(pb)))
    );
  });
}

/** setup を実行する。依存が base と同じなら、base で一度だけ実行した結果をコピーして使う */
function setup(t: ReturnType<typeof loadTemplate>, tree: string, cache: { dir?: string }) {
  const { setup, reuse } = t.template;
  if (!setup) return;
  if (reuse) {
    if (!cache.dir) {
      cache.dir = fs.mkdtempSync(path.join(os.tmpdir(), "template-base-"));
      copyInto(path.join(t.dir, "base"), cache.dir, t.template.ignore);
      const res = run(setup, cache.dir);
      if (!res.ok) throw new Error(`base の setup に失敗しました\n${res.output}`);
    }
    if (sameFiles(cache.dir, tree, reuse.when)) {
      for (const d of reuse.dirs) {
        execFileSync("cp", ["-a", path.join(cache.dir, d), path.join(tree, d)]);
      }
      return;
    }
  }
  const res = run(setup, tree);
  if (!res.ok) throw new Error(`setup に失敗しました\n${res.output}`);
}

function verify(name: string, only: string[]) {
  const t = loadTemplate(name);
  const slugs = only.length ? only : t.slugs;
  const cache: { dir?: string } = {};
  let failed = 0;

  for (const slug of slugs) {
    const errors: string[] = [];
    const startDir = fs.mkdtempSync(path.join(os.tmpdir(), `${slug}-start-`));
    const solvedDir = fs.mkdtempSync(path.join(os.tmpdir(), `${slug}-solved-`));
    try {
      const task = buildTaskTree(t, slug, startDir, false);
      buildTaskTree(t, slug, solvedDir, true);
      const protectedPaths = [...t.course.protectedPaths, ...task.protectedPaths];

      // 課題で追加したテストやチェックが、変更禁止になっているか
      const startFiles = listFiles(path.join(t.dir, "tasks", slug, "start"));
      for (const f of startFiles) {
        const isCheck = /(\.task\.test\.|_task_spec\.rb$|TaskTests?\.swift$)/.test(f) || f.startsWith(".task/");
        if (isCheck && findTamperedFiles([{ filename: f }], protectedPaths).length === 0) {
          errors.push(`課題のテスト ${f} が protectedPaths に含まれていません`);
        }
      }
      // 模範解答が、変更禁止のファイルを変更していないか（していたら、模範解答のPRが判定対象外になる）
      const solutionDir = path.join(t.dir, "tasks", slug, "solution");
      const deleteList = path.join(solutionDir, ".delete");
      const solutionFiles = [
        ...listFiles(solutionDir, [".delete"]),
        ...(fs.existsSync(deleteList) ? fs.readFileSync(deleteList, "utf8").split("\n").map((l) => l.trim()).filter(Boolean) : []),
      ];
      const tampered = findTamperedFiles(
        solutionFiles.map((filename) => ({ filename })),
        protectedPaths,
      );
      if (tampered.length) errors.push(`模範解答が変更禁止のファイルを変更しています: ${tampered.join(", ")}`);
      if (solutionFiles.length === 0) errors.push("模範解答（solution/）がありません");

      setup(t, startDir, cache);
      const start = run(t.template.test, startDir);
      if (start.ok) errors.push("開始ブランチのままでテストが通ってしまいます");

      setup(t, solvedDir, cache);
      const solved = run(t.template.test, solvedDir);
      if (!solved.ok) errors.push(`模範解答でテストが通りません\n${solved.output.slice(-4000)}`);
    } catch (e) {
      errors.push(String(e));
    } finally {
      fs.rmSync(startDir, { recursive: true, force: true });
      fs.rmSync(solvedDir, { recursive: true, force: true });
    }
    if (errors.length) {
      failed++;
      console.log(`❌ ${slug}\n${errors.map((e) => `   ${e}`).join("\n")}`);
    } else {
      console.log(`✅ ${slug}`);
    }
  }
  if (cache.dir) fs.rmSync(cache.dir, { recursive: true, force: true });
  if (failed) process.exit(1);
}

function git(cwd: string, ...args: string[]) {
  execFileSync("git", args, { cwd, stdio: "inherit" });
}

function publish(name: string, outDir: string) {
  const t = loadTemplate(name);
  const out = path.resolve(outDir);
  if (fs.existsSync(out) && fs.readdirSync(out).length > 0) {
    throw new Error(`${out} が空ではありません`);
  }
  fs.mkdirSync(out, { recursive: true });
  git(out, "init", "-q", "-b", "main");
  const commit = (message: string) => {
    git(out, "add", "-A");
    git(out, "-c", "user.name=study-programing", "-c", "user.email=study-programing@users.noreply.github.com", "commit", "-q", "-m", message);
  };

  copyInto(path.join(t.dir, "base"), out, t.template.ignore);
  commit("さくらマート");

  for (const slug of t.slugs) {
    git(out, "switch", "-q", "-c", `start/${slug}`, "main");
    const { task, title } = loadTask(t.course.id, slug);
    applyOverlay(path.join(t.dir, "tasks", slug, "start"), out);
    fs.writeFileSync(path.join(out, "TASK.md"), taskMarkdown(title, task.ticket));
    commit(`課題: ${title}`);
  }
  git(out, "switch", "-q", "main");
  console.log(`\n${out} に main と ${t.slugs.length} 個の開始ブランチを作りました。`);
  console.log("GitHub に push するには、次を実行してください:");
  console.log(`  cd ${out}`);
  console.log(`  git remote add origin git@github.com:${t.course.templateRepo}.git`);
  console.log("  git push --force origin --all");
}

const [command, name, ...rest] = process.argv.slice(2);
if (command === "verify" && name) verify(name, rest);
else if (command === "checkout" && name && rest[0] && rest[1]) {
  const out = path.resolve(rest[1]);
  fs.mkdirSync(out, { recursive: true });
  buildTaskTree(loadTemplate(name), rest[0], out, rest.includes("--solution"));
  console.log(`${out} に作りました`);
}
else if (command === "publish" && name && rest[0]) publish(name, rest[0]);
else {
  console.error("使い方: npx tsx scripts/templates.ts verify <リポジトリ名> [スラッグ...]");
  console.error("        npx tsx scripts/templates.ts checkout <リポジトリ名> <スラッグ> <出力先> [--solution]");
  console.error("        npx tsx scripts/templates.ts publish <リポジトリ名> <出力先>");
  process.exit(1);
}
