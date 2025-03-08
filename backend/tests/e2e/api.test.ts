// バックエンドAPIのE2Eテスト
import { assertEquals, assertExists } from "https://deno.land/std@0.217.0/assert/mod.ts";

// テスト用のAPIベースURL（CI環境での設定を考慮）
const API_BASE_URL = Deno.env.get("API_URL") || "http://localhost:3000";

// ヘルスチェックエンドポイントのテスト
Deno.test("API: ヘルスチェックエンドポイントが正常に応答する", async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertEquals(data.status, "ok");
});

// ルートエンドポイントのテスト
Deno.test("API: ルートエンドポイントが正常に応答する", async () => {
  const response = await fetch(API_BASE_URL);
  assertEquals(response.status, 200);
  
  const text = await response.text();
  assertExists(text);
});

// 存在しないエンドポイントのテスト
Deno.test("API: 存在しないエンドポイントに404を返す", async () => {
  const response = await fetch(`${API_BASE_URL}/not-existing-endpoint-${Date.now()}`);
  assertEquals(response.status, 404);
});

// API接続の耐久性テスト（オプション）
Deno.test("API: 複数リクエストが正常に処理される", async () => {
  const requests = Array(5).fill(null).map(() => fetch(`${API_BASE_URL}/health`));
  const responses = await Promise.all(requests);
  
  // すべてのレスポンスが成功していることを確認
  for (const response of responses) {
    assertEquals(response.status, 200);
    const data = await response.json();
    assertEquals(data.status, "ok");
  }
}); 