<template>
  <div class="materials-page">
    <h2 class="page-title">申请材料中心</h2>

    <!-- 选项卡 -->
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="文书助手" name="essay">
        <div class="essay-editor">
          <div class="editor-toolbar">
            <el-select v-model="currentEssayType" placeholder="选择文书类型" style="width: 200px;">
              <el-option label="个人陈述" value="ps" />
              <el-option label="简历" value="cv" />
              <el-option label="推荐信" value="reference" />
              <el-option label="研究计划" value="research" />
            </el-select>
            <el-select v-model="selectedProvider" placeholder="选择AI提供商" style="width: 150px;">
              <el-option v-for="p in providers" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-button-group>
              <el-button size="small" @click="formatDoc('bold')">加粗</el-button>
              <el-button size="small" @click="formatDoc('italic')">斜体</el-button>
              <el-button size="small" @click="formatDoc('h2')">标题</el-button>
              <el-button size="small" @click="formatDoc('list')">列表</el-button>
            </el-button-group>
            <el-button size="small" type="primary" @click="saveVersion">保存版本</el-button>
            <el-button size="small" @click="showVersions">历史版本</el-button>
            <el-button size="small" type="success" @click="exportPDF">导出PDF</el-button>
          </div>

          <!-- AI辅助区域 -->
          <div class="ai-assistant">
            <div class="ai-input-row">
              <el-input
                v-model="aiPrompt"
                type="textarea"
                :rows="2"
                placeholder="输入AI指令，如：帮我扩写第一段，突出科研经历"
                :disabled="isGenerating"
              />
              <el-button
                type="primary"
                @click="generateWithAI"
                :loading="isGenerating"
                style="margin-left: 10px;"
              >
                {{ isGenerating ? '生成中...' : 'AI生成' }}
              </el-button>
            </div>
          </div>

          <div class="editor-content">
            <textarea v-model="essayContent" placeholder="在此编辑文书内容，可以使用AI生成辅助..."></textarea>
          </div>
          <div class="word-count">
            字数统计: {{ essayContent.length }} | 预计阅读时间: {{ Math.ceil(essayContent.length / 400) }}分钟
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="材料清单" name="checklist">
        <div class="checklist-page">
          <el-card class="progress-card">
            <div class="progress-header">
              <h3>材料准备进度</h3>
              <el-progress :percentage="completionRate" :color="progressColor" />
            </div>
          </el-card>

          <el-card class="checklist-card">
            <div class="checklist-actions">
              <el-button type="primary" @click="exportCSV">导出清单</el-button>
              <el-button @click="generateReport">生成检查报告</el-button>
              <el-button @click="resetChecklist">重置</el-button>
            </div>

            <el-collapse v-model="activeCategory">
              <el-collapse-item v-for="category in categories" :key="category.id"
                :name="category.id" :title="category.name">
                <el-table :data="getCategoryItems(category.id)" style="width: 100%">
                  <el-table-column width="60">
                    <template #default="{ row }">
                      <el-checkbox v-model="row.completed" @change="updateProgress" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="材料名称" />
                  <el-table-column prop="note" label="备注" />
                  <el-table-column label="操作" width="100">
                    <template #default="{ row, $index }">
                      <el-button size="small" type="text" @click="editItem(category.id, $index)">编辑</el-button>
                      <el-button size="small" type="text" @click="removeItem(category.id, $index)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-collapse-item>
            </el-collapse>
          </el-card>

          <el-button class="add-custom-btn" type="primary" plain @click="addCustomItem">
            <el-icon><Plus /></el-icon>
            添加自定义材料
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加自定义材料对话框 -->
    <el-dialog v-model="itemDialogVisible" title="添加自定义材料" width="400px">
      <el-form :model="newItem" label-width="80px">
        <el-form-item label="材料名称">
          <el-input v-model="newItem.name" placeholder="如：作品集" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="newItem.note" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddItem">添加</el-button>
      </template>
    </el-dialog>

    <!-- 历史版本对话框 -->
    <el-dialog v-model="versionsVisible" title="文书历史版本" width="600px">
      <el-table :data="versions" style="width: 100%">
        <el-table-column prop="date" label="保存时间" width="180" />
        <el-table-column prop="note" label="版本备注" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="previewVersion(row)">预览</el-button>
            <el-button size="small" type="success" text @click="restoreVersion(row)">恢复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getProviders, sendMessageToAI } from '@/utils/ai-api'

