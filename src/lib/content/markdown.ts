import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeShiki, {
    themes: { light: "github-light", dark: "github-dark" },
    defaultLanguage: "text",
  })
  .use(rehypeStringify);

/** 教材の Markdown を HTML にする。教材はリポジトリで管理している信頼できる内容なので、そのまま埋め込む */
export async function renderMarkdown(markdown: string) {
  return String(await processor.process(markdown));
}
