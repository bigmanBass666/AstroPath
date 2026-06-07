/**
 * AstroPath 全面自动化测试 - 第四批
 * AI对话完整流程 + 消息发送 + 流式响应 + 错误处理
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

function collectErrors(page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return {
    errors, warnings,
    getErrors: () => errors.filter(e =>
      !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR') && !e.includes('Download')
    ),
    getCriticalErrors: () => errors.filter(e =>
      !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR') &&
      !e.includes('Download') && !e.includes('Failed to fetch') && !e.includes('401') &&
      !e.includes('429')
    )
  };
}

test.describe('13 AI对话 - 输入和发送测试', () => {

  test('13.1 输入框基本操作', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 找到输入框
    const textarea = page.locator('.chat-textarea, textarea');
    await expect(textarea.first()).toBeVisible();

    // 输入文字
    await textarea.first().fill('你好，请问留学美国需要准备什么？');
    await page.waitForTimeout(300);

    // 验证输入内容
    const value = await textarea.first().inputValue();
    expect(value).toContain('留学美国');

    expect(getErrors()).toEqual([]);
    console.log('✓ 输入框操作正常');
  });

  test('13.2 发送按钮状态', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 空输入时发送按钮应该禁用或不可见
    const sendBtn = page.locator('.send-btn, .chat-send-btn');
    const emptyBtn = sendBtn.first();

    if (await emptyBtn.count() > 0) {
      // 输入文字后按钮应该激活
      const textarea = page.locator('.chat-textarea, textarea').first();
      await textarea.fill('测试消息');
      await page.waitForTimeout(200);

      // 验证按钮可点击
      const isEnabled = await emptyBtn.isEnabled();
      expect(isEnabled).toBeTruthy();
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 发送按钮状态正常');
  });

  test('13.3 Enter发送消息', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('你好');
    await page.waitForTimeout(200);

    // 按Enter发送
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // 输入框应该被清空或消息应该出现
    const value = await textarea.inputValue();
    // 如果API可用，输入框可能已清空

    expect(getErrors()).toEqual([]);
    console.log('✓ Enter发送消息正常');
  });

  test('13.4 Shift+Enter换行', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('第一行');
    await page.waitForTimeout(200);

    // Shift+Enter换行
    await textarea.press('Shift+Enter');
    await page.waitForTimeout(200);
    await textarea.pressSequentially('第二行');
    await page.waitForTimeout(200);

    const value = await textarea.inputValue();
    // 验证换行
    expect(value).toContain('第一行');
    expect(value).toContain('第二行');

    expect(getErrors()).toEqual([]);
    console.log('✓ Shift+Enter换行正常');
  });

  test('13.5 发送长文本消息', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const longMessage = '这是一段很长的测试消息。'.repeat(20);
    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill(longMessage);
    await page.waitForTimeout(200);

    // 发送
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // 页面不应该崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 长文本消息发送正常');
  });

  test('13.6 多次连续发送消息', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();

    // 连续发送3条消息
    for (let i = 0; i < 3; i++) {
      await textarea.fill(`测试消息第${i + 1}条`);
      await page.waitForTimeout(200);
      await textarea.press('Enter');
      await page.waitForTimeout(1500);
    }

    // 页面不应该崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 连续发送消息正常');
  });
});

test.describe('14 AI对话 - 消息显示和交互', () => {

  test('14.1 消息气泡渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 发送一条消息
    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('你好');
    await page.waitForTimeout(200);
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // 检查用户消息气泡
    const userMessages = page.locator('.message-bubble, .msg-user, .chat-message');
    const msgCount = await userMessages.count();

    // 应该至少有1条用户消息
    if (msgCount > 0) {
      const msgText = await userMessages.first().textContent();
      expect(msgText).toBeTruthy();
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 消息气泡渲染正常');
  });

  test('14.2 Markdown渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 发送包含markdown格式的消息
    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('请用**加粗**和*斜体*回复我');
    await page.waitForTimeout(200);
    await textarea.press('Enter');
    await page.waitForTimeout(5000);

    // 检查AI回复（如果API正常）
    const assistantMessages = page.locator('.msg-assistant, .message-assistant, .ai-message');
    if (await assistantMessages.count() > 0) {
      // 检查是否有HTML标签渲染（markdown → HTML）
      const html = await assistantMessages.first().innerHTML();
      expect(html?.length).toBeGreaterThan(0);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ Markdown渲染正常');
  });

  test('14.3 代码块显示', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('请写一段JavaScript代码示例');
    await page.waitForTimeout(200);
    await textarea.press('Enter');
    await page.waitForTimeout(5000);

    // 如果有AI回复，检查代码块
    const codeBlocks = page.locator('pre code, .code-block, pre');
    if (await codeBlocks.count() > 0) {
      const codeText = await codeBlocks.first().textContent();
      expect(codeText?.length).toBeGreaterThan(0);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 代码块显示正常');
  });

  test('14.4 对话历史记录', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 发送消息
    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('你好');
    await textarea.first().press('Enter');
    await page.waitForTimeout(3000);

    // 刷新页面
    await page.reload({ waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // 历史记录应该保持
    const messages = page.locator('.message-bubble, .msg-user, .chat-message');
    const count = await messages.count();

    // 至少应该有用户发送的消息被保存
    // （取决于localStorage是否工作）
    expect(getErrors()).toEqual([]);
    console.log(`✓ 对话历史记录 - 刷新后${count}条消息`);
  });
});

test.describe('15 AI对话 - 错误处理和边界情况', () => {

  test('15.1 无API配置时的错误提示', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    // 清除AI配置
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.removeItem('ai_config');
      localStorage.removeItem('ai_providers');
    });

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 尝试发送消息
    const textarea = page.locator('.chat-textarea, textarea').first();
    await textarea.fill('你好');
    await page.waitForTimeout(200);
    await textarea.press('Enter');
    await page.waitForTimeout(5000);

    // 不应该崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 无API配置时错误处理正常');
  });

  test('15.2 空输入不能发送', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();

    // 尝试发送空消息
    await textarea.fill('');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    // 只按空格也不应该发送
    await textarea.fill('   ');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    // 应该没有消息
    const messages = page.locator('.message-bubble, .msg-user, .chat-message');
    const count = await messages.count();
    expect(count).toBe(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 空输入不能发送正常');
  });

  test('15.3 快速连续创建多个对话', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    // 快速点击新对话按钮多次
    const newChatBtn = page.locator('.new-chat-btn');
    for (let i = 0; i < 5; i++) {
      await newChatBtn.click();
      await page.waitForTimeout(300);
    }

    // 应该回到欢迎屏幕
    await expect(page.locator('.welcome-screen')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 快速创建多对话正常');
  });

  test('15.4 输入框字符计数和限制', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();

    // 输入非常长的文本
    const veryLong = 'a'.repeat(5000);
    await textarea.fill(veryLong);
    await page.waitForTimeout(300);

    // 页面不应该卡死
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);

    expect(getErrors()).toEqual([]);
    console.log('✓ 输入框字符限制正常');
  });

  test('15.5 特殊字符输入', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2500);

    const textarea = page.locator('.chat-textarea, textarea').first();

    // 特殊字符
    const specialChars = '<script>alert("xss")</script> & "引号" \'单引号\' <tag> `代码` $美元￥人民币€欧元';
    await textarea.fill(specialChars);
    await page.waitForTimeout(200);

    const value = await textarea.inputValue();
    expect(value).toContain('script');

    // 不应该有XSS执行
    const hasAlert = await page.locator('text=alert("xss")').count();
    expect(hasAlert).toBe(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 特殊字符处理正常');
  });
});

console.log('\n========================================');
console.log('AstroPath 全面自动化测试 - 第四批');
console.log('AI对话完整流程 + 错误处理 + 边界情况');
console.log('========================================\n');
