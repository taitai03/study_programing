"use client";

import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PublicQuiz } from "@/lib/content/schema";
import { submitQuiz } from "./actions";

type Result = Awaited<ReturnType<typeof submitQuiz>>;

/** `コード` の部分だけをコード表示にする（クイズの文はMarkdownではなくプレーンテキスト） */
function InlineCode({ text }: { text: string }) {
  // Label は flex なので、span で包んで1つの文として折り返させる
  return (
    <span>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export function QuizForm({ lessonId, quiz }: { lessonId: string; quiz: PublicQuiz }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<(number | null)[]>(quiz.questions.map(() => null));
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();
  const allAnswered = answers.every((a) => a !== null);

  function submit() {
    startTransition(async () => {
      const res = await submitQuiz({ lessonId, answers: answers.map((a) => a ?? -1) });
      setResult(res);
      if (res.passed) {
        toast.success(
          res.completed ? "全問正解です。レッスン完了です" : "全問正解です。演習にも合格しましょう",
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {quiz.questions.map((q, qi) => {
        const r = result?.results[qi];
        return (
          <fieldset key={q.question} className="space-y-3">
            <legend className="text-sm font-medium">
              Q{qi + 1}. <InlineCode text={q.question} />
            </legend>
            <RadioGroup
              value={answers[qi]?.toString() ?? ""}
              onValueChange={(v) => {
                setAnswers((prev) => prev.map((a, i) => (i === qi ? Number(v) : a)));
                setResult(null);
              }}
            >
              {q.choices.map((choice, ci) => (
                <div key={choice} className="flex items-center gap-2">
                  <RadioGroupItem value={ci.toString()} id={`q${qi}-c${ci}`} />
                  <Label htmlFor={`q${qi}-c${ci}`} className="font-normal">
                    <InlineCode text={choice} />
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {r && (
              <div
                className={`flex gap-2 rounded-md p-3 text-sm ${
                  r.correct ? "bg-green-600/10" : "bg-destructive/10"
                }`}
              >
                {r.correct ? (
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-green-600" />
                ) : (
                  <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <div>
                  <div className="font-medium">{r.correct ? "正解" : "不正解"}</div>
                  {r.explanation && (
                    <p className="text-muted-foreground">
                      <InlineCode text={r.explanation} />
                    </p>
                  )}
                </div>
              </div>
            )}
          </fieldset>
        );
      })}
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={!allAnswered || pending}>
          {pending && <Loader2Icon className="animate-spin" />}
          答え合わせ
        </Button>
        {result && !result.passed && (
          <span className="text-sm text-muted-foreground">
            間違えた問題を見直して、もう一度答えてください。
          </span>
        )}
      </div>
    </div>
  );
}
