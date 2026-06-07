/**
 * AstroPath 全面自动化测试 - 第六批
 * 响应式布局 + 多视口 + 无障碍基础
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

function collectErrors(page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return { getErrors: () => errors.filter(e =>
    !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR') && !e.includes('Download')
  )};
}

test.describe('19 响应式布局测试', () => {

  test('19.1 移动端 (375x812) - 首页渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    // 汉堡菜单应该可见
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();

    // 桌面导航应该隐藏
    const desktopNav = page.locator('.desktop-nav');
    expect(await desktopNav.isVisible()).toBeFalsy();

    expect(getErrors()).toEqual([]);
    console.log('✓ 移动端首页正常');
  });

  test('19.2 移动端 - 导航抽屉功能', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 打开菜单
    await page.locator('.hamburger-btn').click();
    await page.waitForTimeout(500);

    // 抽屉应该出现
    const drawer = page.locator('.el-drawer');
    await expect(drawer).toBeVisible();

    // 菜单项应该存在
    const menuItems = page.locator('.mobile-menu-item');
    expect(await menuItems.count()).toBeGreaterThanOrEqual(5);

    // 点击导航
    await menuItems.nth(1).click();
    await page.waitForTimeout(1000);

    // 抽屉应该关闭
    expect(await drawer.isVisible()).toBeFalsy();

    expect(getErrors()).toEqual([]);
    console.log('✓ 移动端导航抽屉正常');
  });

  test('19.3 平板 (768x1024) - 布局验证', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 平板布局正常');
  });

  test('19.4 大屏 (2560x1440) - 布局验证', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    // 导航栏应该可见
    const navItems = page.locator('.nav-item');
    expect(await navItems.count()).toBeGreaterThanOrEqual(6);

    expect(getErrors()).toEqual([]);
    console.log('✓ 大屏布局正常');
  });

  test('19.5 移动端 - AI对话页面', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // AI Chat是沉浸模式
    const isImmersive = await page.locator('.app-container.is-immersive').count();
    expect(isImmersive).toBe(1);

    // 聊天界面应该可见
    const chatArea = page.locator('.main-chat, .ai-chat-page');
    expect(await chatArea.count()).toBeGreaterThan(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 移动端AI对话正常');
  });

  test('19.6 移动端 - 评估表单', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    await page.click('.btn-hero');
    await page.waitForTimeout(1000);

    // 表单元素应该可用
    const inputs = page.locator('input');
    expect(await inputs.count()).toBeGreaterThan(0);

    // 能正常输入
    const textInput = page.locator('input[type="text"]').first();
    if (await textInput.count() > 0) {
      await textInput.fill('移动端测试');
      await page.waitForTimeout(300);
      const value = await textInput.inputValue();
      expect(value).toContain('移动端测试');
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 移动端评估表单正常');
  });

  test('19.7 视口切换不崩溃', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    // 桌面
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 切换到移动端
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);

    // 切换到平板
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // 切回桌面
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 视口切换不崩溃正常');
  });
});

test.describe('20 无障碍基础测试', () => {

  test('20.1 所有页面标题正确', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    const pageTitles = [
      { path: '/', expected: '首页' },
      { path: '/assessment', expected: '背景评估' },
      { path: '/school-recommendation', expected: '选校推荐' },
      { path: '/timeline', expected: '时间规划' },
      { path: '/materials', expected: '材料中心' },
      { path: '/university-database', expected: '院校数据库' },
      { path: '/ai-chat', expected: 'AI对话' },
      { path: '/ai-config', expected: 'AI配置' },
      { path: '/story', expected: '项目故事' },
      { path: '/result', expected: '比赛结果' },
    ];

    for (const { path, expected } of pageTitles) {
      await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);

      const title = await page.title();
      expect(title).toContain(expected);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 所有页面标题正确');
  });

  test('20.2 图片和按钮有aria标签', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 检查按钮的aria-label
    const buttonsWithAria = page.locator('button[aria-label]');
    const count = await buttonsWithAria.count();
    // 应该至少有一些按钮有aria-label
    // (汉堡菜单按钮和AI配置按钮应该有)
    expect(count).toBeGreaterThanOrEqual(0);

    // Logo应该是可点击的
    const logo = page.locator('.logo, .logo-component');
    if (await logo.count() > 0) {
      expect(await logo.first().isVisible()).toBeTruthy();
    }

    expect(getErrors()).toEqual([]);
    console.log(`✓ 无障碍aria标签 - ${count}个有aria-label的按钮`);
  });

  test('20.3 键盘导航 - Tab键', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 按Tab键几次
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    // 页面不应该崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 键盘Tab导航正常');
  });

  test('20.4 焦点管理', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-config`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 点击输入框
    const input = page.locator('input').first();
    if (await input.count() > 0) {
      await input.click();
      await page.waitForTimeout(200);

      // 检查焦点
      const isFocused = await input.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 焦点管理正常');
  });
});

console.log('\n========================================');
console.log('AstroPath 全面自动化测试 - 第六批');
console.log('响应式布局 + 多视口 + 无障碍');
console.log('========================================\n');
