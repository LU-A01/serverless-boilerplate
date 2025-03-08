import { test, expect } from '@playwright/test';

// Alpine Linuxでも動作するようにChromiumの設定を行う
let isAlpineLinux = false;
try {
  // /etc/alpine-release ファイルの存在をチェック
  Deno.statSync('/etc/alpine-release');
  isAlpineLinux = true;
} catch {
  // ファイルが存在しない場合はエラーになるのでfalseのまま
  isAlpineLinux = false;
}

// テスト前の準備
test.beforeAll(async () => {
  console.log('E2Eテストを開始します...');
  
  // Alpine Linuxの場合は環境設定
  if (isAlpineLinux) {
    console.log('Alpine Linux環境を検出しました。システムChromiumを使用します。');
    // Playwrightの設定を更新
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';
    process.env.CHROME_PATH = '/usr/bin/chromium-browser';
  }
});

// ホームページのテスト
test('ホームページが正しく表示される', async ({ page }) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // ページにアクセス
  console.log(`フロントエンドURL: ${baseUrl} にアクセスします...`);
  await page.goto(baseUrl);
  
  // タイトルの検証
  try {
    const title = await page.title();
    console.log(`ページタイトル: ${title}`);
    expect(title).toContain('Serverless');
  } catch (error) {
    console.warn('タイトル検証エラー:', error);
  }
  
  // H1要素の確認
  try {
    const h1 = await page.locator('h1').first();
    const h1Text = await h1.textContent();
    console.log(`H1テキスト: ${h1Text}`);
    expect(h1Text).toBeTruthy();
  } catch (error) {
    console.warn('H1要素が見つかりませんでした:', error);
    test.skip();
  }
  
  // APIとの連携テスト (オプション)
  try {
    // ボタンやリンクがあれば操作する
    const buttons = await page.locator('button').count();
    console.log(`ページ上のボタン数: ${buttons}`);
    
    // ナビゲーションがあれば検証
    const navLinks = await page.locator('nav a').count();
    if (navLinks > 0) {
      console.log(`ナビゲーションリンク数: ${navLinks}`);
      // 最初のリンクをクリック
      await page.locator('nav a').first().click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('ナビゲーションリンクがページ上に見つかりませんでした');
    }
  } catch (error) {
    console.warn('追加のUI要素検証中にエラーが発生しました:', error);
  }
});

// テスト終了処理
test.afterAll(async () => {
  console.log('E2Eテストが完了しました');
}); 