"use client";

import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { syncMyRepositories } from "@/app/(app)/courses/[language]/[level]/actions";
import { Button } from "@/components/ui/button";

export function SyncButton({ label = "GitHub の状態を読み直す" }: { label?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await syncMyRepositories();
          if (res.ok) toast.success(res.message);
          else toast.error(res.message);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <RefreshCwIcon />}
      {label}
    </Button>
  );
}
