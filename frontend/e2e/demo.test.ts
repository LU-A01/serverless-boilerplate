import { expect, test } from '@playwright/test';

// ホームページの基本テスト
test('ホームページが正しく表示される', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
	
	// タイトルにアプリ名が含まれているか確認
	const title = await page.title();
	expect(title).toContain('Serverless');
});

// ナビゲーションの動作テスト
test('ナビゲーションが正常に動作する', async ({ page }) => {
	// ホームページに移動
	await page.goto('/');
	
	// ナビゲーションリンクがあれば、それをクリック
	const navLinks = page.locator('nav a, button.nav-link');
	const count = await navLinks.count();
	
	if (count > 0) {
		// 最初のリンクをクリック
		await navLinks.first().click();
		
		// URLが変わったことを確認（具体的なURLがわからないので、単に「/」と違うことを確認）
		const url = page.url();
		// baseURLがない場合は、単に開始URLと異なることを確認
		const baseUrl = new URL(page.url()).origin;
		expect(url).not.toEqual(`${baseUrl}/`);
	} else {
		// ナビゲーションがない場合はテストをスキップ
		console.log('ナビゲーションリンクが見つかりませんでした。このテストはスキップします。');
		test.skip();
	}
});

// フォーム要素の存在確認（あれば）
test('フォーム要素が存在する場合、正しく表示される', async ({ page }) => {
	await page.goto('/');
	
	// フォームがあるかどうかを確認
	const hasForm = await page.locator('form').count() > 0;
	
	if (hasForm) {
		await expect(page.locator('form')).toBeVisible();
		// 入力フィールドとボタンの確認
		await expect(page.locator('input, button[type="submit"]')).toBeVisible();
	} else {
		// フォームがない場合はテストをスキップ
		console.log('フォームが見つかりませんでした。このテストはスキップします。');
		test.skip();
	}
});