const activeTab = ref('essay')
const currentEssayType = ref('ps')
const essayContent = ref('')
const itemDialogVisible = ref(false)
const versionsVisible = ref(false)
const activeCategory = ref(['required'])
const selectedProvider = ref(null)
const aiPrompt = ref('')
const isGenerating = ref(false)

const newItem = reactive({
  name: '',
  note: '',
  category: 'required'
})

// 加载AI提供商
const providers = computed(() => {
  const saved = localStorage.getItem('ai_providers')
  return saved ? JSON.parse(saved) : []
})

// 初始化默认provider
onMounted(() => {
  const saved = localStorage.getItem('ai_providers')
  if (saved) {
    const parsed = JSON.parse(saved)
    if (parsed.length > 0) {
      selectedProvider.value = parsed[0].id
    }
  }
})

const categories = ref([
  { id: 'required', name: '必需材料' },
  { id: 'recommended', name: '推荐材料' },
  { id: 'optional', name: '可选材料' }
])

const allItems = ref({
  required: [
    { name: '本科成绩单（中英文）', completed: false, note: '' },
    { name: '学位证明（中英文）', completed: false, note: '' },
    { name: '语言成绩单', completed: false, note: '雅思/托福成绩' },
    { name: '个人陈述(PS)', completed: false, note: '' },
    { name: '简历(CV)', completed: false, note: '' },
    { name: '推荐信(2-3封)', completed: false, note: '' }
  ],
  recommended: [
    { name: '研究计划(RP)', completed: false, note: '申请研究型学位需要' },
    { name: '作品集', completed: false, note: '设计/建筑/艺术类' },
    { name: 'Writing Sample', completed: false, note: '人文社科类' },
    { name: 'GRE/GMAT成绩', completed: false, note: '部分学校要求' }
  ],
  optional: [
    { name: '竞赛获奖证书', completed: false, note: '' },
    { name: '实习证明', completed: false, note: '' },
    { name: '志愿者服务证明', completed: false, note: '' },
    { name: '专利/论文发表', completed: false, note: '' }
  ]
})

const versions = ref([
  { date: '2025-01-10 14:30', note: '初稿', content: '' },
  { date: '2025-01-12 10:20', note: '修改版', content: '' }
])

const completionRate = computed(() => {
  const all = Object.values(allItems.value).flat()
  const completed = all.filter(i => i.completed).length
  return Math.round((completed / all.length) * 100)
})

const progressColor = computed(() => {
  const rate = completionRate.value
  if (rate >= 80) return '#67c23a'
  if (rate >= 50) return '#e6a23c'
  return '#f56c6c'
})

const getCategoryItems = (catId) => {
  return allItems.value[catId] || []
}

const updateProgress = () => {
  console.log('Progress updated:', completionRate.value)
}

const addCustomItem = () => {
  newItem.category = activeCategory.value[0] || 'required'
  itemDialogVisible.value = true
}

const confirmAddItem = () => {
  if (!newItem.name) {
    ElMessage.warning('请输入材料名称')
    return
  }
  allItems.value[newItem.category].push({
    name: newItem.name,
    completed: false,
    note: newItem.note
  })
  ElMessage.success('已添加')
  itemDialogVisible.value = false
  Object.assign(newItem, { name: '', note: '', category: 'required' })
}

const editItem = (categoryId, index) => {
  const item = allItems.value[categoryId][index]
  ElMessage.info(`编辑: ${item.name}`)
  // 实际实现需要编辑对话框
}

const removeItem = (categoryId, index) => {
  allItems.value[categoryId].splice(index, 1)
  ElMessage.success('已删除')
}

