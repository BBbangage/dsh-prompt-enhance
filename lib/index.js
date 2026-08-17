// WorkBuddy 增强提示词 — host half
// 输入改写增强:保留原句 + 自然语言具体要求(LLM 改写为主,规则模板兜底)。
// 通过 commands 注册 /wben-enhance 命令;浏览器按钮经 remote.commands.execute 调用本命令。

const INTENTS = {
  param: { label: '参数修改', keywords: /(对|将)?[^。，,;；\n]{0,30}参数.*(修改|更新|改)|(修改|更新|改).*参数/i },
  data: { label: '数据分析与汇总', keywords: /汇总|统计|分析|报表|数据|表格|excel/i },
  writing: { label: '内容创作', keywords: /写|生成|创作|文案|文章|报告|文档|周报|月报/i },
  files: { label: '文件处理', keywords: /整理|清理|重命名|移动|批量|文件夹|目录/i },
  translate: { label: '翻译', keywords: /翻译/i },
  review: { label: '审查', keywords: /检查|审查|审阅|看看|有没有问题|风险|合同|协议/i },
  code: { label: '代码任务', keywords: /修复|改|优化|重构|注释|代码|bug|报错/i },
  generic: { label: '通用任务执行', keywords: /.*/ }
}

function classifyIntent(t) {
  const keys = ['param', 'data', 'writing', 'files', 'translate', 'review', 'code']
  for (let i = 0; i < keys.length; i++) if (INTENTS[keys[i]].keywords.test(t)) return keys[i]
  return 'generic'
}

function extractFacts(task, context) {
  const f = { source: '', format: '', time: '' }
  if (context !== '') f.source = context.slice(0, 120)
  if (f.source === '') {
    const m1 = /[A-Za-z]:[\\/][^\s，。;；,、]+/.exec(task)
    if (m1) f.source = m1[0]
    else {
      const m2 = /[^\s，。;；,、]+\.(xlsx?|csv|docx?|pdf|md|txt|pptx?)/i.exec(task)
      if (m2) f.source = m2[0]
    }
  }
  const mf = /(表格|excel|xlsx|csv|word|docx|pdf|markdown|md|报告|清单|邮件|ppt|pptx|幻灯片)/i.exec(task)
  if (mf) f.format = mf[1]
  const mt = /(今天|明天|本周|下周|这个月|本月|截止|deadline|ddl|尽快|[0-9]+[号日]前)/i.exec(task)
  if (mt) f.time = mt[1]
  return f
}

function ruleEnhance(task, context, intentKey) {
  const facts = extractFacts(task, context)
  const src = facts.source !== '' ? facts.source : '提供的资料'
  const parts = []
  switch (intentKey) {
    case 'param':
      parts.push('识别' + src + '中涉及的所有相关参数,与现有参数逐一比对,找出差异项')
      parts.push('按' + src + '中的最新数值更新差异项,未涉及的参数保持原值不变')
      parts.push('修改完成后,输出变更前后的参数对比清单,标注每项参数的新旧值')
      break
    case 'data':
      parts.push('识别并读取' + src + '的数据,清洗缺失值与格式不一致项,去除重复')
      parts.push('按统一口径汇总统计,数值计算可复核,不修改原始数据文件')
      parts.push('输出汇总表与结论摘要')
      break
    case 'writing':
      parts.push('先明确主题与受众,再组织内容')
      parts.push('正文结构完整,关键信息与数据需有出处,不得编造')
      parts.push('输出' + (facts.format !== '' ? facts.format + '格式' : '成稿') + ',语言通顺、重点突出')
      break
    case 'files':
      parts.push('先列出目标文件清单,明确处理范围')
      parts.push('默认只读处理,涉及改名、删除、覆盖写入时先征得确认')
      parts.push('处理完成后输出变更清单,便于核对')
      break
    case 'translate':
      parts.push('通读原文,标记专业术语与专有名词')
      parts.push('翻译时保持术语一致,不随意增删内容,保留原文格式')
      parts.push('完成后对照原文校对一遍再输出译文')
      break
    case 'review':
      parts.push('逐项核对' + src + '的内容,重点关注风险、合规性、遗漏与数据准确性')
      parts.push('只审查不修改原文')
      parts.push('输出问题清单、风险等级与修改建议')
      break
    case 'code':
      parts.push('先复现问题,定位到具体文件与代码位置')
      parts.push('做最小范围的修改,不引入无关改动')
      parts.push('补充或更新测试,验证改动不破坏现有功能')
      break
    default:
      parts.push('先明确任务目标、输入与预期产出')
      parts.push('按步骤执行,关键过程可复核')
      parts.push('输出结果并说明关键决策与假设')
  }
  if (facts.time !== '') parts.push('在' + facts.time + '前完成')
  const lines = [task + '。具体要求如下:']
  for (let i = 0; i < parts.length; i++) lines.push(parts[i] + '。')
  return lines.join('\n')
}

