# ベースステージ
FROM denoland/deno:alpine AS base
WORKDIR /app
ENV DENO_DIR=/app/.cache/deno
ENV DENO_INSTALL_ROOT=/usr/local

# 依存関係ステージ
FROM base AS deps
COPY backend/deno.json backend/deno.lock* /app/
RUN deno cache --no-check --reload /app/deno.json

# 開発ステージ
FROM base AS dev
COPY --from=deps /app/.cache /app/.cache
COPY backend/deno.json backend/deno.lock* /app/
COPY backend/src/ /app/src/
COPY backend/main.ts /app/
COPY shared/ /app/shared/
EXPOSE ${PORT:-3000}
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]