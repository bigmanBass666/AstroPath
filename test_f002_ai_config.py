#!/usr/bin/env python3
"""
测试 F002: AI配置管理页面
"""

from playwright.sync_api import sync_playwright
import json
import time

def test_f002():
    print("=== 测试 F002: AI配置管理页面 ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        try:
            # 导航到AI配置页面
            print("\n1. 导航到AI配置页面...")
            page.goto("http://localhost:3011/#/ai-config", wait_until="domcontentloaded")
            page.wait_for_selector(".page-title", state="visible", timeout=10000)
            print(f"   当前URL: {page.url}")

            # 验证页面显示API配置表单
            print("\n2. 验证页面元素...")
            title = page.locator(".page-title, h2").first.text_content()
            assert "AI配置" in title, f"页面标题错误: {title}"
            print(f"   页面标题: {title}")

            # 检查关键表单字段存在
            assert page.locator("text=Base URL").first.is_visible(), "Base URL字段不存在"
            assert page.locator("text=API Key").first.is_visible(), "API Key字段不存在"
            assert page.locator("text=供应商名称").first.is_visible(), "供应商名称字段不存在"
            assert page.locator("text=保存配置").first.is_visible(), "保存配置按钮不存在"
            print("   表单字段正常显示")

            # 3. 填写测试配置
            print("\n3. 填写测试配置...")
            # 输入供应商名称
            page.locator("input[placeholder*='OpenAI']").first.fill("OpenAI Test")
            print("   供应商名称: OpenAI Test")

            # 输入Base URL
            page.locator("input[placeholder*='https://api.openai.com']").first.fill("https://api.openai.com/v1")
            print("   Base URL: https://api.openai.com/v1")

            # 输入API Key
            page.locator("input[type='password']").first.fill("sk-test123456789")
            print("   API Key: sk-test123456789")

            # 选择类型 - 点击下拉框并选择 OpenAI
            combobox = page.locator("combobox[aria-label='类型']").first
            combobox.click()
            # 等待下拉选项出现（等待其可见）
            page.wait_for_selector("text=OpenAI >> visible", timeout=5000)
            page.get_by_role('option', name='OpenAI').first.click()
            print("   Provider: OpenAI")

            # 输入模型名称
            page.locator("input[placeholder*='gpt']").first.fill("gpt-4")
            print("   Model: gpt-4")

            # 点击保存
            page.locator("button:has-text('保存配置')").first.click()
            page.wait_for_timeout(500)
            print("   配置已保存")

            # 验证表格中出现新配置
            page.wait_for_selector("text=OpenAI Test", state="visible", timeout=5000)
            print("   配置已添加到表格")

            # 4. 测试连接按钮
            print("\n4. 测试连接功能...")
            # 找到刚添加行的测试按钮
            table = page.locator("table").first
            row = table.locator("text=OpenAI Test").first
            row.locator("xpath=../../..").get_by_role('button', name='测试').first.click()
            print("   点击测试连接...")
            page.wait_for_timeout(2000)  # 等待测试完成

            # 检查状态是否更新为"已连接"
            row.locator("xpath=../../..").wait_for_selector("text=已连接", state="visible", timeout=5000)
            status_tag = row.locator("xpath=../../..").locator(".el-tag").first
            status_text = status_tag.text_content().strip()
            assert "已连接" in status_text, f"状态未更新: {status_text}"
            print(f"   连接状态: {status_text}")

            # 5. 验证localStorage持久化
            print("\n5. 验证持久化...")
            saved_data = page.evaluate("() => localStorage.getItem('ai_providers')")
            assert saved_data, "localStorage中未找到保存的数据"
            providers = json.loads(saved_data)
            assert len(providers) > 0, "保存的providers为空"
            assert any(p.get("name") == "OpenAI Test" for p in providers), "未找到保存的provider"
            print(f"   已保存 {len(providers)} 个provider配置")

            # 6. 导航到其他页面再返回
            print("\n6. 测试页面跳转后持久化...")
            # 通过菜单导航到首页
            page.get_by_role('menuitem', name='首页').first.click()
            page.wait_for_url("**/", timeout=5000)
            print("   已导航到首页")

            # 再返回AI配置页面
            page.get_by_role('menuitem', name='AI配置').first.click()
            page.wait_for_url("**/ai-config", timeout=5000)
            page.wait_for_selector("text=OpenAI Test", state="visible", timeout=5000)
            print("   返回AI配置页面")

            # 验证配置是否恢复
            restored_data = page.evaluate("() => JSON.parse(localStorage.getItem('ai_providers'))")
            assert len(restored_data) > 0, "返回后配置丢失"
            assert any(p.get("name") == "OpenAI Test" for p in restored_data), "配置未正确恢复"
            print(f"   返回后配置恢复: {len(restored_data)} 个provider")

            print("\n✅ F002 测试通过!")

        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            page.screenshot(path="/tmp/f002_fail.png")
            raise
        finally:
            time.sleep(1)
            browser.close()

if __name__ == "__main__":
    test_f002()
