import { defineConfig, devices } from '@playwright/test';

// 環境変数用のヘルパー関数
const isCI = !!Deno.env.get('CI');
const baseURL = Deno.env.get('PLAYWRIGHT_BASE_URL') || 'http://localhost:5173';
const chromePath = Deno.env.get('CHROME_PATH');

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		reuseExistingServer: true,
	},

	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 1 : undefined,
	reporter: [['html', { open: 'never' }]],
	use: {
		baseURL: baseURL,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { 
				...devices['Desktop Chrome'],
				// Alpine Linuxでのシステムブラウザの使用を考慮
				launchOptions: chromePath ? {
					executablePath: chromePath
				} : undefined
			},
		}
	],
});
