"use client";

import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAllowedUser, changeRole, removeAllowedUser } from "./actions";

const ROLES = [
  { value: "learner", label: "受講者" },
  { value: "mentor", label: "メンター" },
  { value: "admin", label: "管理者" },
] as const;

export function AddUserForm() {
  const [state, action, pending] = useActionState(addAllowedUser, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.ok);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="githubLogin">GitHubユーザー名</Label>
          <Input id="githubLogin" name="githubLogin" placeholder="例: taitai03" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">権限</Label>
          <Select name="role" defaultValue="learner">
            <SelectTrigger id="role" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          登録
        </Button>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function UserRowActions({
  githubLogin,
  role,
  isSelf,
  part,
}: {
  githubLogin: string;
  role: string;
  isSelf: boolean;
  part: "role" | "remove";
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const run = (fn: () => Promise<void>, done: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(done);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "失敗しました");
      }
    });

  if (part === "role") {
    return (
      <Select
        value={role}
        disabled={isSelf || pending}
        onValueChange={(v) => run(() => changeRole(githubLogin, v), "権限を変更しました")}
      >
        <SelectTrigger className="h-8 w-28" aria-label={`${githubLogin}の権限`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (isSelf) return null;
  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${githubLogin}を削除`}
        onClick={() => setConfirming(true)}
      >
        <Trash2Icon />
      </Button>
    );
  }
  return (
    <div className="flex gap-1">
      <Button
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => run(() => removeAllowedUser(githubLogin), `${githubLogin} を削除しました`)}
      >
        削除する
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        やめる
      </Button>
    </div>
  );
}
