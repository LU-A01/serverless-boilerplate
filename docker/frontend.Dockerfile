# ベースステージ - 共通設定
FROM denoland/deno:alpine AS base
WORKDIR /app
ENV DENO_DIR=/app/.cache/deno
ENV DENO_INSTALL_ROOT=/usr/local
ENV DENO_NODE_COMPAT=1
ENV NODE_OPTIONS="--no-warnings"

# 依存関係ステージ - 依存関係のインストールのみを行う
FROM base AS deps
COPY frontend/package.json .
COPY frontend/svelte.config.js .
COPY frontend/vite.config.ts .

# npmモジュールのインストールディレクトリを準備
RUN mkdir -p /app/node_modules

# キャッシュの準備とnpm依存関係の事前ダウンロード
RUN deno cache --node-modules-dir npm:vite
# totalistを含む依存関係を事前インポート（実行ではなくインポート）
RUN echo 'import "npm:totalist@3.0.1"; console.log("Dependencies cached");' > /tmp/deps.js && deno run -A /tmp/deps.js

# 開発ステージ - 開発環境用の設定
FROM base AS dev
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/.cache /app/.cache
COPY frontend/package.json .
COPY frontend/svelte.config.js .
COPY frontend/vite.config.ts .
COPY frontend/src/ ./src/
COPY frontend/static/ ./static/
COPY shared/ ./shared/
EXPOSE 5173
CMD ["run", "-A", "--node-modules-dir", "npm:vite", "dev", "--host", "0.0.0.0"]