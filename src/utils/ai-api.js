/**
 * AI API 调用工具模块
 * 支持多provider切换：OpenAI、Anthropic、国内供应商、其他
 */

// 获取所有已配置的provider
export function getProviders() {
  const saved = localStorage.getItem('ai_providers')
  return saved ? JSON.parse(saved) : []
}

// 根据ID获取provider配置
export function getProviderById(id) {
  const providers = getProviders()
  return providers.find(p => p.id === id)
}

// 发送消息到AI API
export async function sendMessageToAI(providerId, messages, options = {}) {
  const provider = getProviderById(providerId)

  if (!provider) {
    throw new Error('Provider未找到')
  }

  if (!provider.apiKey || !provider.baseUrl) {
    throw new Error('Provider配置不完整')
  }

  // 构建请求体（根据provider类型）
  const requestBody = buildRequestBody(provider, messages, options)

  // 发送请求
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API请求失败: ${response.status} - ${errorText}`)
  }

  // 处理流式或非流式响应
  if (options.stream) {
    return handleStreamResponse(response)
  } else {
    return handleNormalResponse(response)
  }
}

// 构建请求体
function buildRequestBody(provider, messages, options) {
  const baseBody = {
    model: provider.model || 'gpt-3.5-turbo',
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 1000
  }

  // Anthropic需要特殊的消息格式处理
  if (provider.type === 'anthropic') {
    return {
      model: provider.model || 'claude-3-opus-20240229',
      messages: messages.filter(m => m.role !== 'system').map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      system: messages.find(m => m.role === 'system')?.content || '',
      max_tokens: options.maxTokens || 1000,
      stream: options.stream || false
    }
  }

  return {
    ...baseBody,
    stream: options.stream || false
  }
}

// 处理普通响应
async function handleNormalResponse(response) {
  const data = await response.json()
  return {
    success: true,
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage
  }
}

// 处理流式响应
async function* handleStreamResponse(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield { type: 'content', content }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}

// 测试provider连接
export async function testProviderConnection(providerId) {
  const provider = getProviderById(providerId)

  if (!provider) {
    return { success: false, error: 'Provider未找到' }
  }

  if (!provider.apiKey || !provider.baseUrl) {
    return { success: false, error: '配置不完整' }
  }

  try {
    const testMessages = [
      { role: 'user', content: 'Hello, this is a test connection.' }
    ]

    const response = await sendMessageToAI(providerId, testMessages, {
      maxTokens: 10
    })

    return { success: true, response }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 为不同智能体构建系统提示词
export function buildSystemPrompt(agentId) {
  const prompts = {
    consultant: `你是一位专业的留学顾问，帮助用户解答关于出国留学的整体规划问题。
你的回答应该专业、全面、实用，涵盖选校、申请、时间规划等方面。`,
    essay: `你是一位文书导师，专注于帮助用户改进和润色留学申请文书。
你的建议应该具体、可操作，关注个人陈述、简历、推荐信的写作技巧。`,
    selection: `你是一位选校专家，根据用户的背景和目标提供选校建议。
你需要考虑用户的GPA、语言成绩、科研和实践经历，给出冲刺、适中和保底三个档次的学校推荐。`,
    visa: `你是一位签证申请助手，帮助用户了解签证申请流程和注意事项。
你需要针对不同国家（美国、英国、澳洲、加拿大等）提供具体的签证指导。`
  }

  return prompts[agentId] || '你是一个有用的助手。'
}

// 生成评估报告提示词
export function buildAssessmentPrompt(formData) {
  return `基于以下学生背景信息，请生成一份竞争力评估分析报告：

学生信息：
- 姓名：${formData.basic.name}
- 年龄：${formData.basic.age}
- 院校：${formData.basic.university}
- GPA：${formData.basic.gpa}
- 语言成绩：${formData.basic.language}
- 学历：${formData.academic.degree}
- 专业方向：${formData.academic.majors.join(', ')}
- 均分：${formData.academic.averageScore}
- 科研经历：${formData.academic.research.length} 项
- 实习经历：${formData.practice.internships.length} 项
- 竞赛获奖：${formData.practice.competitions.length} 项

请提供详细的分析和改进建议。`
}
