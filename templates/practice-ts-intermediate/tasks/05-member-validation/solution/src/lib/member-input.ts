import { z } from "zod";

/** 会員登録の入力 */
export const memberInputSchema = z.object({
  name: z
    .string({ error: "名前を入力してください" })
    .trim()
    .min(1, "名前を入力してください")
    .max(50, "名前は50文字以内で入力してください"),
  email: z
    .string({ error: "メールアドレスを入力してください" })
    .trim()
    .toLowerCase()
    .pipe(z.email("メールアドレスの形式が正しくありません").max(254, "メールアドレスが長すぎます")),
});
export type MemberInput = z.infer<typeof memberInputSchema>;

/** zod のエラーを、項目ごとのメッセージ（項目ごとに最初の1つ）にする */
export function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[String(issue.path[0])] ??= issue.message;
  return fields;
}
