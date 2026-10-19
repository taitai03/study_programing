import { after } from "next/server";
import { type GhRepository, installationRequest } from "@/lib/github/app";
import { verifyWebhookSignature } from "@/lib/github/webhook-signature";
import {
  linkRepository,
  syncPullRequest,
  syncPullRequestsForCommit,
  syncRepositoryPullRequests,
  unlinkInstallation,
  unlinkRepository,
  updateRepositoryVisibility,
} from "@/lib/pull-requests";

/**
 * GitHub App の Webhook。
 * GitHub は10秒以内の応答を求めるので、署名を確認したらすぐに応答し、処理は after() で行う。
 * 処理は毎回 GitHub から最新の状態を読んで判定するので、同じイベントが重複して届いても問題ない
 */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook is not configured", { status: 503 });

  const body = await request.text();
  if (!verifyWebhookSignature(body, request.headers.get("x-hub-signature-256"), secret)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const event = request.headers.get("x-github-event") ?? "";
  const payload = JSON.parse(body) as WebhookPayload;
  after(() =>
    handleEvent(event, payload).catch((e) =>
      console.error(`Webhook の処理に失敗しました（${event}.${payload.action}）`, e),
    ),
  );
  return new Response("Accepted", { status: 202 });
}

type WebhookPayload = {
  action?: string;
  installation?: { id: number };
  repository?: GhRepository;
  repositories?: { full_name: string }[];
  repositories_added?: { full_name: string }[];
  repositories_removed?: { full_name: string }[];
  pull_request?: { number: number };
  workflow_run?: { head_sha: string };
  check_suite?: { head_sha: string };
};

async function handleEvent(event: string, p: WebhookPayload) {
  const installationId = p.installation?.id;

  switch (event) {
    case "installation":
      if (p.action === "deleted") {
        if (installationId) await unlinkInstallation(installationId);
      } else if (p.action === "created" && installationId) {
        await linkFullNames(p.repositories ?? [], installationId);
      }
      break;

    case "installation_repositories":
      if (!installationId) break;
      await linkFullNames(p.repositories_added ?? [], installationId);
      for (const r of p.repositories_removed ?? []) await unlinkRepository(r.full_name);
      break;

    case "repository":
      if (!p.repository) break;
      if (p.action === "deleted" || p.action === "transferred") {
        await unlinkRepository(p.repository.full_name);
      } else if (p.action === "privatized" || p.action === "publicized") {
        await updateRepositoryVisibility(p.repository.full_name, p.action === "privatized");
      }
      break;

    case "pull_request":
      if (p.repository && p.pull_request) {
        await syncPullRequest(p.repository.full_name, p.pull_request.number);
      }
      break;

    // テストのワークフローが終わったら、そのコミットのPRを判定し直す
    case "workflow_run":
    case "check_suite": {
      const sha = p.workflow_run?.head_sha ?? p.check_suite?.head_sha;
      if (p.action === "completed" && p.repository && sha) {
        await syncPullRequestsForCommit(p.repository.full_name, sha);
      }
      break;
    }
  }
}

/**
 * インストールのイベントにはリポジトリの持ち主や公開範囲が含まれないので、
 * インストールのトークンでリポジトリの情報を読んでから紐付ける
 */
async function linkFullNames(repos: { full_name: string }[], installationId: number) {
  for (const { full_name } of repos) {
    const repo = await installationRequest<GhRepository>(installationId, `/repos/${full_name}`);
    if (await linkRepository(repo, installationId)) await syncRepositoryPullRequests(full_name);
  }
}
