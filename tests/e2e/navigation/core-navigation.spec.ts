/**
 * AstroPath 全面自动化测试 - 第一批
 * 核心页面渲染 + 导航 + 路由 + 边界情况
 * 
 * 录屏配置: 1920x1080, deviceScaleFactor:2, video:'on'
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// 辅助函数：收集JS错误
function collectErrors(page) {
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  return { errors, warnings, getErrors: () => errors.filter(e =>
    !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR_FILE_NOT_FOUND')
  ), getCriticalErrors: () => errors.filter(e =>
    !e.includes('favicon') && !e.includes('sourcemap') && !e.includes('net::ERR') && !e.includes('Download')
  )};
}

test.describe('01 核心页面渲染测试', () => {

  test('1.1 首页加载并验证Hero动画', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    // 验证页面有实质内容
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(200);

    // 验证无JS错误
    expect(getErrors()).toEqual([]);

    // 验证Hero区域关键词
    await expect(page.locator('.hp-hero')).toBeVisible({ timeout: 5000 });

    // 验证标题元素
    const heroTitle = page.locator('.hp-hero__title');
    await expect(heroTitle).toBeVisible();
    const titleText = await heroTitle.textContent();
    expect(titleText).toContain('留学');

    // 验证CTA按钮
    const ctaBtn = page.locator('.hp-btn--primary');
    await expect(ctaBtn).toBeVisible();

    // 验证Manifesto区域
    await expect(page.locator('.hp-manifesto')).toBeVisible();

    // 验证Bento Grid卡片
    const bentoCards = page.locator('.hp-bento__card');
    expect(await bentoCards.count()).toBeGreaterThanOrEqual(6);

    // 验证底部CTA
    await expect(page.locator('.hp-invitation')).toBeVisible();

    // 验证页脚/返回顶部
    await expect(page.locator('.hp-back-to-top')).toBeAttached();

    console.log('✓ 首页渲染完全正常');
  });

  test('1.2 首页CTA按钮导航到评估页', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 点击CTA
    await page.click('.hp-btn--primary');
    await page.waitForURL('**/#/assessment', { timeout: 5000 });
    await page.waitForTimeout(1500);

    expect(getErrors()).toEqual([]);
    await expect(page.url()).toContain('/#/assessment');

    console.log('✓ CTA导航正常');
  });

  test('1.3 首页Bento卡片导航验证', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 测试点击Bento卡片导航
    const card = page.locator('.hp-bento__card').first();
    await card.click();
    await page.waitForTimeout(1000);

    // 验证URL变化或弹出新页面
    const url = page.url();
    expect(url).not.toBe(`${BASE}/`);

    // 返回首页
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    expect(getErrors()).toEqual([]);

    console.log('✓ Bento卡片导航正常');
  });

  test('1.4 404页面渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);

    await page.goto(`${BASE}/#/nonexistent-page-12345`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // NotFound应该渲染
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);

    expect(getErrors()).toEqual([]);
    console.log('✓ 404页面渲染正常');
  });

  test('1.5 导航栏 - 沉浸模式页面隐藏头部', async ({ page }) => {
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // AI Chat是沉浸式页面，header应该隐藏
    const header = page.locator('.app-header');
    const isImmersive = await page.locator('.app-container.is-immersive').count();
    expect(isImmersive).toBe(1);

    // 切换到非沉浸页面
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const isNotImmersive = await page.locator('.app-container.is-immersive').count();
    expect(isNotImmersive).toBe(0);

    console.log('✓ 沉浸模式切换正常');
  });

  test('1.6 导航栏 - 所有链接可点击', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);

    // 验证所有导航项可见
    const navItems = page.locator('.nav-item');
    expect(await navItems.count()).toBeGreaterThanOrEqual(6);

    // 依次点击每个导航项
    const navTexts = ['首页', '背景评估', '选校推荐', '时间规划', '材料中心', '院校数据库', 'AI对话'];
    for (const text of navTexts) {
      const item = page.locator(`.nav-item:has-text("${text}")`);
      if (await item.count() > 0) {
        await item.click();
        await page.waitForTimeout(800);
        // 验证页面有内容
        const bodyText = await page.textContent('body');
        expect(bodyText?.length).toBeGreaterThan(100);
      }
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 所有导航链接可点击');
  });

  test('1.7 移动端汉堡菜单', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    
    // 模拟移动端视口
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 汉堡按钮应该可见
    const hamburger = page.locator('.hamburger-btn');
    await expect(hamburger).toBeVisible();

    // 桌面导航应该隐藏
    const desktopNav = page.locator('.desktop-nav');
    const isVisible = await desktopNav.isVisible();
    expect(isVisible).toBeFalsy();

    // 打开移动菜单
    await hamburger.click();
    await page.waitForTimeout(500);

    const drawer = page.locator('.mobile-menu-drawer .el-drawer');
    await expect(drawer).toBeVisible();

    // 点击导航项
    const menuItem = page.locator('.mobile-menu-item').first();
    await menuItem.click();
    await page.waitForTimeout(800);

    expect(getErrors()).toEqual([]);
    
    // 恢复桌面视口
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('✓ 移动端菜单正常');
  });
});

