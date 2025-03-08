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