async function llmEnhance(ctx, task, context) {
  const llm = ctx.get('llm')
  if (llm === undefined) return ''
  const sel = ctx.get('agentDefaultModel')
  const selection = sel !== undefined ? sel.currentSelection() : undefined
  if (selection === undefined || typeof selection.provider !== 'string' || typeof selection.model !== 'string') return ''
  const system = '你是一名提示词增强器。用户会给一句简短的任务描述,请扩写成简短、可直接执行的具体要求。格式要求:1) 第一行原样保留用户原句,句末加「。具体要求如下:」然后换行;2) 之后把具体要求分成几行书写,每行是一条完整的话,使用规范中文标点(逗号、分号、句号),行与行之间不要空行;3) 不强制编号,不要用「1.」「2.」或「-」「•」等标记,自然分行即可;4) 共 2~4 行,总字数控制在 120~180 字;5) 每行都要具体可执行,优先补充最能影响执行的信息(对象、步骤、边界、产出),不要泛泛而谈;6) 禁止「角色:」「目标:」「产出:」等标签,禁止 Markdown 标题与项目符号;7) 原句已较完整时只补 1~2 行最关键细节;8) 只输出按要求格式化的文本,不要任何解释。'
  const userText = context !== '' ? task + '\n附加上下文:' + context : task
  const messages = [{
    id: 'wben-' + Date.now() + '-u',
    role: 'user',
    content: [{ type: 'text', text: userText }],
    source: { kind: 'user' }
  }]
  let text = ''
  try {
    const collected = await Promise.race([
      (async () => {
        let out = ''
        for await (const chunk of llm.stream({
          provider: selection.provider,
          model: selection.model,
          messages: messages,
          system: system,
          temperature: 0.4,
          maxTokens: 400
        })) {
          if (chunk.type === 'text-delta') out += chunk.text
        }
        return out
      })(),
      ctx.timeout(15000).then(() => '__WBEN_TIMEOUT__')
    ])
    if (typeof collected === 'string' && collected !== '__WBEN_TIMEOUT__') text = collected.trim()
  } catch (e) {
    console.error('wben llm enhance failed: %o', e)
  }
  if (text.length < task.length) return ''
  return text
}

export default {
  name: 'workbuddy-prompt-enhancer',
  inject: ['commands', 'timer'],
  apply(ctx) {
    ctx.commands.register({
      name: 'prompt-enhance',
      description: '增强提示词:把简短任务扩写为具体可执行的要求(保留原句)',
      input: { hint: '任务描述' },
      handler: async ({ rawInput }) => {
        const task = String(rawInput || '').trim()
        if (task.length === 0) return { kind: 'error', text: '任务为空,请先输入内容。' }
        if (task.length > 800) return { kind: 'success', text: task }
        const intentKey = classifyIntent(task)
        let text = ''
        try {
          text = await llmEnhance(ctx, task, '')
        } catch (e) {
          console.error('wben enhance failed: %o', e)
        }
        if (text === '') text = ruleEnhance(task, '', intentKey)
        return { kind: 'success', text }
      }
    })
  }
}
