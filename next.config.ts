import type { NextConfig } from "next";

// ほぼ全ページがログイン必須で、リクエストごとに描画すればよいため Cache Components は使わない
const nextConfig: NextConfig = {
  // 教材（content/）は実行時にファイルから読むので、デプロイに含める
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
