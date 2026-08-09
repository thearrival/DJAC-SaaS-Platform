import type { DocSection } from "./DocsPortal";

/* ──────────────────────────────────────────────────────────────────────────
   Chinese (zh) — Complete documentation data (11 sections, 24 pages)
   ────────────────────────────────────────────────────────────────────────── */

export const docsZh: DocSection[] = [
  {
    id: "getting-started",
    title: "入门指南",
    icon: "book",
    pages: [
      {
        id: "welcome",
        title: "欢迎使用 DJAC",
        summary:
          "DJAC 是全球首个AI驱动的跨司法管辖区合规智能平台。几分钟即可部署，在29+个司法管辖区实现监管合规。",
        content: `### 什么是 DJAC？
DJAC（法定自动化合规）是一个企业级SaaS平台，可自动化处理中国、沙特、海湾合作委员会、欧盟、北美和亚太地区的监管合规。

> **info** 专为合规官、法务团队、企业管理员、顾问和政府监管机构打造。

### 为什么选择 DJAC？
- **29+ 司法管辖区** — PIPL、PDPL、CSL、DSL、GDPR、ISO 27001、SOC 2、NIST CSF、HIPAA等
- **AI驱动分析** — GPT-4o驱动的8阶段合规评估流水线
- **实时监控** — 持续合规跟踪，自动差距检测
- **跨境智能** — 数据传输合规检查器和监管变化监控
- **供应商风险管理** — 跨所有选定框架的自动第三方评估
- **企业级安全** — AES-256加密、RBAC、审计跟踪、SOC 2就绪

> **tip** DJAC支持3种语言——英语、阿拉伯语和中文——可随时从顶部的语言菜单切换。

### 快速开始（5分钟）
1. **创建您的组织** — 设置公司资料和账单
2. **选择司法管辖区** — 选择中国、沙特、欧盟或任意组合
3. **选择框架** — AI自动推荐相关法规
4. **注册供应商** — 添加您的第一个第三方供应商
5. **运行评估** — AI在60秒内生成完整的合规报告

> **tip** 入门向导会引导您完成整个流程——注册后请在仪表板中查找。

### 平台套餐
| 套餐 | 每月 | 最适合 |
|------|---------|----------|
| Starter | 每月 $99起 | 小团队、单一司法管辖区 |
| Professional | 每月 $249起 | 多司法管辖区合规 |
| Enterprise | 定制 | 全球企业、API、专属支持 |

> **faq** AI供应商评估需要多长时间？
> **answer** 大多数评估在60秒内完成，并会通过WebSocket实时流式展示8个流水线阶段中每个阶段的进度。
> **faq** 开箱即用支持哪些法规？
> **answer** 覆盖29个司法管辖区的60多个框架——包括GDPR、NIS2、DORA、PIPL、PDPL、ISO 27001、SOC 2等。AI引擎会根据您的资料自动推荐相关法规。
> **faq** DJAC可以在我们自己的基础设施上运行吗？
> **answer** 可以——除了Vercel云托管，还支持基于Docker的自托管部署，并且平台可扩展自定义框架。`,
      },
      {
        id: "architecture",
        title: "平台架构",
        summary:
          "DJAC运行在云原生架构上，采用React 19、Express + tRPC、Supabase上的PostgreSQL、Redis和OpenAI GPT-4o。",
        content: `### 系统架构
DJAC采用现代单体仓库（monorepo）架构：

**前端**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  
**后端**: Express 4 + tRPC 11（200+个API程序）+ Drizzle ORM  
**数据库**: Supabase上的PostgreSQL 17（AWS东京，ap-northeast-2）  
**AI引擎**: OpenAI GPT-4o，8阶段评估流水线  
**队列**: 内存 / Redis（支持BullMQ）  
**身份验证**: 三路径（Clerk OAuth + Supabase Auth + 本地JWT）  
**计费**: Stripe（5个计划 × 4个周期）  
**托管**: Vercel（无服务器）+ Docker

### 数据流
1. 用户提交供应商评估请求
2. 守门人验证输入（注入检测）
3. 摄入模块解析文档并规范化文本
4. 提取器识别结构化事实（键-值-证据三元组）
5. RAG上下文从数据库检索相关合规控制项
6. 法官（GPT-4o）对照控制项评估合规性
7. 合成器将发现结果合并为跨框架报告
8. 验证器确保模式一致性和数据完整性
9. 报告器生成最终格式化输出（PDF/DOCX/JSON）`,
        diagram:
          "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (GPT-4o)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
      },
      {
        id: "roles",
        title: "角色与权限",
        summary:
          "DJAC提供细粒度的基于角色的访问控制：6个平台角色和4个组织角色，覆盖30+个模块。",
        content: `### 平台角色
| 角色 | 级别 | 访问权限 |
|------|-------|--------|
| 基础用户 | 10 | 对分配模块的只读访问 |
| 专业用户 | 20 | 合规功能的完整访问 |
| 公司管理员 | 30 | 组织管理 + 团队 |
| 平台管理员 | 40 | 跨组织监督和配置 |
| Yalla Hack员工 | 45 | 内部支持和运营 |
| 超级管理员 | 100 | 无限制的平台完整访问 |

### 组织角色
| 角色 | 级别 | 能力 |
|------|-------|-------------|
| 分析师 | 10 | 大多数模块只读 |
| 合规官 | 20 | 创建/编辑合规数据 |
| 管理员 | 30 | 团队管理 + API密钥 |
| 所有者 | 40 | 计费 + 组织设置 + 完整访问 |

> **tip** 您可以为每个模块、每个角色自定义权限——默认设置只是起点。

### 权限模型
每个模块（30+个）有6个权限标志：
- \`canView\` — 读取访问
- \`canCreate\` — 创建新记录
- \`canEdit\` — 修改现有记录
- \`canDelete\` — 删除记录
- \`canExport\` — 下载/导出数据
- \`canInvite\` — 邀请团队成员`,
      },
    ],
  },
  {
    id: "ai-engine",
    title: "AI合规引擎",
    icon: "zap",
    pages: [
      {
        id: "ai-overview",
        title: "AI引擎概述",
        summary:
          "DJAC的8阶段AI流水线使用GPT-4o同时评估多个框架下的供应商合规性。",
        content: `### 8阶段流水线
1. **守门人** — 输入验证、注入检测、数据清理
2. **摄入** — 文档解析、文本规范化、语言检测
3. **提取器** — 将结构化事实提取为键-值-证据三元组
4. **RAG上下文** — 检索增强生成：从PostgreSQL提取相关合规控制项
5. **法官（GPT-4o）** — 对照适用控制要求评估每项事实
6. **合成器** — 合并发现结果，生成跨框架比较
7. **验证器** — 模式验证、跨字段一致性、失败重试
8. **报告器** — 最终格式化输出（PDF、DOCX或JSON）

> **info** 每个阶段都会将进度记录到WebSocket频道，您可以实时观看评估过程。

### AI功能
- **自动差距分析** — 识别缺失的控制项和不合规领域
- **风险评分（0-100）** — 按框架和总体合规评分
- **整改建议** — AI建议的操作按优先级排序
- **罚款估算** — 根据司法管辖区计算潜在罚款
- **跨司法管辖区比较** — 并排的框架覆盖分析
- **实时任务流** — 评估期间通过WebSocket跟踪进度`,
      },
      {
        id: "rag-system",
        title: "RAG上下文系统",
        summary: "检索增强生成系统在AI分析之前从数据库检索最相关的合规控制项。",
        content: `### RAG工作原理
1. **文档解析** — 从供应商文档中提取事实
2. **语义搜索** — 将事实与1,000+个合规控制项匹配
3. **相关性评分** — 按管辖和主题相关性对控制项排序
4. **上下文组装** — 为GPT-4o构建聚焦的上下文窗口
5. **有依据的响应** — AI仅基于检索到的控制项评估（不产生幻觉）

### 优势
- 消除合规建议中的AI幻觉
- 确保特定于框架的推荐
- 维护控制项到发现结果的审计跟踪
- 支持29+个司法管辖区及特定管辖控制项

> **tip** RAG系统使DJAC在法律上可靠——它从不猜测监管要求。

### 知识库
- 46个监管框架
- 1,000+个合规控制项
- 14+种跨框架关系类型
- 全球标准集群：ISO 27001、NIST CSF、SOC 2、HIPAA、PCI DSS`,
      },
    ],
  },
  {
    id: "frameworks",
    title: "合规框架",
    icon: "shield",
    pages: [
      {
        id: "jurisdictions",
        title: "支持的司法管辖区",
        summary:
          "DJAC覆盖亚太、欧洲、中东、北美和非洲29+个司法管辖区的全面监管框架。",
        content: `### 亚太地区
- **中国** — PIPL、CSL、DSL、MLPS 2.0
- **日本** — APPI
- **韩国** — PIPA
- **新加坡** — PDPA
- **印度** — DPDP法案
- **澳大利亚** — 1988年隐私法案

### 中东/海湾地区
- **沙特阿拉伯** — PDPL、NCA ECC / CSCC / OCC
- **阿联酋** — UAE PDPL
- **卡塔尔** — Qatar PDPPL
- **巴林** — Bahrain PDPL
- **科威特** — Kuwait DPA
- **阿曼** — Oman PDPL

### 欧洲
- **欧盟/欧洲经济区** — GDPR、NIS2指令、DORA
- **英国** — UK GDPR / DPA 2018

### 北美
- **美国** — HIPAA、CCPA/CPRA、SOX、PCI DSS
- **加拿大** — PIPEDA

### 全球标准
- ISO 27001 / 27002
- NIST网络安全框架（CSF）
- SOC 2 Type II
- PCI DSS v4.0`,
      },
      {
        id: "pipl-guide",
        title: "PIPL合规指南",
        summary:
          "中国《个人信息保护法》（PIPL）综合指南，包括数据本地化和跨境传输规则。",
        content: `### PIPL概述
中国的《个人信息保护法》（PIPL）于2021年11月1日生效，规范组织如何收集、使用、存储和传输中国境内个人的个人信息。

> **warning** 违反PIPL最高可处以5000万元人民币（约700万美元）或年收入5%的罚款。

### 关键要求
1. **同意** — 收集数据需要明确、知情的同意
2. **数据最小化** — 只收集必要数据
3. **目的限制** — 数据仅用于指定目的
4. **数据本地化** — 关键信息基础设施运营者必须将数据存储在中国
5. **跨境传输** — 需要网信办（CAC）安全评估
6. **个人信息保护影响评估** — 高风险处理前进行影响评估
7. **数据主体权利** — 访问、更正、删除、可携带
8. **泄露通知** — 72小时内报告

### DJAC如何提供帮助
- 自动PIPL控制项映射（全部72条）
- 跨境传输评估及CAC指导
- 针对PIPL要求的供应商风险评分
- 持续监控监管更新
- 基于收入和违规严重程度的罚款计算器`,
        caseStudy: {
          company: "欧洲SaaS公司",
          challenge:
            "需要在中国上线，同时保持GDPR合规。要求对12家处理中国用户数据的供应商进行PIPL差距分析。",
          solution:
            "使用DJAC的PIPL模块同时评估全部12家供应商，生成了显示GDPR-PIPL覆盖重叠和差距的跨框架报告。",
          results:
            "识别出供应商中的47项合规差距。6周内实现完整的PIPL合规。法律咨询成本降低60%。",
        },
      },
    ],
  },
  {
    id: "vendor-risk",
    title: "供应商风险管理",
    icon: "building",
    pages: [
      {
        id: "vendor-assessment",
        title: "供应商合规评估",
        summary:
          "通过AI驱动的分析和差距报告，自动化跨所有选定框架的第三方供应商合规评估。",
        content: `### 自动化供应商评估
1. **注册供应商** — 添加供应商名称、行业、司法管辖区和技术栈
2. **选择框架** — 选择适用的监管框架
3. **上传证据** — 附加供应商政策、认证、审计报告
4. **运行评估** — AI对照所有选定框架分析供应商
5. **查看结果** — 详细的差距分析和风险评分（0-100）
6. **导出报告** — 为利益相关者生成专业PDF/DOCX报告

### 评估输出
- **总体得分** — 所有框架的加权平均值（0-100）
- **各框架得分** — 单独合规分数
- **风险等级** — 严重 / 高 / 中 / 低
- **差距分析** — 具体的不合规控制项及严重程度
- **整改计划** — 按优先级排序的操作项和截止日期
- **罚款背景** — 每个差距在每个司法管辖区的适用罚款

### 持续监控
DJAC按可配置的间隔自动重新评估供应商，并提醒您：
- 影响现有供应商的新监管要求
- 供应商风险状况的变化
- 即将过期的认证或审计报告
- 与供应商司法管辖区相关的新兴威胁`,
        bestPractices: [
          "在签署合同之前评估供应商，而不是之后",
          "为高风险供应商设置季度重新评估计划",
          "使用跨司法管辖区比较来识别框架重叠",
          "记录供应商对评估发现的所有回应",
          "将供应商差距与您的内部风险登记册关联以实现可追溯性",
        ],
      },
      {
        id: "supplier-profiles",
        title: "供应商合规档案",
        summary:
          "构建包含司法管辖区特定数据、技术栈分析和联系人管理的全面供应商档案。",
        content: `### 档案组件
- **基本信息** — 名称、行业、网站、司法管辖区
- **技术栈** — 带版本跟踪的技术组件
- **联系人** — 带角色和司法管辖区分配的关键人员
- **风险等级** — 基于数据处理流程的自动风险分类
- **评估历史** — 所有合规评估的完整时间线
- **文档库** — 证据、认证、政策

### 风险分级
DJAC自动计算供应商风险等级：
- **严重** — 处理个人/敏感数据，在高度监管的司法管辖区运营
- **高** — 处理受监管数据、跨境数据流
- **中** — 有限的数据暴露、标准监管要求
- **低** — 风险状况极小，无敏感数据处理`,
      },
    ],
  },
  {
    id: "api-integration",
    title: "API与集成",
    icon: "terminal",
    pages: [
      {
        id: "api-reference",
        title: "API参考",
        summary:
          "DJAC提供类型安全的tRPC API，包含42个路由器的200+个程序，以及用于Webhooks和健康检查的REST端点。",
        content: `### API概述
DJAC使用**tRPC**实现端到端类型安全的API操作。所有程序都通过\`POST /api/trpc\`，支持批处理。

**基础URL：**
- 生产环境：\`https://app.yalla-hack.ae\`
- 本地：\`http://localhost:3000\`

### 认证方法
| 方法 | 请求头 | 使用场景 |
|--------|--------|----------|
| 会话Cookie | \`app_session_id\` | Web应用（默认） |
| API密钥 | \`x-djac-api-key: djac_<hex>\` | 编程访问 |
| Clerk OAuth | 自动管理 | 外部OAuth |

### 路由器类别
| 领域 | 路由器 | 关键程序 |
|--------|---------|----------------|
| 认证 | \`localAuth\`、\`auth\`、\`googleAuth\` | register、login、mfa |
| 组织 | \`orgSettings\`、\`orgMembers\` | create、invite、updateRole |
| RBAC | \`role\`、\`rbac\` | getPermissions、setPermissions |
| 合规 | \`compliance\`、\`regulatoryChanges\` | frameworks.list、controls.get |
| 供应商 | \`vendor\`、\`vendorCompliance\` | list、create、assess |
| 风险 | \`riskRegister\`、\`remediation\` | list、create、update |
| AI | \`ai\` | startAssessment、getJob |
| 报告 | \`complianceReport\` | generate、download、schedule |
| 计费 | \`billing\` | getPlans、checkout |
| 管理 | \`admin\`、\`system\` | getStats、getAuditLogs |

### 错误代码
| 代码 | 说明 |
|------|-------------|
| \`UNAUTHORIZED\` | 需要身份验证 |
| \`FORBIDDEN\` | 权限不足 |
| \`NOT_FOUND\` | 资源不存在 |
| \`VALIDATION_ERROR\` | 输入验证失败 |
| \`RATE_LIMITED\` | 请求过多 |`,
      },
      {
        id: "websocket",
        title: "WebSocket流式传输",
        summary:
          "AI评估进度通过 /ws/ai-jobs 上的WebSocket实时流式传输，带有任务生命周期事件。",
        content: `### WebSocket端点
**URL:** \`wss://app.yalla-hack.ae/ws/ai-jobs\`

### 事件类型
| 事件 | 方向 | 载荷 |
|-------|-----------|---------|
| \`job:progress\` | 服务器 → 客户端 | \`{ jobId, stage, message, progress }\` |
| \`job:complete\` | 服务器 → 客户端 | \`{ jobId, result }\` |
| \`job:error\` | 服务器 → 客户端 | \`{ jobId, error: string }\` |
| \`subscribe\` | 客户端 → 服务器 | \`{ jobId: string }\` |

### 示例
\`\`\`typescript
const ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));
ws.onmessage = (e) => {
  const { type, stage, message } = JSON.parse(e.data);
  if (type === "job:progress") updateUI(stage, message);
  if (type === "job:complete") showResults(data.result);
};
\`\`\``,
      },
    ],
  },
  {
    id: "security-compliance",
    title: "安全与合规",
    icon: "lock",
    pages: [
      {
        id: "security-overview",
        title: "安全架构",
        summary:
          "DJAC遵循OWASP Top 10，在身份验证、授权、数据保护和基础设施方面实施纵深防御。",
        content: `### 纵深防御
**身份验证：**
- bcrypt密码哈希（12轮）
- HS256签名的JWT令牌（密钥至少64字符）
- HTTP-only、Secure、SameSite Cookie
- 基于TOTP的MFA及备份码
- 基于OTP的密码重置（SHA-256，5分钟有效期）

**授权：**
- 7个平台角色 + 4个组织角色
- 32个权限控制模块
- 所有PostgreSQL表的行级安全（RLS）
- 组织范围的数据隔离

**数据保护：**
- 所有传输中数据使用TLS 1.3
- PostgreSQL静态加密（Supabase）
- 密钥存储于Vercel环境变量和GitHub Actions

### 安全响应头
| 响应头 | 值 | 用途 |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000 | 强制HTTPS |
| X-Content-Type-Options | nosniff | 防止MIME嗅探 |
| X-Frame-Options | DENY | 防止点击劫持 |
| Content-Security-Policy | 按路由限制 | 缓解XSS |
| Referrer-Policy | strict-origin | 防止引用泄露 |

### CVE修补
- Dependabot自动漏洞警报
- pnpm overrides用于传递依赖修补
- CI流水线中的CodeQL安全分析`,
      },
      {
        id: "rbac-system",
        title: "RBAC与权限系统",
        summary: "跨32个平台模块的细粒度权限，每个组织可自定义角色覆盖。",
        content: `### 权限解析流程
1. 请求到达tRPC程序
2. 认证中间件提取\`ctx.user\`和\`ctx.orgRole\`
3. 系统检查自定义\`rolePermissions\`行
4. 回退到\`DEFAULT_ORG_ROLE_PERMISSIONS\`
5. 将操作与PermissionFlags比较
6. 返回Allow或403 FORBIDDEN

### 权限标志
每个模块有6个标志：
- \`canView\` — 读取访问
- \`canCreate\` — 创建新记录
- \`canEdit\` — 修改现有记录
- \`canDelete\` — 删除记录
- \`canExport\` — 下载/导出数据
- \`canInvite\` — 邀请团队成员

### 默认模板
| 角色 | 默认模式 |
|------|----------------|
| 分析师 | 大多数模块VIEW_ONLY |
| 合规官 | 合规模块STANDARD |
| 管理员 | 合规FULL，设置STANDARD |
| 所有者 | 全部FULL |`,
      },
    ],
  },
  {
    id: "developer-guide",
    title: "开发者指南",
    icon: "code",
    pages: [
      {
        id: "dev-setup",
        title: "开发环境设置",
        summary:
          "使用Node.js 20+、pnpm 10+、Docker for Supabase以及所有必需服务设置本地环境。",
        content: `### 前提条件
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop（用于Supabase）
- Supabase CLI (\`npm install -g supabase\`)

### 首次设置
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
# → http://localhost:3000
\`\`\`

### 开发认证绕过
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\`

### 可用脚本
| 命令 | 用途 |
|---------|---------|
| \`pnpm dev\` | 启动开发服务器 |
| \`pnpm check\` | TypeScript类型检查 |
| \`pnpm lint\` | ESLint |
| \`pnpm test\` | 运行测试（vitest） |
| \`pnpm build\` | 生产构建 |
| \`pnpm verify:all\` | 所有检查 + 构建 |`,
        demoSteps: [
          "克隆仓库并通过'pnpm install'安装依赖",
          "将.env.example复制为.env并填写所需值",
          "通过'supabase start'在本地启动Supabase",
          "通过'pnpm db:push'推送数据库模式",
          "通过'pnpm seed:data'填充参考数据",
          "通过'pnpm dev'启动开发服务器 → http://localhost:3000",
        ],
      },
      {
        id: "adding-features",
        title: "添加新功能",
        summary:
          "遵循DJAC的模式添加新的tRPC路由器、React页面、数据库表和测试。",
        content: `### 添加tRPC路由器
\`\`\`typescript
// server/my-feature-router.ts
import { orgProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const myFeatureRouter = router({
  list: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));
    }),
  create: orgProcedure
    .input(z.object({ orgId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [rec] = await db.insert(myTable).values(input).returning();
      return rec;
    }),
});
\`\`\`

在\`server/routers.ts\`中注册：
\`\`\`typescript
import { myFeatureRouter } from "./my-feature-router";
export const appRouter = router({ myFeature: myFeatureRouter });
\`\`\`

### API设计规则
1. 所有变更操作使用tRPC + Zod验证
2. 使用\`protectedProcedure\`进行身份验证，使用\`orgProcedure\`进行组织范围操作
3. 检查\`ctx.user.role\`进行授权
4. 绝不信任客户端输入——始终使用Zod验证`,
      },
    ],
  },
  {
    id: "deployment-operations",
    title: "部署与运维",
    icon: "server",
    pages: [
      {
        id: "deployment",
        title: "部署选项",
        summary:
          "DJAC支持Vercel（无服务器）、Docker和手动VPS部署。CI/CD流水线自动化预发布和生产环境。",
        content: `### Vercel（推荐）
\`\`\`bash
pnpm build
vercel --prod
supabase db push --linked
supabase functions deploy
curl https://your-app.com/api/health
\`\`\`

### Docker
\`\`\`bash
docker build -t djac:latest .
docker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest
\`\`\`

### CI/CD流水线
| 工作流 | 触发 | 操作 |
|----------|---------|---------|
| CI | 推送/PR | Lint、类型检查、测试、构建 |
| 预发布 | 推送到develop | 自动部署到Vercel预览 |
| 生产 | 推送到main | 部署 + 数据库迁移 + 健康检查 |

### 生产检查清单
- [ ] JWT_SECRET ≥ 64字符
- [ ] DEV_AUTH_BYPASS=false
- [ ] 数据库连接池大小：25个连接
- [ ] 配置Redis
- [ ] 启用RLS策略
- [ ] 启用Sentry错误跟踪`,
      },
      {
        id: "monitoring",
        title: "监控与可观测性",
        summary:
          "Sentry用于错误跟踪，Pino用于结构化日志，健康/就绪端点用于运维监控。",
        content: `### 健康端点
| 端点 | 用途 |
|----------|---------|
| \`/api/health\` | 健康检查（状态、运行时间） |
| \`/api/readyz\` | 就绪检查（数据库、Redis、Stripe、AI） |

### 后台调度器
| 调度器 | 间隔 | 用途 |
|-----------|----------|---------|
| 交互保留 | 24小时 | 清除旧日志 |
| 试用提醒 | 6小时 | 试用到期邮件 |
| 截止日期提醒 | 1小时 | 监管截止日期通知 |
| 报告投递 | 可配置 | 定时生成报告 |`,
      },
      {
        id: "troubleshooting",
        title: "常见问题排查",
        summary: "开发、部署和运维常见问题的解决方案。",
        content: `### 常见问题
**数据库连接错误：** 检查\`.env\`中的\`DATABASE_URL\`，确保Supabase正在运行。

**AI卡在"queued"状态：** 检查Redis连接。开发模式下，确认\`AI_QUEUE_MODE=in_memory\`。

**OpenAI 401：** \`OPENAI_API_KEY\`无效。

**Vercel构建失败：** 检查环境变量，确保Node 20+，用\`pnpm build\`测试。

### 调试
- 调试日志：\`LOG_LEVEL=debug pnpm dev\`
- 跟踪请求：\`X-Request-ID\`请求头
- 在Sentry仪表板中查看错误`,
        troubleshooting: [
          {
            problem: "登录返回'Authentication required (10001)'",
            solution:
              "检查.env中的JWT_SECRET，清除浏览器Cookie，验证COOKIE_DOMAIN。",
          },
          {
            problem: "pnpm db:push因迁移错误失败",
            solution:
              "用'supabase db status'检查，使用'supabase db reset'进行开发重置。",
          },
          {
            problem: "Vercel构建因内存限制失败",
            solution: "外部化大型依赖，在Vercel设置中增加Node内存。",
          },
          {
            problem: "Stripe webhook未收到事件",
            solution:
              "验证STRIPE_WEBHOOK_SECRET，使用'stripe listen'进行本地测试。",
          },
        ],
      },
    ],
  },
  {
    id: "billing-plans",
    title: "计费与计划",
    icon: "card",
    pages: [
      {
        id: "pricing-overview",
        title: "定价与计划概览",
        summary: "为各规模团队提供灵活的订阅计划——从初创公司到全球企业。",
        content: `### 计划对比
| 功能 | 免费试用 | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| 司法管辖区 | 1 | 3 | 10 | 无限制 |
| 供应商 | 5 | 25 | 100 | 无限制 |
| AI评估/月 | 3 | 20 | 100 | 定制 |
| 团队成员 | 2 | 10 | 50 | 无限制 |
| API访问 | — | — | ✓ | ✓ |
| 优先支持 | — | — | ✓ | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### 计费周期
- **每月** — 标准价格
- **每季度** — 10%折扣
- **每半年** — 15%折扣
- **每年** — 20%折扣

### 免费试用
- Starter计划14天免费试用
- 无需信用卡
- 完整访问所有Starter功能`,
      },
      {
        id: "subscription-management",
        title: "管理您的订阅",
        summary: "通过Stripe客户门户升级、降级或取消。查看账单历史记录和发票。",
        content: `### 订阅生命周期
1. **试用** → 注册时自动14天试用
2. **有效** → 付费订阅
3. **逾期** → 付款失败；宽限期
4. **已取消** → 数据保留30天

### 升级/降级
- **升级：** 立即访问，按比例收费。
- **降级：** 在计费周期结束时生效。

### 账单门户
访问方式：**仪表板 → 计费与计划 → 管理订阅**
- 更新付款方式
- 查看账单历史记录
- 下载发票
- 更改/取消计划`,
        troubleshooting: [
          {
            problem: "付款失败但卡片有效",
            solution: "检查国际交易限制，尝试其他卡片或联系支持。",
          },
          {
            problem: "升级未在仪表板中反映",
            solution: "最多等待5分钟进行配置，尝试刷新或重新登录。",
          },
          {
            problem: "试用结束但需要更多时间",
            solution: "联系支持获取一次性7天延期（每个组织一次）。",
          },
        ],
      },
    ],
  },
  {
    id: "operations",
    title: "网络安全运营",
    icon: "gauge",
    pages: [
      {
        id: "risk-register",
        title: "风险登记册",
        summary: "集中风险管理，具备自动严重性评分、处理计划和框架关联。",
        content: `### 风险管理流程
1. **识别** — 记录风险及其类别和可能性/影响
2. **评估** — 自动风险评分（可能性 × 影响）
3. **处理** — 接受、缓解、转移或避免
4. **关联** — 将风险关联到供应商、框架和任务
5. **监控** — 跟踪状态和处理进度

### 风险类别
- **运营** — 流程失败、系统中断
- **法律** — 监管不合规、合同违约
- **技术** — 安全漏洞、架构弱点
- **财务** — 预算超支、欺诈风险
- **声誉** — 品牌损害、客户信任下降`,
      },
      {
        id: "incident-management",
        title: "事件管理",
        summary: "记录、跟踪和解决安全与合规事件，具备自动监管映射。",
        content: `### 事件生命周期
1. **检测** — 记录事件类型、严重程度、受影响系统
2. **分诊** — 自动严重程度分类
3. **调查** — 带证据的时间线跟踪
4. **遏制** — 行动跟踪、通知
5. **解决** — 根本原因分析、整改文档
6. **关闭** — 事后审查

### 自动监管映射
- 中国数据泄露 → PIPL第57条（72小时内报告网信办）
- 欧盟数据泄露 → GDPR第33条（72小时内报告监管机构）
- 安全事件 → 识别多框架影响`,
      },
    ],
  },
  {
    id: "case-studies",
    title: "案例研究",
    icon: "star",
    pages: [
      {
        id: "enterprise-expansion",
        title: "企业跨境扩展",
        summary:
          "一家财富500强制造商如何使用DJAC为50+家供应商在中国、沙特阿拉伯和欧盟实现合规。",
        content: `### 背景
一家收入超过20亿美元的全球制造商需要在中国、沙特阿拉伯和欧盟扩展业务，涉及12个国家的53家供应商。

### 挑战
- 53家供应商、3个新司法管辖区、90天期限
- 人工评估：6个多月、50多万美元咨询费

### DJAC解决方案
1. **第1-2周**：注册全部53家供应商
2. **第2-3周**：为PIPL、PDPL、GDPR运行AI评估
3. **第3-4周**：跨框架差距分析——发现312个差距
4. **第4-8周**：整改规划器跟踪差距关闭
5. **第8-12周**：持续监控确认完全合规

### 成果
- ✅ 82天内完全合规（对比180天预估）
- ✅ 识别312个差距，60天内关闭298个
- ✅ 节省38万美元咨询费
- ✅ 持续监控成本降低70%
- ✅ 首次监管审计零发现`,
      },
      {
        id: "saas-startup",
        title: "SaaS初创公司快速合规",
        summary: "一家15人初创公司如何使用DJAC在30天内实现SOC 2和GDPR就绪。",
        content: `### 背景
一家拥有15名员工的A轮初创公司需要获得SOC 2 Type II和GDPR合规才能达成企业交易。

### 挑战
- 没有现有的合规计划
- 7家云供应商需要评估
- 合规预算每月5000美元

### DJAC解决方案
1. 团队入职，设置组织资料
2. 选择SOC 2 + GDPR及AI推荐的控制项
3. 注册全部7家供应商并运行评估
4. 从策略管理器生成政策模板
5. 在审计员审查期间持续检查

### 成果
- ✅ 28天内获得SOC 2 Type II
- ✅ 30天内建立GDPR计划
- ✅ 达成3笔企业交易（48万美元ARR）
- ✅ 持续合规成本低于每月250美元`,
      },
    ],
  },
];
