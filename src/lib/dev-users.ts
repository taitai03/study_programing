/** 開発用ログインで使うユーザー。パスワードは .env.local の DEV_LOGIN_PASSWORD */
export const DEV_USERS = {
  learner: {
    email: "dev-learner@example.com",
    name: "開発用 受講者",
    githubLogin: "dev-learner",
    role: "learner",
  },
  admin: {
    email: "dev-admin@example.com",
    name: "開発用 管理者",
    githubLogin: "dev-admin",
    role: "admin",
  },
} as const;

export type DevUserKey = keyof typeof DEV_USERS;
