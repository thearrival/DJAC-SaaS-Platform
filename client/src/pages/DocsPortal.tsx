/**
 * DJAC Documentation Portal — comprehensive product documentation
 * with multilingual support (EN/AR/ZH), enhanced UI, admonitions,
 * table of contents, breadcrumbs, keyboard shortcuts, and hero landing.
 *
 * Route: /docs and /docs/:section/:page
 */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { useLocale } from "@/contexts/useLocale";
import { APP_LOCALES, LOCALE_LABELS } from "@/contexts/localeTypes";
import { useTheme } from "@/contexts/useTheme";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COVERAGE } from "../../../shared/coverage-claims";
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Building2,
  FileText,
  Gauge,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Network,
  Play,
  Terminal,
  Server,
  CreditCard,
  Code,
  Lock,
  Rocket,
  Key,
  Layers,
  Home,
  Copy,
  Check,
  Info,
  X,
  List,
  Hash,
  ArrowUp,
  Sparkles,
  Users,
  Clock,
  DollarSign,
  Brain,
  ThumbsUp,
  ThumbsDown,
  ChevronsUpDown,
  Link2,
  Printer,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";
import { docsAr } from "./docsAr";
import { docsZh } from "./docsZh";
import { docsData, type DocSection, type DocPage } from "./docsContent";

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────── */

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Icon Map
   ────────────────────────────────────────────────────────────────────────── */

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  zap: Zap,
  shield: Shield,
  chart: BarChart3,
  building: Building2,
  file: FileText,
  gauge: Gauge,
  globe: Globe,
  star: Star,
  terminal: Terminal,
  server: Server,
  card: CreditCard,
  code: Code,
  lock: Lock,
  rocket: Rocket,
  key: Key,
  layers: Layers,
  home: Home,
  brain: Brain,
  users: Users,
  clock: Clock,
  sparkles: Sparkles,
  dollar: DollarSign,
};

/* ──────────────────────────────────────────────────────────────────────────
   Home Page Feature Cards Data (trilingual)
   ────────────────────────────────────────────────────────────────────────── */

const HOME_FEATURES: Record<
  string,
  { icon: string; title: string; desc: string; link: string }[]
> = {
  en: [
    {
      icon: "zap",
      title: "AI Compliance Engine",
      desc: "8-stage DeepSeek assessment pipeline with RAG context retrieval",
      link: "/docs/ai-engine/ai-overview",
    },
    {
      icon: "shield",
      title: `${COVERAGE.jurisdictions} Jurisdictions`,
      desc: "PIPL, PDPL, GDPR, NCA-ECC, CSL, DSL and global standards",
      link: "/docs/frameworks/jurisdictions",
    },
    {
      icon: "building",
      title: "Vendor Risk",
      desc: "Automated third-party assessments across all frameworks",
      link: "/docs/vendor-risk/vendor-assessment",
    },
    {
      icon: "terminal",
      title: "API & Integration",
      desc: "200+ tRPC procedures with WebSocket streaming",
      link: "/docs/api-integration/api-reference",
    },
    {
      icon: "lock",
      title: "Security & RBAC",
      desc: "7 platform roles, 32 modules, 6 permission flags",
      link: "/docs/security-compliance/security-overview",
    },
    {
      icon: "code",
      title: "Developer Guide",
      desc: "Setup, architecture, testing, contributing",
      link: "/docs/developer-guide/dev-setup",
    },
  ],
  ar: [
    {
      icon: "zap",
      title: "محرك الامتثال الذكي",
      desc: "خط أنابيب تقييم DeepSeek من 8 مراحل مع استرجاع سياق RAG",
      link: "/docs/ai-engine/ai-overview",
    },
    {
      icon: "shield",
      title: `${COVERAGE.jurisdictions} ولاية قضائية`,
      desc: "PIPL وPDPL وGDPR وNCA-ECC وCSL وDSL والمعايير العالمية",
      link: "/docs/frameworks/jurisdictions",
    },
    {
      icon: "building",
      title: "مخاطر الموردين",
      desc: "تقييمات تلقائية للجهات الخارجية عبر جميع الأطر",
      link: "/docs/vendor-risk/vendor-assessment",
    },
    {
      icon: "terminal",
      title: "API والتكامل",
      desc: "أكثر من 200 إجراء tRPC مع بث WebSocket",
      link: "/docs/api-integration/api-reference",
    },
    {
      icon: "lock",
      title: "الأمان وRBAC",
      desc: "7 أدوار منصة و32 وحدة و6 أعلام صلاحيات",
      link: "/docs/security-compliance/security-overview",
    },
    {
      icon: "code",
      title: "دليل المطور",
      desc: "الإعداد والبنية والاختبار والمساهمة",
      link: "/docs/developer-guide/dev-setup",
    },
  ],
  zh: [
    {
      icon: "zap",
      title: "AI合规引擎",
      desc: "基于DeepSeek的8阶段评估流水线，带RAG上下文检索",
      link: "/docs/ai-engine/ai-overview",
    },
    {
      icon: "shield",
      title: `${COVERAGE.jurisdictions} 司法管辖区`,
      desc: "PIPL、PDPL、GDPR、NCA-ECC、CSL、DSL及全球标准",
      link: "/docs/frameworks/jurisdictions",
    },
    {
      icon: "building",
      title: "供应商风险",
      desc: "跨所有框架的自动第三方评估",
      link: "/docs/vendor-risk/vendor-assessment",
    },
    {
      icon: "terminal",
      title: "API与集成",
      desc: "200+个tRPC程序，支持WebSocket流式传输",
      link: "/docs/api-integration/api-reference",
    },
    {
      icon: "lock",
      title: "安全与RBAC",
      desc: "7个平台角色、32个模块、6个权限标志",
      link: "/docs/security-compliance/security-overview",
    },
    {
      icon: "code",
      title: "开发者指南",
      desc: "设置、架构、测试、贡献",
      link: "/docs/developer-guide/dev-setup",
    },
  ],
};

