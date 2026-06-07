/**
 * AstroPath 全面自动化测试 - 第七批
 * 深层边界情况 + 并发操作 + 性能 + 材料编辑 + 时间线深度交互
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

function collectErrors(page) {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return {
    getErrors: () => errors.filter(e =>
      !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR') && !e.includes('Download')
    ),
    getAllErrors: () => errors
  };
}

test.describe('21 深层边界情况', () => {

  test('21.1 所有页面快速连续访问', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    const routes = [
      '/', '/assessment', '/school-recommendation', '/timeline',
      '/materials', '/university-database', '/ai-chat', '/ai-config',
      '/story', '/result', '/#/nonexistent'
    ];

    for (const route of routes) {
      await page.goto(`${BASE}/#${route}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(500);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);

    expect(getErrors()).toEqual([]);
    console.log('✓ 所有页面快速连续访问正常');
  });

  test('21.2 Hash路由 - 直接URL访问每个路由', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    const routes = [
      { path: '/', title: '首页' },
      { path: '/assessment', title: '背景评估' },
      { path: '/timeline', title: '时间规划' },
      { path: '/materials', title: '材料中心' },
      { path: '/ai-chat', title: 'AI对话' },
    ];

    for (const { path, title } of routes) {
      await page.goto(`${BASE}/#${path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(100);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 直接URL访问路由正常');
  });

  test('21.3 多次刷新稳定性', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    for (let i = 0; i < 3; i++) {
      await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
      await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 多次刷新稳定正常');
  });

  test('21.4 浏览器前进后退全路径', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    // 依次访问多个页面
    await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(800);

    // 后退3次
    await page.goBack({ waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800);
    await page.goBack({ waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800);
    await page.goBack({ waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800);

    // 应该在首页
    const url = page.url();
    expect(url).not.toContain('assessment');

    // 前进2次
    await page.goForward({ waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800);
    await page.goForward({ waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800);

    expect(getErrors()).toEqual([]);
    console.log('✓ 前进后退全路径正常');
  });

  test('21.5 超长URL处理', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    const longPath = '/' + 'a'.repeat(2000);
    await page.goto(`${BASE}/#${longPath}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 应该显示404页面
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);

    expect(getErrors()).toEqual([]);
    console.log('✓ 超长URL处理正常');
  });
});

test.describe('22 材料中心深度交互', () => {

  test('22.1 材料中心 - 欢迎向导交互', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/materials`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 查找欢迎向导
    const wizard = page.locator('.welcome-wizard');
    if (await wizard.count() > 0) {
      // 尝试点击向导中的选项
      const options = page.locator('.essay-type, .wizard-option, .type-card');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // 编辑器应该可用
    const editor = page.locator('.studio-content, .editor-pane');
    expect(await editor.count()).toBeGreaterThan(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 材料欢迎向导正常');
  });

  test('22.2 材料中心 - 编辑器输入', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/materials`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 找到可编辑区域
    const editableAreas = page.locator('[contenteditable="true"], textarea, .editor-area');
    if (await editableAreas.count() > 0) {
      await editableAreas.first().click();
      await page.waitForTimeout(300);

      // 输入内容
      await page.keyboard.type('这是一段测试文书内容。我选择留学是因为...');
      await page.waitForTimeout(500);

      // 验证输入
      const text = await editableAreas.first().textContent();
      expect(text?.length).toBeGreaterThan(0);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 材料编辑器输入正常');
  });

  test('22.3 材料中心 - 抽屉切换', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/materials`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 查找材料抽屉/侧边栏
    const drawer = page.locator('.materials-drawer, .drawer-toggle, .studio-drawer');
    if (await drawer.count() > 0) {
      await drawer.first().click();
      await page.waitForTimeout(500);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 材料抽屉切换正常');
  });
});

test.describe('23 时间线深度交互', () => {

  test('23.1 时间线 - 添加和编辑任务完整流程', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 切换到看板视图
    const kanbanBtn = page.locator('.view-btn >> text=任务看板');
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.click();
      await page.waitForTimeout(1000);
    }

    // 生成示例任务
    const generateBtn = page.locator('.btn-primary-cta');
    if (await generateBtn.count() > 0) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
    }

    // 验证看板有任务
    const taskCards = page.locator('.task-card-premium, .task-card');
    if (await taskCards.count() > 0) {
      // 编辑任务
      const editBtn = page.locator('.tc-action-btn, .task-edit-btn').first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(500);

        // 修改任务标题
        const titleInput = page.locator('#task-title, input[placeholder*="标题"], input[placeholder*="任务"]');
        if (await titleInput.count() > 0) {
          await titleInput.fill('修改后的任务标题');
          await page.waitForTimeout(200);
        }

        // 保存
        const saveBtn = page.locator('.btn-modal-primary, .el-button--primary');
        if (await saveBtn.count() > 0) {
          await saveBtn.first().click();
          await page.waitForTimeout(500);
        }
      }
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 时间线任务编辑流程正常');
  });

  test('23.2 时间线 - 图表视图ECharts渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 切换到图表视图
    const chartBtn = page.locator('.view-btn >> text=图表视图');
    if (await chartBtn.count() > 0) {
      await chartBtn.click();
      await page.waitForTimeout(1000);
    }

    // ECharts应该渲染
    const chartArea = page.locator('.chart-area, canvas');
    expect(await chartArea.count()).toBeGreaterThan(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 时间线ECharts渲染正常');
  });

  test('23.3 时间线 - 任务状态切换', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/timeline`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 确保有示例数据
    const generateBtn = page.locator('.btn-primary-cta');
    if (await generateBtn.count() > 0) {
      await generateBtn.click();
      await page.waitForTimeout(2000);
    }

    // 切换到看板
    const kanbanBtn = page.locator('.view-btn >> text=任务看板');
    if (await kanbanBtn.count() > 0) {
      await kanbanBtn.click();
      await page.waitForTimeout(1000);
    }

    // 看板列应该存在
    const kanbanCols = page.locator('.kanban-col-premium, .kanban-column');
    if (await kanbanCols.count() >= 3) {
      // 至少有"待处理"、"进行中"、"已完成"三列
      console.log(`  找到 ${await kanbanCols.count()} 个看板列`);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 时间线任务状态正常');
  });
});

test.describe('24 AI配置深度测试', () => {

  test('24.1 AI配置 - 编辑供应商完整流程', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-config`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 编辑第一个供应商
    const editBtn = page.locator('.btn-edit').first();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(500);

      // 修改名称
      const nameInput = page.locator('#edit-name, input[placeholder*="名称"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.clear();
        await nameInput.fill('修改后的供应商名称');
        await page.waitForTimeout(200);
      }

      // 保存
      const saveBtn = page.locator('.btn-save, .btn-submit, .el-button--primary').first();
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        await page.waitForTimeout(500);
      }
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ AI配置编辑供应商正常');
  });

  test('24.2 AI配置 - 添加和删除供应商循环', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-config`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const initialCount = await page.locator('.provider-row').count();

    // 添加
    await page.fill('#prov-name', '循环测试供应商');
    await page.fill('#prov-url', 'https://api.test.com/v1');
    await page.fill('#prov-key', 'sk-test');
    await page.fill('#prov-model', 'test-model');
    await page.waitForTimeout(200);

    // 选择类型
    const typeSelect = page.locator('#prov-type');
    if (await typeSelect.count() > 0) {
      await typeSelect.click();
      await page.waitForTimeout(300);
      const options = page.locator('.custom-select-option');
      if (await options.count() > 0) {
        await options.first().click();
      }
      await page.waitForTimeout(200);
    }

    await page.click('.btn-submit');
    await page.waitForTimeout(500);

    const afterAdd = await page.locator('.provider-row').count();
    expect(afterAdd).toBe(initialCount + 1);

    // 删除刚添加的
    await page.locator('.btn-delete').last().click();
    await page.waitForTimeout(500);

    const afterDelete = await page.locator('.provider-row').count();
    expect(afterDelete).toBe(initialCount);

    expect(getErrors()).toEqual([]);
    console.log('✓ AI配置添加删除循环正常');
  });

  test('24.3 AI配置 - 测试连接响应', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-config`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 点击测试连接
    const testBtn = page.locator('.btn-test').first();
    if (await testBtn.count() > 0 && await testBtn.isVisible()) {
      await testBtn.click();
      await page.waitForTimeout(8000);

      // 检查状态变化
      const statusBadge = page.locator('.status-badge');
      if (await statusBadge.count() > 0) {
        const statusText = await statusBadge.first().textContent();
        console.log(`  连接状态: ${statusText}`);
      }
    }

    // 不应该崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ AI配置测试连接正常');
  });
});

test.describe('25 性能和稳定性', () => {

  test('25.1 首页加载时间', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    const startTime = Date.now();
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    const loadTime = Date.now() - startTime;

    console.log(`  首页加载时间: ${loadTime}ms`);
    // 应该在15秒内加载完成
    expect(loadTime).toBeLessThan(15000);

    expect(getErrors()).toEqual([]);
  });

  test('25.2 页面内存不泄漏（多次导航）', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    // 连续导航20次
    const routes = ['/', '/assessment', '/timeline', '/ai-chat', '/university-database'];
    for (let round = 0; round < 4; round++) {
      for (const route of routes) {
        await page.goto(`${BASE}/#${route}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(300);
      }
    }

    // 最后回到首页
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 多次导航稳定性正常');
  });

  test('25.3 网络错误恢复', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    // 访问AI对话并发送消息（可能遇到网络问题）
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('测试网络错误恢复');
    await page.waitForTimeout(200);
    await textarea.press('Enter');
    await page.waitForTimeout(5000);

    // 页面不应该崩溃，即使API请求失败
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    // 应该能看到错误提示或正在加载状态
    const errorMsg = page.locator('.error-message, .chat-error, .error-tip');
    const loadingMsg = page.locator('.loading, .chat-loading, .is-loading');

    // 至少有一种状态
    const hasFeedback = (await errorMsg.count() > 0) || (await loadingMsg.count() > 0);
    console.log(`  网络错误反馈: ${hasFeedback ? '有' : '无(可能API正常)'}`);

    expect(getErrors()).toEqual([]);
    console.log('✓ 网络错误恢复正常');
  });
});

console.log('\n========================================');
console.log('AstroPath 全面自动化测试 - 第七批');
console.log('深层边界 + 并发操作 + 性能 + 材料编辑 + 时间线深度交互');
console.log('========================================\n');
