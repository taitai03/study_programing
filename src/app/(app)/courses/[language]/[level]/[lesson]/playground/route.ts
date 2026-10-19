import { getLesson } from "@/lib/content/loader";
import { getPlaygroundSource, zipPlayground } from "@/lib/content/playground";
import { getCurrentUser } from "@/lib/session";

/** レッスンの Playground を zip でダウンロードする */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/courses/[language]/[level]/[lesson]/playground">,
) {
  if (!(await getCurrentUser())) return new Response("ログインしてください", { status: 401 });

  const { language, level, lesson } = await params;
  // 教材にあるレッスンだけを対象にする（URL から任意のパスを読ませない）
  const data = await getLesson(`${language}/${level}/${lesson}`);
  const source = data?.hasPlayground ? await getPlaygroundSource(data.id) : null;
  if (!source) return new Response("Playground が見つかりません", { status: 404 });

  return new Response(Buffer.from(zipPlayground(source)), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${source.name}.zip"`,
    },
  });
}