test.describe('02 背景评估页面测试', () => {

  test('2.1 评估页面Hero场景渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Hero场景应该可见
    await expect(page.locator('.scene--hero')).toBeVisible();

    // 标题
    await expect(page.locator('.hero-title')).toBeVisible();
    const titleText = await page.locator('.hero-title').textContent();
    expect(titleText).toContain('背景评估');

    // 开始评估按钮
    await expect(page.locator('.btn-hero')).toBeVisible();

    // 指标
    await expect(page.locator('.hero-metrics')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 评估Hero场景正常');
  });

  test('2.2 场景切换到身份信息', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    // 点击"开始评估"
    await page.click('.btn-hero');
    await page.waitForTimeout(800);

    // 场景1应该激活
    await expect(page.locator('.scene--form').nth(0)).toBeVisible();
    await expect(page.locator('.scene-num')).toContainText('01');

    // 表单元素应该存在
    await expect(page.locator('.form-input').first()).toBeVisible();

    // GPA环形图
    await expect(page.locator('.gpa-ring')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 场景1身份信息正常');
  });

  test('2.3 填写基本信息', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 跳到场景1
    await page.click('.btn-hero');
    await page.waitForTimeout(800);

    // 填写姓名
    await page.fill('input[type="text"]', '测试用户');
    await page.waitForTimeout(300);

    // 选择院校类型
    const select = page.locator('.university-select');
    await select.click();
    await page.waitForTimeout(300);
    await page.locator('.el-select-dropdown__item').first().click();
    await page.waitForTimeout(300);

    // 验证GPA
    const gpaValue = await page.locator('.gpa-value').textContent();
    expect(gpaValue).toBeTruthy();

    // 调整GPA
    await page.click('.gpa-btn >> text=3.5');
    await page.waitForTimeout(200);

    expect(getErrors()).toEqual([]);
    console.log('✓ 基本信息填写正常');
  });

  test('2.4 GPA边界测试 - 最小值和最大值', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.click('.btn-hero');
    await page.waitForTimeout(800);

    // 点击GPA减号多次（GPA可能不会低于0）
    const minusBtn = page.locator('.num-btn').first();
    for (let i = 0; i < 5; i++) {
      await minusBtn.click();
      await page.waitForTimeout(100);
    }

    const gpaValue1 = await page.locator('.gpa-value').textContent();
    expect(gpaValue1).toBeTruthy();

    // 点击GPA加号多次
    const plusBtn = page.locator('.num-btn').last();
    for (let i = 0; i < 10; i++) {
      await plusBtn.click();
      await page.waitForTimeout(100);
    }

    const gpaValue2 = await page.locator('.gpa-value').textContent();
    expect(gpaValue2).toBeTruthy();

    expect(getErrors()).toEqual([]);
    console.log(`✓ GPA边界测试通过 (${gpaValue1} -> ${gpaValue2})`);
  });

  test('2.5 场景2学术信息 - 专业多选', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 连续导航到场景2
    await page.click('.btn-hero');
    await page.waitForTimeout(600);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(600);

    // 场景2应该激活
    await expect(page.locator('.scene-num')).toContainText('02');

    // 学历层次选择
    await page.click('.pill-btn >> text=硕士');
    await page.waitForTimeout(200);

    // 多选专业
    await page.click('.tag-btn >> text=理工');
    await page.waitForTimeout(100);
    await page.click('.tag-btn >> text=商科');
    await page.waitForTimeout(100);

    // 均分输入
    await page.fill('input[type="number"]', '85');
    await page.waitForTimeout(200);

    expect(getErrors()).toEqual([]);
    console.log('✓ 学术信息填写正常');
  });

  test('2.6 场景3经历管理 - 添加/删除实习', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 跳到场景3
    await page.click('.btn-hero');
    await page.waitForTimeout(500);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(500);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(600);

    // 场景3应该激活
    await expect(page.locator('.scene-num')).toContainText('03');

    // 切换标签页
    await page.click('.exp-tab >> text=实习');
    await page.waitForTimeout(300);

    // 点击"添加实习经历"
    await page.click('.btn-add-exp');
    await page.waitForTimeout(500);

    // 对话框应该出现
    await expect(page.locator('.experience-dialog')).toBeVisible();

    // 填写实习信息
    await page.fill('input[placeholder*="公司"]', '腾讯科技');
    await page.fill('input[placeholder*="职位"]', '前端开发实习生');
    await page.fill('input[placeholder*="时长"]', '3个月');
    await page.fill('textarea', '负责组件开发和性能优化');
    await page.waitForTimeout(200);

    // 点击添加
    await page.click('.btn-dialog-confirm');
    await page.waitForTimeout(500);

    // 验证实习记录出现
    const expItems = page.locator('.exp-item-compact');
    expect(await expItems.count()).toBeGreaterThanOrEqual(1);

    expect(getErrors()).toEqual([]);
    console.log('✓ 经历管理正常');
  });

  test('2.7 生成AI报告', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 快速跳到场景4
    await page.click('.btn-hero');
    await page.waitForTimeout(400);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(400);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(400);
    await page.click('.btn-nav--next');
    await page.waitForTimeout(600);

    // 场景4报告页
    await expect(page.locator('.scene--report')).toBeVisible();

    // 验证评分显示
    await expect(page.locator('.score-display')).toBeVisible();

    // 验证雷达图容器
    const radarChart = page.locator('.radar-chart');
    await expect(radarChart).toBeAttached();

    // 验证维度解析
    await expect(page.locator('.dim-list')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 报告页面渲染正常');
  });

  test('2.8 导航点切换场景', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/assessment`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);

    // 导航点应该有5个
    const navDots = page.locator('.nav-dot');
    expect(await navDots.count()).toBe(5);

    // 点击第3个导航点
    await navDots.nth(2).click();
    await page.waitForTimeout(600);
    await expect(page.locator('.scene-num')).toContainText('03');

    // 点击第5个导航点（报告页）
    await navDots.nth(4).click();
    await page.waitForTimeout(600);
    await expect(page.locator('.scene--report')).toBeVisible();

    // 返回第1个
    await navDots.first().click();
    await page.waitForTimeout(600);
    await expect(page.locator('.scene--hero')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 导航点切换正常');
  });
});

test.describe('03 AI对话页面测试', () => {

  test('3.1 AI Chat页面渲染', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    // 应该是沉浸模式
    await expect(page.locator('.ai-chat-page')).toBeVisible();

    // 侧栏
    await expect(page.locator('.sidebar')).toBeVisible();

    // 主聊天区域
    await expect(page.locator('.main-chat')).toBeVisible();

    // 输入区域
    await expect(page.locator('.chat-textarea')).toBeVisible();

    // 欢迎屏幕
    await expect(page.locator('.welcome-screen')).toBeVisible();

    // 欢迎标题
    const welcomeTitle = await page.locator('.welcome-title').textContent();
    expect(welcomeTitle).toContain('留学顾问');

    expect(getErrors()).toEqual([]);
    console.log('✓ AI Chat渲染正常');
  });

  test('3.2 多智能体切换', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const agents = ['留学顾问', '文书导师', '选校专家', '签证助手'];
    
    for (const agentName of agents) {
      const agentBtn = page.locator(`.agent-row:has-text("${agentName}")`);
      if (await agentBtn.count() > 0) {
        await agentBtn.click();
        await page.waitForTimeout(500);

        const welcomeTitle = await page.locator('.welcome-title').textContent();
        expect(welcomeTitle).toContain(agentName);
      }
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 多智能体切换正常');
  });

  test('3.3 侧栏折叠/展开', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 折叠
    await page.click('.sidebar-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('.sidebar.is-collapsed')).toBeVisible();

    // 展开
    await page.click('.sidebar-toggle');
    await page.waitForTimeout(300);
    const isCollapsed = await page.locator('.sidebar.is-collapsed').count();
    expect(isCollapsed).toBe(0);

    expect(getErrors()).toEqual([]);
    console.log('✓ 侧栏折叠正常');
  });

  test('3.4 快捷提示词点击', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const promptChips = page.locator('.prompt-chip');
    if (await promptChips.count() > 0) {
      await promptChips.first().click();
      await page.waitForTimeout(500);

      // 输入框应该被填充
      const inputText = await page.locator('.chat-textarea').inputValue();
      expect(inputText.length).toBeGreaterThan(0);
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 快捷提示词正常');
  });

  test('3.5 深度思考切换', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const thinkBtn = page.locator('.toolbar-btn >> text=深度思考');
    if (await thinkBtn.count() > 0) {
      await thinkBtn.click();
      await page.waitForTimeout(200);
      // 再次点击取消
      await thinkBtn.click();
    }

    expect(getErrors()).toEqual([]);
    console.log('✓ 深度思考切换正常');
  });

  test('3.6 新对话按钮', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.click('.new-chat-btn');
    await page.waitForTimeout(500);

    // 应该回到欢迎屏幕
    await expect(page.locator('.welcome-screen')).toBeVisible();

    expect(getErrors()).toEqual([]);
    console.log('✓ 新对话按钮正常');
  });

  test('3.7 返回按钮', async ({ page }) => {
    const { getErrors } = collectErrors(page);
    await page.goto(`${BASE}/#/ai-chat`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1500);

    await page.click('.header-back-btn');
    await page.waitForTimeout(800);

    // 应该离开AI Chat页面
    const isOnChat = page.url().includes('/ai-chat');
    expect(isOnChat).toBeFalsy();

    expect(getErrors()).toEqual([]);
    console.log('✓ 返回按钮正常');
  });
});

console.log('\n========================================');
console.log('AstroPath 全面自动化测试 - 第一批');
console.log('核心页面渲染 + 导航 + 路由 + 边界情况');
console.log('========================================\n');
