import "server-only";
import { createSign } from "node:crypto";

/**
 * GitHub App として GitHub API を呼ぶ。
 * 受講者の課題リポジトリにインストールされた App の権限（インストールトークン）で、
 * PR、差分、テストの結果を読み、PRにコメントを書く
 */

const API_URL = process.env.GITHUB_API_URL ?? "https://api.github.com";

export function githubAppConfigured() {
  return Boolean(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY);
}

/** App のインストールページ。受講者はここから自分の課題リポジトリにインストールする */
export function githubAppInstallUrl() {
  const slug = process.env.GITHUB_APP_SLUG;
  return slug ? `https://github.com/apps/${slug}/installations/new` : null;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

/** App 自身として認証するための JWT（有効期限10分） */
function createAppJwt() {
  const appId = process.env.GITHUB_APP_ID;
  // 環境変数では改行を \n と書けるようにする
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!appId || !privateKey) throw new Error("GITHUB_APP_ID と GITHUB_APP_PRIVATE_KEY を設定してください");

  const now = Math.floor(Date.now() / 1000);
  // GitHub との時計のずれを考えて、発行時刻を少し前にする
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey);
  return `${header}.${payload}.${base64url(signature)}`;
}

export class GitHubApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "study-programing",
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GitHubApiError(res.status, `GitHub API ${init.method ?? "GET"} ${path}: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** インストールトークンは1時間有効。期限の5分前までは使い回す */
const tokenCache = new Map<number, { token: string; expiresAt: number }>();

async function installationToken(installationId: number) {
  const cached = tokenCache.get(installationId);
  if (cached && cached.expiresAt - Date.now() > 5 * 60_000) return cached.token;

  const res = await request<{ token: string; expires_at: string }>(
    createAppJwt(),
    `/app/installations/${installationId}/access_tokens`,
    { method: "POST" },
  );
  tokenCache.set(installationId, { token: res.token, expiresAt: Date.parse(res.expires_at) });
  return res.token;
}

/** App 自身として呼ぶ（インストールの検索など） */
export function appRequest<T>(path: string, init?: RequestInit) {
  return request<T>(createAppJwt(), path, init);
}

/** インストール先のリポジトリに対して呼ぶ */
export async function installationRequest<T>(
  installationId: number,
  path: string,
  init?: RequestInit,
) {
  return request<T>(await installationToken(installationId), path, init);
}

/** 一覧を返すAPIを、すべてのページを読んで返す（1ページ100件、最大10ページ） */
export async function installationRequestAll<T>(
  installationId: number,
  path: string,
  pick: (page: unknown) => T[] = (page) => page as T[],
) {
  const items: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= 10; page++) {
    const batch = pick(await installationRequest(installationId, `${path}${sep}per_page=100&page=${page}`));
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

// ---------------------------------------------------------------------------
// 使う API のレスポンスの型（必要な項目だけ）
// ---------------------------------------------------------------------------

export type GhRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string };
};

export type GhPullRequest = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  merged: boolean;
  merged_at: string | null;
  user: { login: string };
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
};

export type GhPullRequestFile = {
  filename: string;
  previous_filename?: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
};

export type GhCheckRun = {
  name: string;
  status: "queued" | "in_progress" | "completed" | string;
  conclusion: string | null;
  html_url: string;
};
