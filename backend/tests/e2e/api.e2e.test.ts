import { assertEquals } from "https://deno.land/std@0.217.0/assert/mod.ts";

// APIのE2Eテスト
Deno.test("API: ヘルスチェックエンドポイントが正常に応答する", async () => {
  const baseUrl = Deno.env.get("API_URL") || "http://localhost:3000";
  
  try {
    const response = await fetch(`${baseUrl}/health`);
    assertEquals(response.status, 200);
    
    const data = await response.json();
    assertEquals(data.status, "ok");
  } catch (error) {
    console.error("API呼び出し中にエラーが発生しました:", error);
    throw error;
  }
});

// 存在しないエンドポイントへのリクエストをテスト
Deno.test("API: 存在しないエンドポイントは404を返す", async () => {
  const baseUrl = Deno.env.get("API_URL") || "http://localhost:3000";
  
  const response = await fetch(`${baseUrl}/non-existent-path`);
  assertEquals(response.status, 404);
}); 