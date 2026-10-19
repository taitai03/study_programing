import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// Auth.js（スタッフのログイン）は、管理者がログインしている状態にしておく。
// ログインしていない場合を試すときは vi.mocked(auth).mockResolvedValueOnce(null as never) とする
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "1", name: "管理者 さくら", role: "admin" } })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// テストでは、テストごとにメモリ上の新しいDBを使う（src/test/db.ts）
process.env.DATABASE_URL = ":memory:";
process.env.AUTH_SECRET ??= "test-secret";

beforeEach(async () => {
  const { resetTestDb } = await import("./db");
  resetTestDb();
});

afterEach(() => {
  cleanup();
});
