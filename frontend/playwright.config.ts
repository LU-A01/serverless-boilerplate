import { defineConfig } from '@playwright/test';

// 環境変数からブラウザパスを取得
const chromePath = process.env.CHROME_PATH || '';

// Alpine Linuxで動作するようにカスタマイズされた設定
export default defineConfig({
	// テストファイルのパターン
	testDir: './tests/e2e',
	testMatch: '**/*.e2e.test.ts',
	
	// テスト実行時の設定
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [['html', { open: 'never' }]],
	
	// テスト実行のタイムアウト設定
	timeout: 30000,
	
	// 各テストの独立性を保証
	use: {
		// ベースURL
		baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
		
		// テスト実行のトレース保存
		trace: 'on-first-retry',
		
		// スクリーンショットを取得
		screenshot: 'only-on-failure',
	},
	
	// プロジェクト別設定（ブラウザごと）
	projects: [
		{
			name: 'chromium',
			use: {
				// Alpine Linuxの場合はシステムのChromiumを使用
				...(chromePath && {
					launchOptions: {
						executablePath: chromePath,
					},
				}),
			},
		},
	],
});