const formatDoc = (format) => {
  if (format === 'bold') {
    essayContent.value = `**${essayContent.value}**`
  } else if (format === 'italic') {
    essayContent.value = `*${essayContent.value}*`
  } else if (format === 'h2') {
    essayContent.value = `## ${essayContent.value}`
  } else if (format === 'list') {
    essayContent.value = essayContent.value.split('\n').map(l => `- ${l}`).join('\n')
  }
}

const saveVersion = () => {
  versions.value.unshift({
    date: new Date().toLocaleString('zh-CN'),
    note: `版本 ${versions.value.length + 1}`,
    content: essayContent.value
  })
  ElMessage.success('版本已保存')
}

// AI生成文书内容
const generateWithAI = async () => {
  if (!selectedProvider.value) {
    ElMessage.warning('请先配置AI提供商')
    return
  }

  if (!aiPrompt.value.trim()) {
    ElMessage.warning('请输入AI指令')
    return
  }

  const currentContent = essayContent.value
  isGenerating.value = true

  try {
    const systemPrompt = `你是一位文书写作导师，帮助用户改进和润色留学申请文书。
根据用户的指令和当前文书内容，提供具体的修改建议或直接生成内容。
用户当前的文书类型：${getEssayTypeName(currentEssayType.value)}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `当前文书内容：\n${currentContent || '(空)'}\n\n我的指令：${aiPrompt.value}` }
    ]

    const response = await sendMessageToAI(selectedProvider.value, messages, {
      temperature: 0.7,
      maxTokens: 1500
    })

    essayContent.value = response.content
    aiPrompt.value = ''
    ElMessage.success('AI生成完成')
  } catch (error) {
    ElMessage.error(`生成失败: ${error.message}`)
  } finally {
    isGenerating.value = false
  }
}

const getEssayTypeName = (type) => {
  const names = {
    ps: '个人陈述',
    cv: '简历',
    reference: '推荐信',
    research: '研究计划'
  }
  return names[type] || '文书'
}

const showVersions = () => {
  versionsVisible.value = true
}

const previewVersion = (version) => {
  essayContent.value = version.content
  versionsVisible.value = false
  ElMessage.success('已加载历史版本')
}

const restoreVersion = (version) => {
  essayContent.value = version.content
  versionsVisible.value = false
  ElMessage.success('已恢复到此版本')
}

const exportPDF = () => {
  ElMessage.info('导出PDF功能（需要后端支持或jsPDF库）')
}

const exportCSV = () => {
  ElMessage.info('导出CSV功能')
}

const generateReport = () => {
  const total = Object.values(allItems.value).flat().length
  const completed = completionRate.value
  ElMessage.success(`您已完成 ${completed}% 的材料准备 (${Math.round(total * completed / 100)}/${total})`)
}

const resetChecklist = () => {
  Object.keys(allItems.value).forEach(cat => {
    allItems.value[cat].forEach(item => {
      item.completed = false
    })
  })
  ElMessage.success('清单已重置')
}

onMounted(() => {
  const savedEssays = localStorage.getItem('essay_versions')
  if (savedEssays) {
    versions.value = JSON.parse(savedEssays)
  }
  const savedChecklist = localStorage.getItem('materials_checklist')
  if (savedChecklist) {
    Object.assign(allItems.value, JSON.parse(savedChecklist))
  }
})
</script>

<style scoped>
.materials-page {
  max-width: 1000px;
  margin: 0 auto;
}

.editor-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.editor-content {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  min-height: 400px;
}

.editor-content textarea {
  width: 100%;
  min-height: 400px;
  padding: 15px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.word-count {
  text-align: right;
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}

.progress-card {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.checklist-actions {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.checklist-card {
  margin-bottom: 20px;
}

.add-custom-btn {
  width: 100%;
  margin-top: 15px;
  border-style: dashed !important;
}

/* AI助手样式 */
.ai-assistant {
  margin-bottom: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.ai-input-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.ai-input-row .el-input {
  flex: 1;
}
</style>
