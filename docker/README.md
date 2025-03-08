# Docker環境設定ガイド

このディレクトリには、開発環境と本番環境で使用するDocker関連のファイルが含まれています。各Dockerfileと設定は、マルチステージビルドとキャッシュ最適化を活用して、効率的な開発環境を提供します。

## 構成概要

```
docker/
├── backend.Dockerfile  # バックエンド用Dockerfile（Deno）
├── frontend.Dockerfile # フロントエンド用Dockerfile（Deno + npm）
├── db.Dockerfile       # PostgreSQL用Dockerfile
├── init-db.sql         # データベース初期化スクリプト
└── README.md           # このファイル
```

## Docker Compose構成

プロジェクトルートの`docker-compose.yml`によって、以下のサービスが定義されています：

- **backend**: Denoによるバックエンドサービス（Hono.js）
- **frontend**: Denoによるフロントエンドサービス（SvelteKit）
- **db**: PostgreSQLデータベース
- **pgadmin**: データベース管理UI（オプション）

## Denoを使用する利点

本プロジェクトではバックエンドとフロントエンドの両方でDenoを採用しています：

- **セキュリティ**: 明示的な権限付与システムにより安全性が向上
- **組み込みのツール**: フォーマッタ、リンターが組み込まれており追加設定不要
- **TypeScript組み込み**: コンパイル不要でTypeScriptをネイティブ実行
- **単一ランタイム**: フロントエンドとバックエンドで同じランタイムを使用
- **npm互換性**: 既存のnpmパッケージを使用可能（フロントエンド用）

## 各Dockerfileの説明

### backend.Dockerfile

バックエンドはDenoで実装され、マルチステージビルドを使用してキャッシュ最適化を行っています：

1. **base**: 基本設定を含むベースイメージ
   ```dockerfile
   FROM denoland/deno:alpine AS base
   WORKDIR /app
   ENV DENO_DIR=/app/.cache/deno
   ENV DENO_INSTALL_ROOT=/usr/local
   ```

2. **deps**: 依存関係のダウンロードとキャッシュを行うステージ
   ```dockerfile
   FROM base AS deps
   COPY backend/deno.json backend/deno.lock* /app/
   RUN deno cache --no-check --reload /app/deno.json
   ```

3. **dev**: 開発用の環境
   ```dockerfile
   FROM base AS dev
   COPY --from=deps /app/.cache /app/.cache
   COPY backend/deno.json backend/deno.lock* /app/
   COPY backend/src/ /app/src/
   COPY backend/main.ts /app/
   COPY shared/ /app/shared/
   EXPOSE ${PORT:-3000}
   CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "main.ts"]
   ```

最適化ポイント：
- 依存関係のキャッシュを別レイヤーで行いビルド時間を短縮
- `--no-check`オプションでタイプチェックをスキップし初期ビルドを高速化
- ボリュームマウントによる開発時のホットリロード対応
- 最小権限原則に基づく実行権限の設定（--allow-netなど）

### frontend.Dockerfile

フロントエンドもDenoを使用していますが、npm互換モードでSvelteKitを利用しています：

1. **base**: 基本設定を含むベースイメージ
   ```dockerfile
   FROM denoland/deno:alpine AS base
   WORKDIR /app
   ENV DENO_DIR=/app/.cache/deno
   ENV DENO_INSTALL_ROOT=/usr/local
   ENV DENO_NODE_COMPAT=1
   ```

2. **deps**: npm依存関係のダウンロードとキャッシュを行うステージ
   ```dockerfile
   FROM base AS deps
   COPY frontend/package.json .
   COPY frontend/svelte.config.js .
   COPY frontend/vite.config.ts .
   RUN mkdir -p /app/node_modules
   RUN deno cache --node-modules-dir npm:vite
   RUN echo 'import "npm:totalist@3.0.1"; console.log("Dependencies cached");' > /tmp/deps.js && deno run -A /tmp/deps.js
   ```

3. **dev**: 開発用の環境
   ```dockerfile
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
   ```

最適化ポイント：
- Denoのnpm互換モードを活用（`DENO_NODE_COMPAT=1`）
- npmパッケージの事前キャッシュによるビルド時間短縮
- `totalist`など特定パッケージの依存関係解決を改善
- ホスト「0.0.0.0」でViteサーバーを起動しDocker外からのアクセスを可能に

### db.Dockerfile

PostgreSQLの公式イメージをベースに、初期化スクリプトを追加しています：

```dockerfile
FROM postgres:14-alpine

# タイムゾーンを設定
ENV TZ=Asia/Tokyo

# 初期化スクリプトをコピー
COPY init-db.sql /docker-entrypoint-initdb.d/init-db.sql

# 適切なパーミッションを設定
RUN chmod 0755 /docker-entrypoint-initdb.d/init-db.sql

# データ永続化のためのボリュームを設定
VOLUME /var/lib/postgresql/data

# PostgreSQLのデフォルトポート
EXPOSE 5432 
```

最適化ポイント：
- タイムゾーンを日本時間（Asia/Tokyo）に設定
- 初期化スクリプトによるDBスキーマと初期データの自動作成
- 適切なパーミッション設定による安定稼働
- 公式のAlpineベースイメージによるサイズ最適化