const QUICK_LINKS: Record<string, { label: string; path: string }[]> = {
  en: [
    { label: "Welcome & Overview", path: "/docs/getting-started/welcome" },
    { label: "Quick Start Guide", path: "/docs/getting-started/architecture" },
    { label: "API Reference", path: "/docs/api-integration/api-reference" },
    { label: "Pricing & Plans", path: "/docs/billing-plans/pricing-overview" },
    {
      label: "Security Overview",
      path: "/docs/security-compliance/security-overview",
    },
    {
      label: "Deployment Guide",
      path: "/docs/deployment-operations/deployment",
    },
  ],
  ar: [
    {
      label: "الترحيب والنظرة العامة",
      path: "/docs/getting-started/welcome",
    },
    {
      label: "دليل البدء السريع",
      path: "/docs/getting-started/architecture",
    },
    { label: "مرجع API", path: "/docs/api-integration/api-reference" },
    {
      label: "الأسعار والخطط",
      path: "/docs/billing-plans/pricing-overview",
    },
    {
      label: "نظرة عامة على الأمان",
      path: "/docs/security-compliance/security-overview",
    },
    {
      label: "دليل النشر",
      path: "/docs/deployment-operations/deployment",
    },
  ],
  zh: [
    { label: "欢迎与概述", path: "/docs/getting-started/welcome" },
    { label: "快速入门指南", path: "/docs/getting-started/architecture" },
    { label: "API参考", path: "/docs/api-integration/api-reference" },
    {
      label: "定价与计划",
      path: "/docs/billing-plans/pricing-overview",
    },
    {
      label: "安全概述",
      path: "/docs/security-compliance/security-overview",
    },
    { label: "部署指南", path: "/docs/deployment-operations/deployment" },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   Related Pages Map — cross-discovery at bottom of each page.
   Titles resolve from the CURRENT locale's data (auto-localized).
   ────────────────────────────────────────────────────────────────────────── */

const RELATED_PAGE_IDS: Record<string, string[]> = {
  welcome: ["architecture", "ai-overview", "pricing-overview"],
  architecture: ["welcome", "dev-setup", "deployment"],
  "ai-overview": ["rag-system", "vendor-assessment", "websocket"],
  "vendor-assessment": ["ai-overview", "supplier-profiles", "risk-register"],
  "security-overview": ["rbac-system", "pipl-guide"],
  "dev-setup": ["architecture", "adding-features", "monitoring"],
  deployment: ["monitoring", "troubleshooting", "pricing-overview"],
  "pricing-overview": ["subscription-management", "welcome", "deployment"],
};

/* ──────────────────────────────────────────────────────────────────────────
   UI Chrome Strings (trilingual) — hero, sidebar, action bar, palette, etc.
   ────────────────────────────────────────────────────────────────────────── */

const DOCS_UI: Record<string, Record<string, string>> = {
  en: {
    docs_title: "Documentation",
    hero_title: "DJAC Documentation",
    hero_sub:
      "Everything you need to deploy, configure, and master the DJAC compliance intelligence platform. From quick-start guides to deep API references and security architecture.",
    stat_sections: "Sections",
    stat_pages: "Pages",
    stat_languages: "Languages",
    stat_api: "API Procedures",
    get_started: "Get Started",
    api_reference: "API Reference",
    quick_links: "Quick Links",
    guided_title: "New to DJAC? Start here",
    guided_1_title: "Read the Welcome Guide",
    guided_1_desc: "What DJAC does and who it's for — 2 min read",
    guided_2_title: "Explore the AI Engine",
    guided_2_desc: "How the 8-stage compliance pipeline works — 3 min read",
    guided_3_title: "Try a Vendor Assessment",
    guided_3_desc: "Step-by-step guide to run your first compliance check",
    no_results: "No results found",
    try_different: "Try different keywords or browse the sections",
    clear_search: "Clear search",
    expand_all: "Expand all",
    collapse_all: "Collapse all",
    min_read: "min read",
    copy_link: "Copy link",
    link_copied: "Link copied",
    print_page: "Print page",
    shortcuts: "Shortcuts",
    sh_focus: "Focus search",
    sh_prev: "Next / previous page",
    sh_close: "Close menus & search",
    sh_jump: "Jump to section",
    on_this_page: "On this page",
    back_to_top: "Back to top",
    previous: "Previous",
    next: "Next",
    helpful: "Was this page helpful?",
    thanks_up: "Thanks for your feedback!",
    thanks_down: "Thanks! We'll improve this page.",
    related: "Related pages",
    docs: "Docs",
    palette_placeholder: "Jump to a page…",
    palette_empty: "No pages match “{q}”",
    palette_navigate: "navigate",
    palette_open: "open",
    palette_close: "close",
    admon_tip: "Tip",
    admon_info: "Info",
    admon_warning: "Warning",
    admon_danger: "Danger",
    admon_note: "Note",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_switch_dark: "Switch to dark theme",
    theme_switch_light: "Switch to light theme",
    lang_aria: "Documentation language",
    aria_copy: "Copy link to this page",
    aria_backtop: "Back to top",
    aria_helpful: "Yes, this page was helpful",
    aria_unhelpful: "No, this page needs improvement",
    aria_search: "Search documentation",
    sidebar_title: "Documentation",
    search_placeholder: "Search docs...",
    mobile_menu: "Documentation Menu",
    close_menu: "Close Menu",
    cta_ready: "Ready to get started?",
    cta_trial: "Start Free Trial",
    cta_pricing: "View Pricing",
    cta_guide: "Quick Start Guide",
    architecture_diagram: "Architecture Diagram",
    case_study: "Case Study",
    challenge: "Challenge",
    solution: "Solution",
    results: "Results",
    demo_guide: "Interactive Demo Guide",
    best_practices: "Best Practices",
    troubleshooting: "Troubleshooting",
    q: "Q",
    a: "A",
  },
  ar: {
    docs_title: "التوثيق",
    hero_title: "وثائق DJAC",
    hero_sub:
      "كل ما تحتاجه لنشر وتهيئة وإتقان منصة DJAC لذكاء الامتثال — من أدلة البدء السريع إلى مراجع API المتعمقة ومعمارية الأمان.",
    stat_sections: "أقسام",
    stat_pages: "صفحات",
    stat_languages: "لغات",
    stat_api: "إجراءات API",
    get_started: "ابدأ الآن",
    api_reference: "مرجع API",
    quick_links: "روابط سريعة",
    guided_title: "جديد على DJAC؟ ابدأ من هنا",
    guided_1_title: "اقرأ دليل الترحيب",
    guided_1_desc: "ما هي DJAC ولمن هي — قراءة دقيقتين",
    guided_2_title: "استكشف محرك الذكاء الاصطناعي",
    guided_2_desc: "كيف يعمل خط أنابيب الامتثال ذو 8 مراحل — قراءة 3 دقائق",
    guided_3_title: "جرّب تقييم مورد",
    guided_3_desc: "دليل خطوة بخطوة لتشغيل أول فحص امتثال",
    no_results: "لا توجد نتائج",
    try_different: "جرّب كلمات مفتاحية أخرى أو تصفح الأقسام",
    clear_search: "مسح البحث",
    expand_all: "توسيع الكل",
    collapse_all: "طي الكل",
    min_read: "دقائق قراءة",
    copy_link: "نسخ الرابط",
    link_copied: "تم نسخ الرابط",
    print_page: "طباعة الصفحة",
    shortcuts: "اختصارات",
    sh_focus: "تركيز البحث",
    sh_prev: "التالي / السابق",
    sh_close: "إغلاق القوائم والبحث",
    sh_jump: "الانتقال إلى قسم",
    on_this_page: "في هذه الصفحة",
    back_to_top: "العودة للأعلى",
    previous: "السابق",
    next: "التالي",
    helpful: "هل كانت هذه الصفحة مفيدة؟",
    thanks_up: "شكراً لملاحظاتك!",
    thanks_down: "شكراً! سنحسّن هذه الصفحة.",
    related: "صفحات ذات صلة",
    docs: "الوثائق",
    palette_placeholder: "انتقل إلى صفحة…",
    palette_empty: "لا توجد صفحات تطابق «{q}»",
    palette_navigate: "تنقل",
    palette_open: "فتح",
    palette_close: "إغلاق",
    admon_tip: "نصيحة",
    admon_info: "معلومة",
    admon_warning: "تحذير",
    admon_danger: "خطر",
    admon_note: "ملاحظة",
    theme_light: "فاتح",
    theme_dark: "داكن",
    theme_switch_dark: "التبديل إلى الوضع الداكن",
    theme_switch_light: "التبديل إلى الوضع الفاتح",
    lang_aria: "لغة التوثيق",
    aria_copy: "نسخ رابط هذه الصفحة",
    aria_backtop: "العودة للأعلى",
    aria_helpful: "نعم، كانت هذه الصفحة مفيدة",
    aria_unhelpful: "لا، تحتاج هذه الصفحة إلى تحسين",
    aria_search: "البحث في التوثيق",
    sidebar_title: "التوثيق",
    search_placeholder: "ابحث في الوثائق...",
    mobile_menu: "قائمة التوثيق",
    close_menu: "إغلاق القائمة",
    cta_ready: "جاهز للبدء؟",
    cta_trial: "ابدأ تجربة مجانية",
    cta_pricing: "عرض الأسعار",
    cta_guide: "دليل البدء السريع",
    architecture_diagram: "مخطط المعمارية",
    case_study: "دراسة حالة",
    challenge: "التحدي",
    solution: "الحل",
    results: "النتائج",
    demo_guide: "دليل العرض التفاعلي",
    best_practices: "أفضل الممارسات",
    troubleshooting: "استكشاف الأخطاء",
    q: "س",
    a: "ج",
  },
  zh: {
    docs_title: "文档",
    hero_title: "DJAC 文档",
    hero_sub:
      "部署、配置并掌握 DJAC 合规智能平台所需的一切 —— 从快速入门指南到深度 API 参考和安全架构。",
    stat_sections: "章节",
    stat_pages: "页面",
    stat_languages: "语言",
    stat_api: "API 程序",
    get_started: "开始使用",
    api_reference: "API 参考",
    quick_links: "快速链接",
    guided_title: "DJAC 新手？从这里开始",
    guided_1_title: "阅读欢迎指南",
    guided_1_desc: "DJAC 是什么、适合谁 —— 2 分钟阅读",
    guided_2_title: "探索 AI 引擎",
    guided_2_desc: "8 阶段合规流水线的工作原理 —— 3 分钟阅读",
    guided_3_title: "尝试供应商评估",
    guided_3_desc: "运行首次合规检查的分步指南",
    no_results: "未找到结果",
    try_different: "尝试其他关键词或浏览章节",
    clear_search: "清除搜索",
    expand_all: "全部展开",
    collapse_all: "全部折叠",
    min_read: "分钟阅读",
    copy_link: "复制链接",
    link_copied: "链接已复制",
    print_page: "打印页面",
    shortcuts: "快捷键",
    sh_focus: "聚焦搜索",
    sh_prev: "下一页 / 上一页",
    sh_close: "关闭菜单和搜索",
    sh_jump: "跳转到章节",
    on_this_page: "本页目录",
    back_to_top: "返回顶部",
    previous: "上一页",
    next: "下一页",
    helpful: "此页面有帮助吗？",
    thanks_up: "感谢您的反馈！",
    thanks_down: "谢谢！我们将改进此页面。",
    related: "相关页面",
    docs: "文档",
    palette_placeholder: "跳转到页面…",
    palette_empty: "没有匹配「{q}」的页面",
    palette_navigate: "导航",
    palette_open: "打开",
    palette_close: "关闭",
    admon_tip: "提示",
    admon_info: "信息",
    admon_warning: "警告",
    admon_danger: "危险",
    admon_note: "注意",
    theme_light: "浅色",
    theme_dark: "深色",
    theme_switch_dark: "切换到深色主题",
    theme_switch_light: "切换到浅色主题",
    lang_aria: "文档语言",
    aria_copy: "复制此页面的链接",
    aria_backtop: "返回顶部",
    aria_helpful: "是，此页面有帮助",
    aria_unhelpful: "否，此页面需要改进",
    aria_search: "搜索文档",
    sidebar_title: "文档",
    search_placeholder: "搜索文档...",
    mobile_menu: "文档菜单",
    close_menu: "关闭菜单",
    cta_ready: "准备好开始了吗？",
    cta_trial: "开始免费试用",
    cta_pricing: "查看定价",
    cta_guide: "快速入门指南",
    architecture_diagram: "架构图",
    case_study: "案例研究",
    challenge: "挑战",
    solution: "解决方案",
    results: "成果",
    demo_guide: "交互式演示指南",
    best_practices: "最佳实践",
    troubleshooting: "问题排查",
    q: "问",
    a: "答",
  },
};

/* ──────────────────────────────────────────────────────────────────────────
   Multi-language Doc Data
   ────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────
   Arabic (ar) Data — Key sections translated
   ────────────────────────────────────────────────────────────────────────── */

docsData.ar = [
  {
    id: "getting-started",
    title: "البدء",
    icon: "book",
    pages: [
      {
        id: "welcome",
        title: "مرحباً بك في DJAC",
        summary: `DJAC هي أول منصة ذكاء امتثال تنظيمي مدعومة بالذكاء الاصطناعي عبر ${COVERAGE.jurisdictions} ولاية قضائية.`,
        content: `### ما هو DJAC؟
DJAC (الامتثال القانوني الآلي) هي منصة SaaS مؤسسية تعمل على أتمتة الامتثال التنظيمي عبر الصين والسعودية ودول الخليج والاتحاد الأوروبي وأمريكا الشمالية وآسيا والمحيط الهادئ.

### لماذا DJAC؟
- **${COVERAGE.jurisdictions} ولاية قضائية** — PIPL، PDPL، CSL، DSL، GDPR، ISO 27001، SOC 2 وغيرها
- **تحليل بالذكاء الاصطناعي** — تقييم امتثال من 8 مراحل مدعوم بـ DeepSeek
- **مراقبة مستمرة** — تتبع الامتثال مع اكتشاف الفجوات تلقائياً
- **ذكاء عابر للحدود** — فحص نقل البيانات ومراقبة التغييرات التنظيمية
- **إدارة مخاطر الموردين** — تقييمات تلقائية عبر جميع الأطر
- **أمان مؤسسي** — تشفير AES-256، RBAC، سجلات التدقيق

### البدء السريع (5 دقائق)
1. **إنشاء مؤسستك** — إعداد ملف الشركة والفوترة
2. **اختيار الولايات القضائية** — الصين، السعودية، الاتحاد الأوروبي أو أي مزيج
3. **اختيار الأطر** — الذكاء الاصطناعي يوصي باللوائح المناسبة
4. **تسجيل مورد** — أضف أول مورد خارجي
5. **تشغيل التقييم** — تقرير امتثال كامل في أقل من 60 ثانية

> **faq** كم يستغرق تقييم المورد بالذكاء الاصطناعي؟
> **answer** تكتمل معظم التقييمات في أقل من 60 ثانية، مع بث التقدم مباشرة عبر WebSocket أثناء إنهاء كل مرحلة من مراحل خط الأنابيب الثماني.
> **faq** ما هي اللوائح المدعومة افتراضياً؟
> **answer** ${COVERAGE.controlFrameworks} إطاراً عبر ${COVERAGE.jurisdictions} ولاية قضائية — بما في ذلك GDPR وNIS2 وDORA وPIPL وPDPL وISO 27001 وSOC 2 وغيرها. يوصي محرك الذكاء الاصطناعي تلقائياً بالأطر ذات الصلة بملفك.
> **faq** هل يمكن تشغيل DJAC على بنيتنا التحتية الخاصة؟
> **answer** نعم — بالإضافة إلى الاستضافة السحابية على Vercel، يتم دعم النشر الذاتي عبر Docker مع إمكانية توسيع المنصة بأطر مخصصة.`,
      },
      {
        id: "architecture",
        title: "معمارية المنصة",
        summary:
          "تعمل DJAC على معمارية سحابية أصلية مع React 19 و Express + tRPC و PostgreSQL على Supabase.",
        content: `### معمارية النظام
**الواجهة**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
**الخادم**: Express 4 + tRPC 11 (200+ إجراء API)
**قاعدة البيانات**: PostgreSQL 17 على Supabase
**محرك AI**: Google DeepSeek مع 8 مراحل تقييم
**المصادقة**: ثلاثي المسار (Clerk OAuth + Supabase Auth + JWT محلي)
**الفوترة**: Stripe (5 خطط × 4 فترات)
**الاستضافة**: Vercel (بدون خادم) + Docker`,
      },
    ],
  },
  {
    id: "ai-engine",
    title: "محرك الامتثال الذكي",
    icon: "zap",
    pages: [
      {
        id: "ai-overview",
        title: "نظرة عامة على محرك AI",
        summary:
          "يستخدم خط أنابيب AI المكون من 8 مراحل DeepSeek لتقييم امتثال الموردين عبر أطر متعددة في وقت واحد.",
        content: `### خط الأنابيب ذو 8 مراحل
1. **البواب** — التحقق من المدخلات، كشف الحقن
2. **الاستيعاب** — تحليل المستندات، تطبيع النص
3. **المستخرج** — استخراج الحقائق المنظمة
4. **سياق RAG** — استرجاع ضوابط الامتثال ذات الصلة
5. **الحكم (DeepSeek)** — تقييم الحقائق مقابل الضوابط
6. **المركب** — دمج النتائج عبر الأطر
7. **المدقق** — التحقق من اتساق المخطط
8. **المراسل** — إخراج نهائي (PDF/DOCX/JSON)`,
      },
    ],
  },
  {
    id: "frameworks",
    title: "أطر الامتثال",
    icon: "shield",
    pages: [
      {
        id: "jurisdictions",
        title: "الولايات القضائية المدعومة",
        summary: `تغطي DJAC ${COVERAGE.jurisdictions} ولاية قضائية عبر آسيا والمحيط الهادئ وأوروبا والشرق الأوسط وأمريكا الشمالية وأفريقيا.`,
        content: `### منطقة آسيا والمحيط الهادئ
- **الصين** — PIPL، CSL، DSL، MLPS 2.0
- **اليابان** — APPI
- **كوريا الجنوبية** — PIPA
- **سنغافورة** — PDPA
- **الهند** — DPDP Act
- **أستراليا** — Privacy Act 1988

### الشرق الأوسط / الخليج
- **السعودية** — PDPL، NCA ECC / CSCC / OCC
- **الإمارات** — UAE PDPL
- **قطر** — Qatar PDPPL
- **البحرين** — Bahrain PDPL
- **الكويت** — Kuwait DPA

### أوروبا
- **الاتحاد الأوروبي** — GDPR، NIS2، DORA
- **المملكة المتحدة** — UK GDPR / DPA 2018

### أمريكا الشمالية
- **الولايات المتحدة** — HIPAA، CCPA/CPRA، SOX، PCI DSS
- **كندا** — PIPEDA`,
      },
    ],
  },
  {
    id: "security-compliance",
    title: "الأمان والامتثال",
    icon: "lock",
    pages: [
      {
        id: "security-overview",
        title: "معمارية الأمان",
        summary:
          "تطبق DJAC دفاعاً متعدد الطبقات عبر المصادقة والترخيص وحماية البيانات والبنية التحتية.",
        content: `### دفاع متعدد الطبقات
**المصادقة:**
- كلمات مرور مشفرة بـ bcrypt (12 جولة)
- رموز JWT موقعة بـ HS256
- ملفات تعريف HTTP-only، Secure، SameSite
- TOTP MFA مع رموز احتياطية
- إعادة تعيين كلمة المرور بـ OTP (SHA-256، صلاحية 5 دقائق)

**الترخيص:**
- 7 أدوار منصة + 4 أدوار مؤسسة
- 32 وحدة بصلاحيات محددة
- أمان مستوى الصف على جميع جداول PostgreSQL

**حماية البيانات:**
- TLS 1.3 للنقل
- تشفير AES-256 في السكون
- الأسرار في Vercel + GitHub Actions`,
      },
    ],
  },
  {
    id: "developer-guide",
    title: "دليل المطور",
    icon: "code",
    pages: [
      {
        id: "dev-setup",
        title: "إعداد بيئة التطوير",
        summary:
          "إعداد بيئتك المحلية مع Node.js 20+ و pnpm 10+ و Docker لـ Supabase.",
        content: `### المتطلبات الأساسية
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop
- Supabase CLI

### الإعداد الأولي
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
\`\`\`

### تجاوز المصادقة للتطوير
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\``,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "الفوترة والخطط",
    icon: "card",
    pages: [
      {
        id: "pricing-overview",
        title: "نظرة عامة على الأسعار",
        summary:
          "خطط اشتراك مرنة للفرق من جميع الأحجام — من الشركات الناشئة إلى المؤسسات العالمية.",
        content: `### مقارنة الخطط
| الميزة | تجربة مجانية | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| الولايات القضائية | 1 | 3 | 10 | غير محدود |
| الموردين | 5 | 25 | 100 | غير محدود |
| تقييمات AI/شهر | 3 | 20 | 100 | مخصص |
| أعضاء الفريق | 2 | 10 | 50 | غير محدود |
| وصول API | — | — | ✓ | ✓ |
| دعم متميز | — | — | ✓ | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### تجربة مجانية
- 14 يوماً على خطة Starter
- لا حاجة لبطاقة ائتمان
- وصول كامل لجميع ميزات Starter`,
      },
    ],
  },
  {
    id: "vendor-risk",
    title: "إدارة مخاطر الموردين",
    icon: "building",
    pages: [
      {
        id: "vendor-assessment",
        title: "تقييم امتثال الموردين",
        summary:
          "تقييم تلقائي لامتثال الموردين الخارجيين عبر جميع الأطر المختارة.",
        content: `### تقييم تلقائي للموردين
1. **تسجيل المورد** — إضافة الاسم والصناعة والولاية القضائية
2. **اختيار الأطر** — اختيار الأطر التنظيمية المطبقة
3. **تحميل الأدلة** — إرفاق السياسات والشهادات
4. **تشغيل التقييم** — تحليل AI عبر جميع الأطر
5. **مراجعة النتائج** — تحليل مفصل للفجوات مع تقييم المخاطر (0-100)
6. **تصدير التقرير** — تقرير PDF/DOCX احترافي`,
      },
    ],
  },
  {
    id: "api-integration",
    title: "الواجهة البرمجية والتكامل",
    icon: "terminal",
    pages: [
      {
        id: "api-reference",
        title: "مرجع API",
        summary: "توفر DJAC واجهة برمجية آمنة مع 200+ إجراء عبر 42 موجه.",
        content: `### نظرة عامة على API\nتستخدم DJAC **tRPC** لعمليات API الآمنة.\n\n**طرق المصادقة:**\n| الطريقة | الاستخدام |\n|---------|----------|\n| ملف تعريف الجلسة | تطبيق الويب |\n| مفتاح API | الوصول البرمجي |\n| Clerk OAuth | OAuth خارجي |`,
      },
    ],
  },
  {
    id: "deployment-operations",
    title: "النشر والعمليات",
    icon: "server",
    pages: [
      {
        id: "deployment",
        title: "خيارات النشر",
        summary: "تدعم DJAC النشر على Vercel و Docker و VPS مع خطوط CI/CD.",
        content:
          "### نشر Vercel\n```bash\npnpm build && vercel --prod\nsupabase db push --linked\nsupabase functions deploy\n```\n\n### نشر Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production djac:latest\n```",
      },
    ],
  },
  {
    id: "operations",
    title: "العمليات السيبرانية",
    icon: "gauge",
    pages: [
      {
        id: "risk-register",
        title: "سجل المخاطر",
        summary: "إدارة مركزية للمخاطر مع تقييم تلقائي للشدة وتخطيط المعالجة.",
        content:
          "### سير إدارة المخاطر\n1. **تحديد** — تسجيل المخاطر مع الفئة والاحتمالية/التأثير\n2. **تقييم** — تقييم تلقائي (الاحتمالية × التأثير)\n3. **معالجة** — قبول، تخفيف، نقل، أو تجنب\n4. **ربط** — ربط المخاطر بالموردين والأطر",
      },
    ],
  },
  {
    id: "case-studies",
    title: "دراسات الحالة",
    icon: "star",
    pages: [
      {
        id: "enterprise-expansion",
        title: "توسع مؤسسي عبر الحدود",
        summary:
          "كيف استخدمت شركة عالمية DJAC للامتثال في الصين والسعودية والاتحاد الأوروبي.",
        content:
          "### النتائج\n- امتثال كامل في 82 يوماً\n- توفير 380 ألف دولار\n- تقليل تكاليف المراقبة 70%",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Chinese (zh) Data — Key sections translated
   ────────────────────────────────────────────────────────────────────────── */

docsData.zh = [
  {
    id: "getting-started",
    title: "入门指南",
    icon: "book",
    pages: [
      {
        id: "welcome",
        title: "欢迎使用 DJAC",
        summary:
          "DJAC 是全球首个AI驱动的跨司法管辖区合规智能平台，覆盖28个司法管辖区。",
        content: `### 什么是 DJAC？
DJAC（法定自动化合规）是一个企业级SaaS平台，可自动化处理中国、沙特、海湾合作委员会、欧盟、北美和亚太地区的监管合规。

### 为什么选择 DJAC？
- **${COVERAGE.jurisdictions} 司法管辖区** — PIPL、PDPL、CSL、DSL、GDPR、ISO 27001、SOC 2等
- **AI驱动分析** — DeepSeek驱动的8阶段合规评估流程
- **实时监控** — 持续合规跟踪，自动检测差距
- **跨境智能** — 数据传输合规检查器和监管变化监控
- **供应商风险管理** — 跨所有选定框架的自动第三方评估
- **企业级安全** — AES-256加密、RBAC、审计跟踪、SOC 2就绪

### 快速开始（5分钟）
1. **创建您的组织** — 设置公司资料和账单
2. **选择司法管辖区** — 中国、沙特、欧盟或任意组合
3. **选择框架** — AI自动推荐相关法规
4. **注册供应商** — 添加您的第一个第三方供应商
5. **运行评估** — AI在60秒内生成完整的合规报告

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
          "DJAC在云原生架构上运行，使用React 19、Express + tRPC、PostgreSQL（Supabase）、Redis和Google DeepSeek。",
        content: `### 系统架构
**前端**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
**后端**: Express 4 + tRPC 11（200+ API程序）
**数据库**: PostgreSQL 17 on Supabase
**AI引擎**: Google DeepSeek，8阶段评估流程
**身份验证**: 三路径（Clerk OAuth + Supabase Auth + 本地JWT）
**计费**: Stripe（5个计划 × 4个周期）
**托管**: Vercel（无服务器）+ Docker`,
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
          "DJAC的8阶段AI流程使用DeepSeek同时评估多个框架的供应商合规性。",
        content: `### 8阶段流程
1. **守门人** — 输入验证、注入检测
2. **摄入** — 文档解析、文本规范化
3. **提取器** — 结构化事实提取
4. **RAG上下文** — 检索增强生成：从PostgreSQL提取相关合规控制
5. **法官（DeepSeek）** — 评估事实与适用控制要求
6. **合成器** — 合并发现结果，生成跨框架比较
7. **验证器** — 模式验证、跨字段一致性
8. **报告器** — 最终格式化输出（PDF/DOCX/JSON）`,
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
          "DJAC覆盖亚太、欧洲、中东、北美和非洲28个司法管辖区的综合监管框架。",
        content: `### 亚太地区
- **中国** — PIPL、CSL、DSL、MLPS 2.0
- **日本** — APPI
- **韩国** — PIPA
- **新加坡** — PDPA
- **印度** — DPDP Act
- **澳大利亚** — Privacy Act 1988

### 中东/海湾地区
- **沙特阿拉伯** — PDPL、NCA ECC / CSCC / OCC
- **阿联酋** — UAE PDPL
- **卡塔尔** — Qatar PDPPL
- **巴林** — Bahrain PDPL
- **科威特** — Kuwait DPA

### 欧洲
- **欧盟/欧洲经济区** — GDPR、NIS2、DORA
- **英国** — UK GDPR / DPA 2018

### 北美
- **美国** — HIPAA、CCPA/CPRA、SOX、PCI DSS
- **加拿大** — PIPEDA`,
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
          "DJAC实施深度防御，覆盖身份验证、授权、数据保护和基础设施层面。",
        content: `### 深度防御
**身份验证：**
- bcrypt密码哈希（12轮）
- HS256签名的JWT令牌
- HTTP-only、Secure、SameSite Cookies
- 基于TOTP的MFA及备份码
- 基于OTP的密码重置（SHA-256，5分钟有效期）

**授权：**
- 7个平台角色 + 4个组织角色
- 32个权限控制模块
- 所有PostgreSQL表的行级安全

**数据保护：**
- 传输中TLS 1.3
- 静态AES-256加密
- 密钥存储于Vercel + GitHub Actions`,
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
          "使用Node.js 20+、pnpm 10+、Docker for Supabase设置本地开发环境。",
        content: `### 前提条件
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop
- Supabase CLI

### 首次设置
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
\`\`\`

### 开发认证绕过
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\``,
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
        title: "定价概览",
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

### 免费试用
- Starter计划14天免费试用
- 无需信用卡
- 完整访问所有Starter功能`,
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
        summary: "跨所有选定框架自动进行第三方供应商合规评估。",
        content:
          "### 自动供应商评估\n1. **注册供应商** — 添加名称、行业、司法管辖区\n2. **选择框架** — 选择适用的监管框架\n3. **上传证据** — 附加供应商政策、认证\n4. **运行评估** — AI跨所有框架分析\n5. **查看结果** — 详细差距分析及风险评分（0-100）\n6. **导出报告** — 专业PDF/DOCX报告",
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
        summary: "DJAC通过42个路由器提供200+个类型安全的tRPC API程序。",
        content:
          "### API概述\nDJAC使用**tRPC**实现端到端类型安全的API操作。\n\n**认证方法：**\n| 方法 | 用例 |\n|--------|----------|\n| 会话Cookie | Web应用 |\n| API密钥 | 编程访问 |\n| Clerk OAuth | 外部OAuth |",
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
        summary: "DJAC支持Vercel、Docker和VPS部署。",
        content:
          "### Vercel\n```bash\npnpm build && vercel --prod\nsupabase db push --linked\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production djac:latest\n```",
      },
    ],
  },
  {
    id: "operations",
    title: "网络运营",
    icon: "gauge",
    pages: [
      {
        id: "risk-register",
        title: "风险登记册",
        summary: "集中风险管理，自动严重性评分和处理计划。",
        content:
          "### 风险管理流程\n1. **识别** — 记录风险\n2. **评估** — 自动评分\n3. **处理** — 接受、缓解、转移或避免\n4. **关联** — 关联供应商和框架",
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
        title: "企业跨境扩展案例",
        summary: "全球制造商使用DJAC在中国、沙特和欧盟实现合规。",
        content:
          "### 成果\n- 82天实现完全合规\n- 节省38万美元\n- 监控成本降低70%",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Complete AR/ZH data (11 sections, 24 pages each) — docsAr.ts / docsZh.ts.
   Overrides the legacy partial inline blocks above.
   ────────────────────────────────────────────────────────────────────────── */

docsData.ar = docsAr;
docsData.zh = docsZh;

/* ──────────────────────────────────────────────────────────────────────────
   Helper: Extract TOC from content
   ────────────────────────────────────────────────────────────────────────── */

function extractToc(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const h3 = line.match(/^### (.+)/);
    const h4 = line.match(/^#### (.+)/);
    if (h3)
      entries.push({
        level: 3,
        text: h3[1],
        id: h3[1]
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
          .replace(/^-|-$/g, ""),
      });
    else if (h4)
      entries.push({
        level: 4,
        text: h4[1],
        id: h4[1]
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
          .replace(/^-|-$/g, ""),
      });
  }
  return entries;
}

function getDocSections(locale: string): DocSection[] {
  const data = docsData[locale];
  return data && data.length > 0 ? data : docsData.en;
}

/* ──────────────────────────────────────────────────────────────────────────
   Search helpers: highlight matched text + content snippet
   ────────────────────────────────────────────────────────────────────────── */

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="djac-docs-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function contentSnippet(content: string, query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 35);
  const end = Math.min(content.length, idx + q.length + 55);
  return `${start > 0 ? "…" : ""}${content
    .slice(start, end)
    .replace(/\s+/g, " ")}${end < content.length ? "…" : ""}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: SidebarPageRow — shared page link with search highlights
   ────────────────────────────────────────────────────────────────────────── */

function SidebarPageRow({
  page,
  query,
  active,
  onClick,
}: {
  page: DocPage;
  query: string;
  active: boolean;
  onClick: () => void;
}) {
  const titleMatches = query && page.title.toLowerCase().includes(query);
  const summaryMatches =
    query && !titleMatches && page.summary.toLowerCase().includes(query);
  const snippet = contentSnippet(page.content, query);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`djac-docs-page-btn ${active ? "djac-docs-page-active" : ""}`}
    >
      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
      <div className="min-w-0 flex-1">
        <span className="truncate text-xs block">
          {highlightMatch(page.title, query)}
        </span>
        {query && (titleMatches || summaryMatches || snippet) && (
          <span className="block truncate text-[10px] text-muted-foreground/80">
            {snippet || page.summary}
          </span>
        )}
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Glossary — hover tooltips on technical terms (trilingual)
   ────────────────────────────────────────────────────────────────────────── */

const GLOSSARY: Record<string, { en: string; ar: string; zh: string }> = {
  tRPC: {
    en: "Type-safe RPC framework — API calls are fully typed end-to-end (used for DJAC's 200+ API procedures).",
    ar: "إطار RPC آمن الأنواع — استدعاءات API مكتوبة بالكامل من طرف إلى طرف (200+ إجراء في DJAC).",
    zh: "类型安全RPC框架 — API调用端到端完全类型化（DJAC 200+个API程序）。",
  },
  RAG: {
    en: "Retrieval-Augmented Generation — retrieves relevant compliance controls before evaluating or answering.",
    ar: "التوليد المعزز بالاسترجاع — استرجاع ضوابط الامتثال ذات الصلة قبل التقييم أو الإجابة.",
    zh: "检索增强生成 — 在评估或回答前先检索相关合规控制项。",
  },
  RBAC: {
    en: "Role-Based Access Control — permissions are granted by role instead of per user.",
    ar: "التحكم في الوصول القائم على الأدوار — صلاحيات حسب الدور بدلاً من المستخدم.",
    zh: "基于角色的访问控制 — 按角色而非按用户授权。",
  },
  JWT: {
    en: "JSON Web Token — a signed token used for stateless authentication sessions.",
    ar: "رمز ويب JSON — رمز موقّع لجلسات مصادقة بدون حالة.",
    zh: "JSON Web令牌 — 用于无状态认证会话的签名令牌。",
  },
  MFA: {
    en: "Multi-Factor Authentication — requires two or more proof factors when signing in.",
    ar: "المصادقة متعددة العوامل — تتطلب عاملين أو أكثر عند تسجيل الدخول.",
    zh: "多因素认证 — 登录需要两个或更多验证因素。",
  },
  TOTP: {
    en: "Time-based One-Time Password — 6-digit codes that rotate every 30 seconds.",
    ar: "كلمة مرور لمرة واحدة زمنية — رموز من 6 أرقام تتغير كل 30 ثانية.",
    zh: "基于时间的动态口令 — 每30秒轮换的6位验证码。",
  },
  RLS: {
    en: "Row-Level Security — the database enforces that queries only see authorized rows (tenant isolation).",
    ar: "أمان مستوى الصفوف — قاعدة البيانات تمنع الوصول لصفوف غير مصرح بها (عزل المستأجرين).",
    zh: "行级安全 — 数据库只允许查询授权的行（多租户隔离）。",
  },
  OAuth: {
    en: "Open Authorization — a delegated login protocol (e.g., sign in with Google).",
    ar: "التفويض المفتوح — بروتوكول تسجيل دخول مفوض (مثل الدخول بحساب Google).",
    zh: "开放授权 — 委托登录协议（例如使用Google登录）。",
  },
  webhook: {
    en: "HTTP callback — the platform calls your URL when events happen (e.g., assessment complete).",
    ar: "رد اتصال HTTP — المنصة تستدعي عنوانك عند حدوث أحداث (مثل اكتمال التقييم).",
    zh: "HTTP回调 — 平台在事件发生时调用您的URL（如评估完成）。",
  },
  Zod: {
    en: "Schema validation library — guarantees pipeline outputs match the expected shape.",
    ar: "مكتبة التحقق من المخططات — تضمن تطابق مخرجات خط الأنابيب مع الشكل المتوقع.",
    zh: "模式验证库 — 确保流水线输出符合预期结构。",
  },
  Redis: {
    en: "In-memory data store — used for job queues, rate limiting, and caching.",
    ar: "مخزن بيانات في الذاكرة — يستخدم للطوابير وتحديد المعدل والتخزين المؤقت.",
    zh: "内存数据存储 — 用于队列、限流和缓存。",
  },
  BullMQ: {
    en: "Redis-backed job queue — processes AI assessment jobs reliably.",
    ar: "طابور مهام يعتمد على Redis — يعالج مهام تقييم AI بشكل موثوق.",
    zh: "基于Redis的任务队列 — 可靠地处理AI评估任务。",
  },
  Supabase: {
    en: "Managed Postgres + Auth platform — hosts DJAC's database with RLS and backups.",
    ar: "منصة Postgres مُدارة — تستضيف قاعدة بيانات DJAC مع RLS والنسخ الاحتياطي.",
    zh: "托管的Postgres+认证平台 — 托管DJAC数据库，支持RLS和备份。",
  },
  PostgreSQL: {
    en: "Open-source relational database — DJAC's primary data store.",
    ar: "قاعدة بيانات علائقية مفتوحة المصدر — مخزن البيانات الرئيسي لـ DJAC.",
    zh: "开源关系型数据库 — DJAC的主要数据存储。",
  },
  Stripe: {
    en: "Payment platform — handles subscriptions, checkout, and billing events.",
    ar: "منصة دفع — تدير الاشتراكات والدفع وأحداث الفوترة.",
    zh: "支付平台 — 处理订阅、结账和账单事件。",
  },
  Vercel: {
    en: "Serverless hosting platform — deploys DJAC's frontend and API.",
    ar: "منصة استضافة بدون خادم — تنشر واجهة DJAC وواجهة API.",
    zh: "无服务器托管平台 — 部署DJAC前端和API。",
  },
};

const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort(
  (a, b) => b.length - a.length
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function glossifyText(text: string, locale: string): React.ReactNode[] {
  if (!GLOSSARY_TERMS.length || !text) return [text];
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${GLOSSARY_TERMS.map(escapeRegExp).join("|")})(?=[^\\p{L}\\p{N}]|$)`,
    "giu"
  );
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[1]) nodes.push(m[1]);
    const term = m[2];
    const def =
      GLOSSARY[term]?.[locale as "en" | "ar" | "zh"] ||
      GLOSSARY[term]?.en ||
      "";
    nodes.push(
      <span
        key={`t-${m.index}`}
        className="djac-docs-term"
        tabIndex={0}
        data-term={def}
      >
        {term}
      </span>
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/* ──────────────────────────────────────────────────────────────────────────
   Fuzzy search: typo-tolerant token matching with Levenshtein distance
   ────────────────────────────────────────────────────────────────────────── */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 1) return 2;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: FaqAccordion — collapsible Q&A blocks
   ────────────────────────────────────────────────────────────────────────── */

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="djac-docs-faq">
      {items.map((item, i) => (
        <details key={i} className="djac-docs-faq-item">
          <summary className="djac-docs-faq-q">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="min-w-0 flex-1">{item.q}</span>
            <ChevronDown className="djac-docs-faq-chevron h-4 w-4 text-muted-foreground shrink-0" />
          </summary>
          <p className="djac-docs-faq-a">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: SidebarFooter — language switcher + theme toggle
   ────────────────────────────────────────────────────────────────────────── */

const DOC_LANGUAGES = APP_LOCALES.map(code => ({
  code,
  label: LOCALE_LABELS[code],
}));

function SidebarFooter() {
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme, switchable } = useTheme();
  const ui = DOCS_UI[locale] ?? DOCS_UI.en;
  return (
    <div className="djac-docs-sidebar-footer">
      <div
        className="djac-docs-lang-switch"
        role="group"
        aria-label={ui.lang_aria}
      >
        {DOC_LANGUAGES.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            className={`djac-docs-lang-btn ${locale === l.code ? "active" : ""}`}
            aria-pressed={locale === l.code}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Globe className="h-3 w-3" />
          <span>{locale.toUpperCase()}</span>
        </span>
        {switchable && toggleTheme && (
          <button
            type="button"
            onClick={toggleTheme}
            className="djac-docs-action-btn djac-docs-action-btn-sm"
            title={
              theme === "dark" ? ui.theme_switch_light : ui.theme_switch_dark
            }
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            {theme === "dark" ? ui.theme_light : ui.theme_dark}
          </button>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: CodeBlock
   ────────────────────────────────────────────────────────────────────────── */

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);
  const lines = code.split("\n");
  return (
    <div className="relative my-4 rounded-lg border bg-zinc-950 dark:bg-zinc-900 overflow-hidden group">
      {lang && (
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800">
          <span className="text-xs font-mono text-zinc-400">{lang}</span>
          <button
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy code"}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
      <pre
        dir="ltr"
        className="p-4 overflow-x-auto overflow-y-auto text-sm leading-relaxed max-h-96"
      >
        <code className="font-mono text-zinc-200">
          {lines.map((line, i) => (
            <span key={i} className="djac-docs-code-line">
              <span className="djac-docs-code-lineno">{i + 1}</span>
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
      {!lang && (
        <button
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: Admonition
   ────────────────────────────────────────────────────────────────────────── */

function Admonition({ type, children }: { type: string; children: string }) {
  const { locale } = useLocale();
  const ui = DOCS_UI[locale] ?? DOCS_UI.en;
  const labels: Record<string, string> = {
    tip: ui.admon_tip,
    info: ui.admon_info,
    warning: ui.admon_warning,
    danger: ui.admon_danger,
  };
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    tip: Lightbulb,
    info: Info,
    warning: AlertTriangle,
    danger: X,
  };
  const Icon = icons[type] || Info;
  return (
    <div className={`djac-docs-admon admon-${type}`}>
      <div className="djac-docs-admon-header">
        <Icon className="h-4 w-4" />
        <span>{labels[type] || ui.admon_note}</span>
      </div>
      <p>{children}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Docs content availability notice — docs content exists in en/ar/zh only;
   other UI locales (fr/es/de/ja/ko/pt) are shown the English version and
   this explains why. Nothing renders for locales with full content.
   ────────────────────────────────────────────────────────────────────────── */

const DOCS_CONTENT_NOTICE: Record<string, string> = {
  fr: "Cette documentation est publiée en anglais, en arabe et en chinois. La version anglaise est affichée.",
  es: "Esta documentación se publica en inglés, árabe y chino. Se muestra la versión en inglés.",
  de: "Diese Dokumentation ist in Englisch, Arabisch und Chinesisch veröffentlicht. Die englische Version wird angezeigt.",
  ja: "このドキュメントは英語・アラビア語・中国語で公開されています。英語版を表示しています。",
  ko: "이 문서는 영어·아랍어·중국어로 게시됩니다. 영어 버전이 표시됩니다.",
  pt: "Esta documentação é publicada em inglês, árabe e chinês. A versão em inglês está sendo exibida.",
};

function DocsContentNotice() {
  const { locale } = useLocale();
  const notice = DOCS_CONTENT_NOTICE[locale];
  if (!notice) return null;
  return <Admonition type="info">{notice}</Admonition>;
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: BreadcrumbNav
   ────────────────────────────────────────────────────────────────────────── */

function BreadcrumbNav({
  section,
  page,
}: {
  section: DocSection | null;
  page: DocPage | null;
}) {
  const [, navigate] = useLocation();
  const { locale } = useLocale();
  const ui = DOCS_UI[locale] ?? DOCS_UI.en;
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <button
        onClick={() => navigate("/docs")}
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="h-3.5 w-3.5" />
        <span>{ui.docs}</span>
      </button>
      {section && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            onClick={() => navigate(`/docs/${section.id}`)}
            className="hover:text-foreground transition-colors"
          >
            {section.title}
          </button>
        </>
      )}
      {page && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{page.title}</span>
        </>
      )}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────────────────── */

export default function DocsPortal() {
  const { locale } = useLocale();
  const ui = DOCS_UI[locale] ?? DOCS_UI.en;
  usePageTitle(ui.docs_title);
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isRTL = locale === "ar";

  const sections = useMemo(() => getDocSections(locale), [locale]);

  const currentPath = location.replace("/docs", "").replace(/^\/+/, "");
  const [currentSectionId, currentPageId] = currentPath
    ? currentPath.split("/")
    : [null, null];
  const isHome = !currentSectionId && !currentPageId;

  const currentSection = useMemo(() => {
    if (!currentSectionId) return null;
    return sections.find(s => s.id === currentSectionId) || null;
  }, [sections, currentSectionId]);

  const currentPage = useMemo(() => {
    if (!currentSection || !currentPageId)
      return currentSection?.pages[0] || null;
    return (
      currentSection.pages.find(p => p.id === currentPageId) ||
      currentSection.pages[0]
    );
  }, [currentSection, currentPageId]);

  const toc = useMemo(
    () => (currentPage ? extractToc(currentPage.content) : []),
    [currentPage]
  );

  // Related pages — titles resolved from the current locale's data
  const relatedPageLinks = useMemo(() => {
    const ids = currentPageId ? RELATED_PAGE_IDS[currentPageId] : undefined;
    if (!ids) return null;
    const links: { title: string; path: string }[] = [];
    for (const id of ids) {
      for (const s of sections) {
        const p = s.pages.find(x => x.id === id);
        if (p) {
          links.push({ title: p.title, path: `/docs/${s.id}/${p.id}` });
          break;
        }
      }
    }
    return links.length > 0 ? links : null;
  }, [currentPageId, sections]);

  // Prev / Next navigation
  const { prevPage, nextPage, prevSection, nextSection } = useMemo(() => {
    if (!currentSection || !currentPage)
      return {
        prevPage: null,
        nextPage: null,
        prevSection: null,
        nextSection: null,
      };
    const secIdx = sections.indexOf(currentSection);
    const pageIdx = currentSection.pages.indexOf(currentPage);
    let prevPage: { sectionId: string; pageId: string; title: string } | null =
      null;
    let nextPage: { sectionId: string; pageId: string; title: string } | null =
      null;
    let prevSection: { id: string; title: string } | null = null;
    let nextSection: { id: string; title: string } | null = null;

    if (pageIdx > 0) {
      const p = currentSection.pages[pageIdx - 1];
      prevPage = { sectionId: currentSection.id, pageId: p.id, title: p.title };
    } else if (secIdx > 0) {
      const prevSec = sections[secIdx - 1];
      const lastPage = prevSec.pages[prevSec.pages.length - 1];
      prevPage = {
        sectionId: prevSec.id,
        pageId: lastPage.id,
        title: lastPage.title,
      };
      prevSection = { id: prevSec.id, title: prevSec.title };
    }

    if (pageIdx < currentSection.pages.length - 1) {
      const p = currentSection.pages[pageIdx + 1];
      nextPage = { sectionId: currentSection.id, pageId: p.id, title: p.title };
    } else if (secIdx < sections.length - 1) {
      const nextSec = sections[secIdx + 1];
      nextPage = {
        sectionId: nextSec.id,
        pageId: nextSec.pages[0].id,
        title: nextSec.pages[0].title,
      };
      nextSection = { id: nextSec.id, title: nextSec.title };
    }

    return { prevPage, nextPage, prevSection, nextSection };
  }, [currentSection, currentPage, sections]);

  const navigateToPage = useCallback(
    (sectionId: string, pageId: string) => {
      navigate(`/docs/${sectionId}/${pageId}`);
      setMobileSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigate]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sections;
    const tokens = query.split(/\s+/).filter(Boolean);

    const wordCache = new Map<string, Set<string>>();
    const wordsOf = (content: string): Set<string> => {
      let set = wordCache.get(content);
      if (!set) {
        set = new Set(content.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
        wordCache.set(content, set);
      }
      return set;
    };

    const pageScore = (
      title: string,
      summary: string,
      content: string
    ): number => {
      const tl = title.toLowerCase();
      const sl = summary.toLowerCase();
      const cl = content.toLowerCase();
      let score = 0;
      for (const tk of tokens) {
        if (tl.includes(tk)) score += 3;
        else if (sl.includes(tk)) score += 2;
        else if (cl.includes(tk)) score += 1;
        else {
          let fuzzyFound = false;
          if (tk.length >= 4) {
            for (const w of wordsOf(content)) {
              if (
                Math.abs(w.length - tk.length) <= 1 &&
                levenshtein(tk, w) <= 1
              ) {
                fuzzyFound = true;
                break;
              }
            }
          }
          if (!fuzzyFound) return 0;
          score += 1;
        }
      }
      return score;
    };

    return sections
      .map(s => {
        const scored = s.pages
          .map(p => ({ p, score: pageScore(p.title, p.summary, p.content) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(x => x.p);
        return scored.length ? { ...s, pages: scored } : null;
      })
      .filter((s): s is DocSection => s !== null);
  }, [sections, searchQuery]);

  useEffect(() => {
    if (currentSectionId) {
      setExpandedSections(prev => {
        if (prev.has(currentSectionId)) return prev;
        const next = new Set(prev);
        next.add(currentSectionId);
        return next;
      });
    }
  }, [currentSectionId]);

  // Persist per-page feedback votes + reset transient UI on navigation
  useEffect(() => {
    setShowShortcuts(false);
    setMobileTocOpen(false);
    setCopiedLink(false);
    setPaletteOpen(false);
    try {
      const saved = localStorage.getItem(
        `djac-doc-feedback:${currentPath || "home"}`
      );
      setFeedback(saved === "up" || saved === "down" ? saved : null);
    } catch {
      setFeedback(null);
    }
    if (currentPath) {
      try {
        const savedPos = Number(
          localStorage.getItem(`djac-doc-scroll:${currentPath}`) || "0"
        );
        if (savedPos > 300) {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: savedPos,
              behavior: "instant" as ScrollBehavior,
            });
          });
        }
      } catch {
        /* storage unavailable */
      }
    }
  }, [currentPath]);

  const voteFeedback = useCallback(
    (v: "up" | "down") => {
      setFeedback(v);
      try {
        localStorage.setItem(`djac-doc-feedback:${currentPath || "home"}`, v);
      } catch {
        /* storage unavailable */
      }
    },
    [currentPath]
  );

  const copyPageLink = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {});
  }, []);

  const paletteInputRef = useRef<HTMLInputElement>(null);

  const paletteResults = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    const flat = sections.flatMap(s =>
      s.pages.map(p => ({ section: s, page: p }))
    );
    if (!q) return flat;
    const tokens = q.split(/\s+/).filter(Boolean);
    return flat.filter(({ page }) => {
      const tl = page.title.toLowerCase();
      const sl = page.summary.toLowerCase();
      const cl = page.content.toLowerCase();
      const titleWords = new Set(tl.match(/[a-z0-9]{3,}/g) || []);
      return tokens.every(
        tk =>
          tl.includes(tk) ||
          sl.includes(tk) ||
          cl.includes(tk) ||
          (tk.length >= 4 &&
            [...titleWords].some(
              w =>
                Math.abs(w.length - tk.length) <= 1 && levenshtein(tk, w) <= 1
            ))
      );
    });
  }, [sections, paletteQuery]);

  const openPage = useCallback(
    (sectionId: string, pageId: string) => {
      setPaletteOpen(false);
      setPaletteQuery("");
      navigateToPage(sectionId, pageId);
    },
    [navigateToPage]
  );

  useEffect(() => {
    if (paletteOpen) {
      setPaletteQuery("");
      setPaletteIndex(0);
      requestAnimationFrame(() => paletteInputRef.current?.focus());
    }
  }, [paletteOpen]);

  const paletteOverlay = paletteOpen ? (
    <div
      className="djac-docs-palette-backdrop"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="djac-docs-palette"
        role="dialog"
        aria-modal="true"
        aria-label={ui.aria_search}
        onClick={e => e.stopPropagation()}
      >
        <div className="djac-docs-palette-input-wrap">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={paletteInputRef}
            value={paletteQuery}
            onChange={e => {
              setPaletteQuery(e.target.value);
              setPaletteIndex(0);
            }}
            placeholder={ui.palette_placeholder}
            className="djac-docs-palette-input"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="djac-docs-palette-results">
          {paletteResults.length === 0 ? (
            <div className="djac-docs-palette-empty">
              {ui.palette_empty.replace("{q}", paletteQuery)}
            </div>
          ) : (
            paletteResults.slice(0, 50).map((r, i) => {
              const SecIcon = ICONS[r.section.icon] || BookOpen;
              const active = i === paletteIndex;
              return (
                <button
                  key={`${r.section.id}-${r.page.id}`}
                  type="button"
                  onMouseEnter={() => setPaletteIndex(i)}
                  onClick={() => openPage(r.section.id, r.page.id)}
                  className={`djac-docs-palette-item ${active ? "djac-docs-palette-item-active" : ""}`}
                >
                  <SecIcon className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm truncate">
                      {highlightMatch(r.page.title, paletteQuery)}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {r.section.title} · {r.page.summary}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <div className="djac-docs-palette-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {ui.palette_navigate}
          </span>
          <span>
            <kbd>Enter</kbd> {ui.palette_open}
          </span>
          <span>
            <kbd>Esc</kbd> {ui.palette_close}
          </span>
        </div>
      </div>
    </div>
  ) : null;

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setShowShortcuts(false);
        setMobileTocOpen(false);
        setPaletteOpen(false);
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Command palette navigation
  useEffect(() => {
    if (!paletteOpen) return;
    function handlePaletteKeys(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPaletteIndex(i => Math.min(i + 1, paletteResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPaletteIndex(i => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = paletteResults[paletteIndex];
        if (r) openPage(r.section.id, r.page.id);
      }
    }
    window.addEventListener("keydown", handlePaletteKeys);
    return () => window.removeEventListener("keydown", handlePaletteKeys);
  }, [paletteOpen, paletteResults, paletteIndex, openPage]);

  // Arrow key navigation between pages
  useEffect(() => {
    if (isHome) return;
    function handleArrows(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowRight" && nextPage)
        navigateToPage(nextPage.sectionId, nextPage.pageId);
      if (e.key === "ArrowLeft" && prevPage)
        navigateToPage(prevPage.sectionId, prevPage.pageId);
    }
    window.addEventListener("keydown", handleArrows);
    return () => window.removeEventListener("keydown", handleArrows);
  }, [isHome, nextPage, prevPage, navigateToPage]);

  // Scroll progress + back-to-top + last-read position save
  const saveScrollTimer = useRef<number | undefined>(undefined);
  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;

  useEffect(() => {
    function handleScroll() {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight || document.body.scrollHeight;
      const clientHeight = h.clientHeight;
      const pct =
        scrollHeight > clientHeight
          ? Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100)
          : 0;
      setScrollProgress(pct);
      setShowBackTop(scrollTop > 400);
      if (currentPathRef.current) {
        window.clearTimeout(saveScrollTimer.current);
        saveScrollTimer.current = window.setTimeout(() => {
          try {
            localStorage.setItem(
              `djac-doc-scroll:${currentPathRef.current}`,
              String(window.scrollY)
            );
          } catch {
            /* storage unavailable */
          }
        }, 400);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(saveScrollTimer.current);
    };
  }, []);

  // Scroll-based active TOC tracking
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveTocId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    toc.forEach(entry => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc, currentPage]);

  /* ── Content Renderer ────────────────────────────────────────────────── */

  const renderContent = useCallback(
    (text: string) => {
      const lines = text.split("\n");
      const faqPattern = /^> \*\*(faq|answer)\*\* (.+)/;
      const blocks: (string | { faq: { q: string; a: string }[] })[] = [];
      let faqGroup: { q: string; a: string }[] = [];
      let inCode = false;
      for (const line of lines) {
        if (line.startsWith("```")) {
          inCode = !inCode;
          if (faqGroup.length) {
            blocks.push({ faq: faqGroup });
            faqGroup = [];
          }
          blocks.push(line);
          continue;
        }
        if (inCode) {
          blocks.push(line);
          continue;
        }
        const fm = line.match(faqPattern);
        if (fm) {
          if (fm[1] === "faq") {
            if (faqGroup.length) blocks.push({ faq: faqGroup });
            faqGroup = [{ q: fm[2], a: "" }];
          } else if (faqGroup.length) {
            const last = faqGroup[faqGroup.length - 1];
            last.a += (last.a ? " " : "") + fm[2];
          } else {
            faqGroup = [{ q: "", a: fm[2] }];
          }
          continue;
        }
        if (faqGroup.length) {
          blocks.push({ faq: faqGroup });
          faqGroup = [];
        }
        blocks.push(line);
      }
      if (faqGroup.length) blocks.push({ faq: faqGroup });

      const elements: React.ReactNode[] = [];
      let i = 0;
      let inCodeBlock = false;
      let codeBlockLines: string[] = [];
      let codeBlockLang = "";

      const flushCodeBlock = () => {
        if (codeBlockLines.length > 0) {
          elements.push(
            <CodeBlock
              key={`code-${i}`}
              code={codeBlockLines.join("\n")}
              lang={codeBlockLang || undefined}
            />
          );
          codeBlockLines = [];
          codeBlockLang = "";
        }
        inCodeBlock = false;
      };

      const boldify = (t: string): React.ReactNode => {
        const parts = t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pi} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={pi}
                className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[0.85em] font-mono text-foreground"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={pi}>{glossifyText(part, locale)}</span>;
        });
      };

      for (; i < blocks.length; i++) {
        const block = blocks[i];
        if (typeof block !== "string") {
          elements.push(<FaqAccordion key={`faq-${i}`} items={block.faq} />);
          continue;
        }
        const line = block;

        // Code blocks
        if (line.startsWith("```")) {
          if (inCodeBlock) {
            flushCodeBlock();
          } else {
            inCodeBlock = true;
            codeBlockLang = line.slice(3).trim();
          }
          continue;
        }
        if (inCodeBlock) {
          codeBlockLines.push(line);
          continue;
        }

        if (!line.trim()) {
          elements.push(<div key={i} className="h-3" />);
          continue;
        }

        // Admonitions
        const admonMatch = line.match(
          /^> \*\*(tip|info|warning|danger)\*\* (.+)/
        );
        if (admonMatch) {
          elements.push(
            <Admonition key={i} type={admonMatch[1]}>
              {admonMatch[2]}
            </Admonition>
          );
          continue;
        }

        // Headings with anchor IDs
        const h3Match = line.match(/^### (.+)/);
        const h4Match = line.match(/^#### (.+)/);
        if (h3Match) {
          const text = h3Match[1];
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
            .replace(/^-|-$/g, "");
          elements.push(
            <h3
              key={i}
              id={id}
              className="djac-docs-h3 text-foreground mt-10 mb-3 font-semibold text-lg group"
            >
              <a
                href={`#${id}`}
                className="djac-docs-heading-anchor"
                aria-label={`Link to ${text}`}
              >
                {boldify(text)}
                <Hash className="djac-docs-heading-hash" />
              </a>
            </h3>
          );
          continue;
        }
        if (h4Match) {
          const text = h4Match[1];
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
            .replace(/^-|-$/g, "");
          elements.push(
            <h4
              key={i}
              id={id}
              className="text-base font-semibold text-foreground mt-8 mb-2 group"
            >
              <a
                href={`#${id}`}
                className="djac-docs-heading-anchor"
                aria-label={`Link to ${text}`}
              >
                {boldify(text)}
                <Hash className="djac-docs-heading-hash" />
              </a>
            </h4>
          );
          continue;
        }

        // Bold list items with checkmark
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*(.+)/);
          if (match) {
            elements.push(
              <div
                key={i}
                className="flex items-start gap-2 ml-2 my-1 text-sm djac-body"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <strong>{match[1]}</strong>
                  {match[2]}
                </span>
              </div>
            );
            continue;
          }
        }

        // Regular list items
        if (line.startsWith("- ")) {
          elements.push(
            <div
              key={i}
              className="flex items-start gap-2 ml-2 my-0.5 text-sm djac-body"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{boldify(line.replace("- ", ""))}</span>
            </div>
          );
          continue;
        }

        // Tables
        if (line.startsWith("| ")) {
          const cells = line
            .split("|")
            .filter(Boolean)
            .map(c => c.trim());
          const isSep = cells.every(c => /^-{3,}$/.test(c));
          if (isSep) continue;
          elements.push(
            <div
              key={i}
              className="grid text-sm djac-body gap-2 py-1.5 px-3 border-t border-border/50"
              style={{
                gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((cell, ci) => (
                <span key={ci}>{boldify(cell)}</span>
              ))}
            </div>
          );
          continue;
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1] || "";
          const rest = line.replace(/^\d+\.\s*/, "");
          elements.push(
            <div
              key={i}
              className="flex items-start gap-2 ml-2 my-1 text-sm djac-body"
            >
              <span className="font-semibold text-primary w-5 shrink-0">
                {num}.
              </span>
              <span>{boldify(rest)}</span>
            </div>
          );
          continue;
        }

        elements.push(
          <p key={i} className="text-sm djac-body my-1">
            {boldify(line)}
          </p>
        );
      }

      flushCodeBlock();
      return elements;
    },
    [locale]
  );

  /* ────────────────────────────────────────────────────────────────────────
     Home Landing Page
     ──────────────────────────────────────────────────────────────────────── */

  if (isHome) {
    return (
      <div className="djac-page djac-docs-portal" dir={isRTL ? "rtl" : "ltr"}>
        <div className="djac-docs-mobile-toggle">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            {mobileSidebarOpen ? ui.close_menu : ui.mobile_menu}
          </Button>
        </div>

        <div className="djac-docs-layout">
          {/* Home Sidebar */}
          <aside
            className={`djac-docs-sidebar ${mobileSidebarOpen ? "djac-docs-sidebar-open" : ""}`}
          >
            <div className="djac-docs-sidebar-header">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">
                  {ui.sidebar_title}
                </span>
              </div>
              {searchQuery && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {filteredSections.reduce((s, sec) => s + sec.pages.length, 0)}
                </Badge>
              )}
            </div>
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder={ui.search_placeholder}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
                <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border hidden sm:block">
                  ⌘K
                </kbd>
              </div>
            </div>
            <nav className="djac-docs-nav">
              {filteredSections.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Search className="h-6 w-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    {ui.no_results}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setExpandAll(false);
                      setExpandedSections(new Set(["getting-started"]));
                    }}
                  >
                    {ui.clear_search}
                  </Button>
                </div>
              ) : (
                filteredSections.map(section => {
                  const isExpanded =
                    expandAll || expandedSections.has(section.id);
                  const SecIcon = ICONS[section.icon] || BookOpen;
                  return (
                    <div key={section.id} className="mb-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="djac-docs-section-btn"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <SecIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{section.title}</span>
                      </button>
                      {isExpanded && (
                        <div className="ml-2">
                          {section.pages.map(page => (
                            <SidebarPageRow
                              key={page.id}
                              page={page}
                              query={searchQuery}
                              active={false}
                              onClick={() =>
                                navigateToPage(section.id, page.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
            <SidebarFooter />
          </aside>

          {/* Home Content */}
          <main className="djac-docs-content">
            <div className="max-w-4xl">
              <DocsContentNotice />
              {/* Hero */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {locale.toUpperCase()}
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                  {ui.hero_title}
                </h1>
                <p className="text-base text-muted-foreground max-w-2xl">
                  {ui.hero_sub}
                </p>
                <div className="flex flex-wrap gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">
                        {sections.length}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {ui.stat_sections}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">
                        {sections.reduce((s, sec) => s + sec.pages.length, 0)} +
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {ui.stat_pages}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">9</span>{" "}
                      <span className="text-muted-foreground">
                        {ui.stat_languages}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Code className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">200+</span>{" "}
                      <span className="text-muted-foreground">
                        {ui.stat_api}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    onClick={() => navigate("/docs/getting-started/welcome")}
                  >
                    {ui.get_started}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate("/docs/api-integration/api-reference")
                    }
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    {ui.api_reference}
                  </Button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {(HOME_FEATURES[locale] ?? HOME_FEATURES.en).map(f => {
                  const FIcon = ICONS[f.icon] || BookOpen;
                  return (
                    <button
                      key={f.title}
                      onClick={() => navigate(f.link)}
                      className="djac-glass-card p-5 text-left hover:border-primary/40 transition-all hover:shadow-lg group cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                        <FIcon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Quick Links */}
              <div className="mb-12">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  {ui.quick_links}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(QUICK_LINKS[locale] ?? QUICK_LINKS.en).map(link => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-sm"
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guided Path */}
              <div className="mb-12">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  {ui.guided_title}
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/docs/getting-started/welcome")}
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        {ui.guided_1_title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {ui.guided_1_desc}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                  <button
                    onClick={() => navigate("/docs/ai-engine/ai-overview")}
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        {ui.guided_2_title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {ui.guided_2_desc}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                  <button
                    onClick={() =>
                      navigate("/docs/vendor-risk/vendor-assessment")
                    }
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        {ui.guided_3_title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {ui.guided_3_desc}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="djac-docs-next">
                <h3 className="text-lg font-bold mb-3">{ui.cta_ready}</h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("/signup")}>
                    {ui.cta_trial}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/pricing")}
                  >
                    {ui.cta_pricing}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
        {paletteOverlay}
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────────────
     Content Page
     ──────────────────────────────────────────────────────────────────────── */

  if (!currentSection || !currentPage) {
    return null;
  }

  return (
    <div className="djac-page djac-docs-portal" dir={isRTL ? "rtl" : "ltr"}>
      {/* Scroll Progress Bar */}
      <div
        className="djac-docs-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      <div className="djac-docs-mobile-toggle">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          {mobileSidebarOpen ? ui.close_menu : ui.mobile_menu}
        </Button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="djac-docs-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="djac-docs-layout">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          className={`djac-docs-sidebar ${mobileSidebarOpen ? "djac-docs-sidebar-open" : ""}`}
        >
          <div className="djac-docs-sidebar-header">
            <button
              onClick={() => navigate("/docs")}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">{ui.sidebar_title}</span>
            </button>
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {filteredSections.reduce((s, sec) => s + sec.pages.length, 0)}
              </Badge>
            )}
          </div>
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder={ui.search_placeholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
              <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border hidden sm:block">
                ⌘K
              </kbd>
            </div>
          </div>
          {filteredSections.length > 1 && (
            <button
              onClick={() => {
                setExpandAll(!expandAll);
                if (!expandAll)
                  setExpandedSections(new Set(sections.map(s => s.id)));
                else setExpandedSections(new Set());
              }}
              className="w-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 justify-center"
              aria-label={expandAll ? ui.collapse_all : ui.expand_all}
            >
              <ChevronsUpDown className="h-3 w-3" />
              {expandAll ? ui.collapse_all : ui.expand_all}
            </button>
          )}
          <nav className="djac-docs-nav">
            {filteredSections.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="h-6 w-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-1">
                  {ui.no_results}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {ui.try_different}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setExpandAll(false);
                    setExpandedSections(new Set(["getting-started"]));
                  }}
                >
                  {ui.clear_search}
                </Button>
              </div>
            ) : (
              filteredSections.map(section => {
                const isExpanded =
                  expandAll || expandedSections.has(section.id);
                const isActive = currentSectionId === section.id;
                const SecIcon = ICONS[section.icon] || BookOpen;
                return (
                  <div key={section.id} className="mb-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className={`djac-docs-section-btn ${isActive ? "djac-docs-section-active" : ""}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <SecIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </button>
                    {isExpanded && (
                      <div className="ml-2">
                        {section.pages.map(page => (
                          <SidebarPageRow
                            key={page.id}
                            page={page}
                            query={searchQuery}
                            active={
                              currentPageId === page.id &&
                              currentSectionId === section.id
                            }
                            onClick={() => navigateToPage(section.id, page.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
          <SidebarFooter />
        </aside>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="djac-docs-content" ref={contentRef}>
          <article className="djac-docs-page-wrapper">
            {/* Breadcrumbs */}
            <BreadcrumbNav section={currentSection} page={currentPage} />
            <DocsContentNotice />

            {/* Header */}
            <div className="djac-docs-section-header">
              <h1 className="djac-display text-2xl sm:text-3xl font-bold">
                {currentPage.title}
              </h1>
              <p className="text-sm djac-body text-muted-foreground mt-2 max-w-3xl">
                {currentPage.summary}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.max(
                    1,
                    Math.ceil(currentPage.content.split(/\s+/).length / 200)
                  )}{" "}
                  {ui.min_read}
                </span>
              </div>
              <div className="relative flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={copyPageLink}
                  className="djac-docs-action-btn"
                  aria-label={ui.aria_copy}
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {copiedLink ? ui.link_copied : ui.copy_link}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="djac-docs-action-btn"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {ui.print_page}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(s => !s)}
                  className="djac-docs-action-btn"
                  aria-expanded={showShortcuts}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  {ui.shortcuts}
                </button>
                {showShortcuts && (
                  <div className="djac-docs-shortcuts">
                    <table>
                      <tbody>
                        <tr>
                          <td>
                            <kbd>⌘/Ctrl</kbd> + <kbd>K</kbd>
                          </td>
                          <td>{ui.sh_focus}</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>→</kbd> / <kbd>←</kbd>
                          </td>
                          <td>{ui.sh_prev}</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>Esc</kbd>
                          </td>
                          <td>{ui.sh_close}</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>#</kbd> anchor links
                          </td>
                          <td>{ui.sh_jump}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile TOC (below xl) */}
            {toc.length >= 3 && (
              <div className="djac-docs-toc-mobile xl:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(o => !o)}
                  className="djac-docs-toc-mobile-toggle"
                  aria-expanded={mobileTocOpen}
                >
                  <span className="flex items-center gap-2">
                    <List className="h-3.5 w-3.5" />
                    {ui.on_this_page}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${mobileTocOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileTocOpen && (
                  <ul>
                    {toc.map(entry => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className={
                            activeTocId === entry.id ? "toc-active" : ""
                          }
                          style={{
                            paddingLeft: entry.level === 3 ? 8 : 20,
                          }}
                          onClick={e => {
                            e.preventDefault();
                            setMobileTocOpen(false);
                            document
                              .getElementById(entry.id)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          {entry.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Body + TOC Grid */}
            <div className="djac-docs-body-grid">
              {/* Article */}
              <div className="djac-docs-article">
                {useMemo(
                  () => renderContent(currentPage.content),
                  [currentPage.content, renderContent]
                )}
              </div>

              {/* Right TOC (desktop) */}
              {toc.length >= 3 && (
                <nav className="djac-docs-toc hidden xl:block">
                  <div className="sticky top-24">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      {ui.on_this_page}
                    </h4>
                    <ul className="space-y-0.5">
                      {toc.map(entry => (
                        <li key={entry.id}>
                          <a
                            href={`#${entry.id}`}
                            onClick={e => {
                              e.preventDefault();
                              document
                                .getElementById(entry.id)
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className={`block text-xs py-1 transition-colors border-l-2 ${
                              entry.level === 3 ? "pl-3" : "pl-6"
                            } ${
                              activeTocId === entry.id
                                ? "text-primary border-primary font-medium"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                            }`}
                          >
                            {entry.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                      {ui.back_to_top}
                    </button>
                  </div>
                </nav>
              )}
            </div>

            {/* Diagram */}
            {currentPage.diagram && (
              <div className="djac-docs-diagram">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">
                    {ui.architecture_diagram}
                  </span>
                </div>
                <div className="djac-glass-card p-4 text-center text-sm font-mono text-foreground">
                  {currentPage.diagram}
                </div>
              </div>
            )}

            {/* Case Study */}
            {currentPage.caseStudy && (
              <div className="djac-docs-casestudy">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h2 className="djac-h2 text-xl font-bold">{ui.case_study}</h2>
                  <Badge variant="outline" className="ml-2">
                    {currentPage.caseStudy.company}
                  </Badge>
                </div>
                <div className="djac-docs-casestudy-grid">
                  <div className="djac-glass-card p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {ui.challenge}
                    </h4>
                    <p className="text-sm djac-body">
                      {currentPage.caseStudy.challenge}
                    </p>
                  </div>
                  <div className="djac-glass-card p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      {ui.solution}
                    </h4>
                    <p className="text-sm djac-body">
                      {currentPage.caseStudy.solution}
                    </p>
                  </div>
                  <div className="djac-glass-card p-4 md:col-span-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {ui.results}
                    </h4>
                    <p className="text-sm djac-body">
                      {currentPage.caseStudy.results}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Steps */}
            {currentPage.demoSteps && currentPage.demoSteps.length > 0 && (
              <div className="djac-docs-demo">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="h-5 w-5 text-primary" />
                  <h2 className="djac-h2 text-xl font-bold">{ui.demo_guide}</h2>
                </div>
                <div className="space-y-3">
                  {currentPage.demoSteps.map((step, i) => (
                    <div
                      key={i}
                      className="djac-glass-card p-4 flex items-start gap-3"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm djac-body pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Practices */}
            {currentPage.bestPractices &&
              currentPage.bestPractices.length > 0 && (
                <div className="djac-docs-best-practices">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <h2 className="djac-h2 text-xl font-bold">
                      {ui.best_practices}
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {currentPage.bestPractices.map((bp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm djac-body">{bp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Troubleshooting */}
            {currentPage.troubleshooting &&
              currentPage.troubleshooting.length > 0 && (
                <div className="djac-docs-troubleshoot">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h2 className="djac-h2 text-xl font-bold">
                      {ui.troubleshooting}
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {currentPage.troubleshooting.map((item, i) => (
                      <div key={i} className="djac-glass-card p-4 space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <span className="text-amber-500">{ui.q}:</span>{" "}
                          {item.problem}
                        </h4>
                        <p className="text-sm djac-body flex items-start gap-2">
                          <span className="text-emerald-500 font-semibold">
                            {ui.a}:
                          </span>{" "}
                          {item.solution}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* ── Prev / Next Navigation ───────────────────────────────── */}
            <div className="djac-docs-prevnext">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {prevPage ? (
                  <button
                    onClick={() =>
                      navigateToPage(prevPage!.sectionId, prevPage!.pageId)
                    }
                    className="flex items-start gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-left group flex-1 min-w-0"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        {ui.previous}
                        {prevSection ? ` (${prevSection?.title})` : ""}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {prevPage.title}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                {nextPage && (
                  <button
                    onClick={() =>
                      navigateToPage(nextPage!.sectionId, nextPage!.pageId)
                    }
                    className="flex items-start gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-right group flex-1 min-w-0 justify-end"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        {ui.next}
                        {nextSection ? ` (${nextSection?.title})` : ""}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {nextPage.title}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Page Nav Tabs */}
            <div className="djac-docs-page-nav">
              {currentSection.pages.map((page, i) => {
                const isActive = currentPageId === page.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => navigateToPage(currentSection.id, page.id)}
                    className={`djac-docs-page-nav-btn ${isActive ? "djac-docs-page-nav-active" : ""}`}
                  >
                    <span className="text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm truncate">{page.title}</span>
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="djac-docs-next">
              <div className="djac-docs-feedback">
                <span className="text-sm text-muted-foreground mr-3">
                  {ui.helpful}
                </span>
                <button
                  onClick={() => voteFeedback("up")}
                  className={`djac-docs-feedback-btn ${feedback === "up" ? "djac-docs-feedback-active bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" : ""}`}
                  aria-label={ui.aria_helpful}
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => voteFeedback("down")}
                  className={`djac-docs-feedback-btn ${feedback === "down" ? "djac-docs-feedback-active bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700" : ""}`}
                  aria-label={ui.aria_unhelpful}
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                {feedback && (
                  <span className="text-xs text-muted-foreground ml-3">
                    {feedback === "up" ? ui.thanks_up : ui.thanks_down}
                  </span>
                )}
              </div>
              {relatedPageLinks ? (
                <div className="mt-6 pt-5 border-t">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    {ui.related}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedPageLinks.map(r => (
                      <button
                        key={r.path}
                        onClick={() => navigate(r.path)}
                        className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/40 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <h3 className="text-lg font-bold mb-3 mt-5">{ui.cta_ready}</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/signup")}>
                  {ui.cta_trial}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/pricing")}>
                  {ui.cta_pricing}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/docs/getting-started/welcome")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {ui.cta_guide}
                </Button>
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* Back to top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`djac-docs-backtop ${showBackTop ? "djac-docs-backtop-visible" : ""}`}
        aria-label={ui.aria_backtop}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
      {paletteOverlay}
    </div>
  );
}
