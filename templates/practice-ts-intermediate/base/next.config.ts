import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールなので、バンドルせずに Node.js から読み込む
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
