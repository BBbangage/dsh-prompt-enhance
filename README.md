# dsh-prompt-enhance

> One-click prompt enhancement for the DeepSeek Harness (DSH) Web composer:
> keep your original sentence, expand it into concrete, executable requirements —
> with a rule-template fallback and one-click undo.
>
> 为 DeepSeek Harness(DSH)Web 聊天输入框提供一键提示词增强:保留你的原句,扩写为具体可执行的要求——模型不可用时自动降级规则模板,增强后一键撤回。

[中文说明](#功能特性) · [English](#features)

## Features / 功能特性

- **One-click enhance** / 一键增强:点击输入框发送按钮旁的星芒图标,把当前草稿扩写为增强提示词;
- **Keeps your original sentence** / 保留原句:输出以「原句。具体要求如下:」开头,自然分行列出 2~4 条具体要求(无「角色/目标/产出」类标签,方便你逐条修改);
- **Smart by intent** / 按内容智能:识别参数修改、数据汇总、内容创作、翻译、审查、代码、文件处理等意图,并抽取输入中已有的数据源/格式/受众/时间等信息,不重复追问;
- **LLM-first with rule fallback** / 模型为主、规则兜底:默认用当前模型改写(贴合领域细节),模型不可用/超时(15s)时自动降级为规则模板,照样出结果;
- **One-click undo** / 一键撤回:增强后同一个按钮变为撤回图标(↺),点击恢复增强前的原文——不再怕"替换后丢原文";
- **Icon-only, zero noise** / 纯图标:输入为空时按钮置灰,处理中图标旋转,失败变红(悬停可见原因);
- **No extra config** / 零配置:复用 DSH 当前默认模型,不需要单独的 API Key。

## Requirements / 环境要求

- DeepSeek Harness Web `0.1.0-rc.6`+(建议相同或更新的 rc 版本);
- LLM 模式需要 DSH 中已配置可用的默认模型;未配置时自动使用规则模板降级,不会报错;
- 从源码安装时需要 Node.js 22+ 与 pnpm。

## Install / 安装

```bash
# 从 npm(发布后)
dsh plugin --profile web add dsh-prompt-enhance

# 从 GitHub(发布后)
dsh plugin --profile web add github:<owner>/dsh-prompt-enhance

# 从本地源码
git clone <repo-url> dsh-prompt-enhance
dsh plugin --profile web add ./dsh-prompt-enhance

# 装完重启
dsh web
```

> profile 名不是 `web` 时,换成你自己的 profile 名。

## Usage / 使用方法

1. 打开 DSH Web 聊天页面;
2. 在输入框写下原始需求,例如 `根据提供的PPT内容，对变压器参数进行修改`;
3. 点击发送按钮旁的**星芒图标**;
4. 输入框被替换为增强提示词,例如:

   ```
   根据提供的PPT内容，对变压器参数进行修改。具体要求如下：
   识别PPT中涉及的所有变压器参数（如额定容量、额定电压、额定电流、阻抗电压、空载损耗等），与现有参数逐一比对，找出差异项。
   按PPT中的最新数值更新差异项，未涉及的参数保持原值不变。
   修改完成后，输出变更前后的参数对比清单，标注每项参数的新旧值。
   ```

5. 逐条阅读、微调后发送;不满意点同一个按钮(此时为 **↺ 撤回** 图标)恢复原文。

> 也可以直接在输入框打 `/prompt-enhance 你的任务`(斜杠命令),效果等同按钮。

## How it works / 实现原理

- **Host 半边**(`lib/index.js`):注册 `/prompt-enhance` 命令;先尝试用当前默认模型(LLM)把任务扩写成具体要求,失败/超时则用内置规则模板(7 类意图 + 事实抽取)兜底;
- **Client 半边**(`lib/client.js`):在 `conversation.input.right` 注册纯图标按钮,经 `remote.commands` 调用 host 命令,结果回填输入框;按钮在增强后切换为撤回态,一键恢复原文;
- 不依赖动态插件 RPC(`harness`),是标准的可安装插件,重启 dsh 后常驻、无需每次授权。

## Uninstall / 卸载

```bash
dsh plugin --profile web remove dsh-prompt-enhance
dsh web
```

## FAQ

- **点按钮没反应/按钮没出现**:确认安装到了当前 profile 且已重启 `dsh web`;当前页面必须是聊天会话页。
- **输出是泛泛的规则模板风格(而非专业细节)**:说明 LLM 通道没走通(未配置默认模型或调用失败),已自动降级为规则模板;配置模型后即为 LLM 增强。
- **和 dsh-ai-prompt-optimizer 有什么区别**:本插件增强后**可一键撤回**(不会丢原文),模型不可用时**自动降级规则模板**,输出**固定保留原句 + 自然分行**,并按任务意图分类增强。

## License

[MIT](./LICENSE)