## データベース構造

`init-db.sql`によって、以下のデータベース構造が自動的に作成されます：

- **データベース名**: app_db
- **アプリケーションユーザー**: app_user (パスワード: app_password)
- **スキーマ**: app_schema
- **拡張機能**: uuid-ossp, pgcrypto（UUIDやパスワード暗号化用）

### 主要テーブル

1. **users**テーブル：アプリケーションユーザー情報
   - id: UUID (主キー)
   - name: ユーザー名
   - email: メールアドレス（一意）
   - password_hash: パスワードハッシュ値
   - created_at: 作成日時
   - updated_at: 更新日時

### 開発用サンプルデータ

初回起動時に以下のサンプルユーザーが自動的に作成されます：
- テストユーザー: test@example.com / password123
- 管理者: admin@example.com / admin123

## ボリューム管理

永続データと開発効率向上のために以下のボリュームを使用しています：

- **pg-data**: データベースファイルの永続化
  ```yaml
  volumes:
    pg-data:
      name: app-pg-data
  ```

- **pgadmin-data**: pgAdmin設定の永続化
  ```yaml
  volumes:
    pgadmin-data:
      name: app-pgadmin-data
  ```

- **backend-deno-cache**: バックエンドDenoキャッシュの共有
  ```yaml
  volumes:
    backend-deno-cache:
      name: app-backend-deno-cache
  ```

- **frontend-deno-cache**: フロントエンドDenoキャッシュの共有
  ```yaml
  volumes:
    frontend-deno-cache:
      name: app-frontend-deno-cache
  ```

## 環境変数

`.env`ファイルで以下の設定をカスタマイズできます：

- **DB_USER**, **DB_PASSWORD**, **DB_NAME**: データベース接続情報
- **BACKEND_PORT**, **FRONTEND_PORT**, **DB_PORT**: 各サービスのポート設定
- **JWT_SECRET**: 認証用シークレットキー
- **LOG_LEVEL**: ログ詳細度

デフォルト値の例：
```
BACKEND_PORT=3001
FRONTEND_PORT=5173
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=app_db
JWT_SECRET=dev-secret-key
LOG_LEVEL=info
```

## 開発環境での利用方法

### 環境の起動

```bash
# 全サービスを起動
docker-compose up -d

# 特定のサービスのみ起動
docker-compose up -d backend frontend
```

### ログの確認

```bash
# すべてのサービスのログを表示
docker-compose logs -f

# 特定のサービスのログのみ表示
docker-compose logs -f backend
```

### 環境の再構築

```bash
# キャッシュなしでイメージを再構築
docker-compose build --no-cache

# 特定のサービスのみ再構築
docker-compose build frontend
```

### 環境の停止

```bash
# コンテナを停止するが削除はしない
docker-compose stop

# コンテナとネットワークを停止・削除
docker-compose down

# コンテナ、ネットワーク、イメージ、ボリュームをすべて削除
docker-compose down --rmi all --volumes
```

## トラブルシューティング

### データベース関連の問題

#### 初期化スクリプトの問題

データベースが初期化されない場合：

```bash
# DBコンテナのログを確認
docker logs app-db

# 手動でSQLを実行して問題箇所を特定
docker exec -it app-db psql -U postgres -f /docker-entrypoint-initdb.d/init-db.sql
```

#### ヘルスチェック失敗

データベースのヘルスチェックが失敗する場合：

```bash
# ヘルスチェックの状態を確認
docker inspect app-db | grep -A 10 Health

# ヘルスチェックの待機時間を延長する（docker-compose.yml内）
healthcheck:
  start_period: 60s  # 30秒→60秒に延長
```

### Windows環境でのパス長制限問題

Windows環境では、パスの長さに260文字の制限があり、特に`node_modules`ディレクトリで問題が発生することがあります。

**対策**:
- `.dockerignore`ファイルで不要なファイルをビルドコンテキストから除外
- マルチステージビルドでパス長の問題を回避
- Docker Desktop WSL2バックエンドを使用

### コンテナが起動しない場合

コンテナが起動しない場合は以下を確認してください：

```bash
# コンテナの詳細なログを確認
docker logs app-backend
docker logs app-frontend
docker logs app-db

# コンテナの状態を確認
docker ps -a

# 依存関係の問題を確認
docker-compose config
```

### ポート競合の解決

すでに使用されているポートがある場合は、`.env`ファイルで別のポートを指定できます：

```
BACKEND_PORT=3001
FRONTEND_PORT=5174
DB_PORT=5433
```

使用中のポートを確認するには：

```bash
# Windowsの場合
netstat -ano | findstr "3000 5432 5173"

# Linuxの場合
netstat -tulpn | grep -E "3000|5432|5173"
```

## CI/CD対応

GitHub Actionsなどでの自動ビルド・デプロイに対応しています。デプロイ時には：
- `--no-deps`オプションでバックエンドのみをデプロイ
- `--prod`フラグで本番用ビルドを生成
- 環境変数をシークレットとして安全に管理

詳細は`.github/workflows/ci.yml`を参照してください。 