-- データベース作成
CREATE DATABASE app_db;

-- アプリケーション用ユーザー作成
CREATE USER app_user WITH ENCRYPTED PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;

-- アプリケーションDBに接続
\c app_db

-- スキーマ作成
CREATE SCHEMA IF NOT EXISTS app_schema;

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- アプリケーションユーザーに権限付与
GRANT ALL ON SCHEMA app_schema TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_schema GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_schema GRANT ALL ON SEQUENCES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_schema GRANT ALL ON FUNCTIONS TO app_user;

-- サンプルテーブル作成
CREATE TABLE IF NOT EXISTS app_schema.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 開発用サンプルデータ
INSERT INTO app_schema.users (name, email, password_hash)
VALUES 
('テストユーザー', 'test@example.com', crypt('password123', gen_salt('bf'))),
('管理者', 'admin@example.com', crypt('admin123', gen_salt('bf')));

-- コメント
COMMENT ON TABLE app_schema.users IS 'アプリケーションユーザー';
COMMENT ON COLUMN app_schema.users.id IS 'ユーザーID';
COMMENT ON COLUMN app_schema.users.name IS 'ユーザー名';
COMMENT ON COLUMN app_schema.users.email IS 'メールアドレス';
COMMENT ON COLUMN app_schema.users.password_hash IS 'パスワードハッシュ';
COMMENT ON COLUMN app_schema.users.created_at IS '作成日時';
COMMENT ON COLUMN app_schema.users.updated_at IS '更新日時'; 